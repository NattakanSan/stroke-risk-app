"""
train_model.py
เทรนโมเดลพยากรณ์ stroke จาก data/healthcare-dataset-stroke-data.csv จริง
รันครั้งนี้ (และรันซ้ำได้ทุกครั้งที่เปลี่ยนข้อมูล/พารามิเตอร์):

    python train_model.py

ผลลัพธ์จะถูกบันทึกไว้ในโฟลเดอร์ model/:
  - model.pkl, meta.json, metrics.json, feature_importance.json
    -> ใช้โดย app.py ฝั่งเว็บแอป Flask+HTML/JS เดิม (โมเดลเดียว = Random Forest)
  - models/<id>.pkl (4 ไฟล์) + models_comparison.json + roc_curve.json
    -> ใช้โดยหน้าเว็บ React (Model Performance / Settings) ที่เทียบ 4 อัลกอริทึมจริง
  - dataset_summary.json + distributions.json
    -> ใช้โดยหน้าเว็บ React (Dashboard / Dataset) แทนตัวเลขสมมติที่เคย hardcode ไว้
"""
import json
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_sample_weight
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, roc_curve, confusion_matrix, classification_report,
)

from model_utils import dataframe_to_matrix, FEATURE_ORDER

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "healthcare-dataset-stroke-data.csv"
MODEL_DIR = BASE_DIR / "model"
MODELS_SUBDIR = MODEL_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)
MODELS_SUBDIR.mkdir(exist_ok=True)

CLASSIFY_THRESHOLD = 0.45  # เกณฑ์ตัดสิน stroke=1 (ตรงกับข้อความ "Threshold: 0.45" ที่โชว์ในหน้า React)

# ปัจจัยหลัก 6 อย่างที่ใช้แสดงในแผง Explainable AI ของหน้า Prediction (React)
CORE_FACTORS_TH = {
    "age": "อายุ (Age)",
    "avg_glucose_level": "ระดับน้ำตาลเฉลี่ย (Avg Glucose)",
    "hypertension": "โรคความดันโลหิตสูง (Hypertension)",
    "heart_disease": "โรคหัวใจ (Heart Disease)",
    "bmi": "ดัชนีมวลกาย (BMI)",
    "smoking_status": "ประวัติการสูบบุหรี่ (Smoking Status)",
}

# กลุ่มปัจจัยระดับ "หมวดใหญ่" 8 อย่างสำหรับแผง Feature Importance ของ Dashboard (React)
TOP_LEVEL_FEATURES_TH = {
    "age": "อายุ (Age)",
    "avg_glucose_level": "ระดับน้ำตาลเฉลี่ย (Glucose)",
    "bmi": "ดัชนีมวลกาย (BMI)",
    "hypertension": "โรคความดันโลหิตสูง",
    "heart_disease": "โรคหัวใจ",
    "smoking_status": "ประวัติการสูบบุหรี่",
    "work_type": "ลักษณะการทำงาน",
    "residence_urban": "พื้นที่อยู่อาศัย (Urban/Rural)",
}
TOP_LEVEL_COLORS = {
    "age": "#3B82F6", "avg_glucose_level": "#06B6D4", "bmi": "#8B5CF6",
    "hypertension": "#EC4899", "heart_disease": "#F43F5E",
    "smoking_status": "#F59E0B", "work_type": "#10B981", "residence_urban": "#64748B",
}
TOP_LEVEL_NOTES_TH = {
    "age": "ปัจจัยเสี่ยงสูงสุด ผู้ที่มีอายุมากขึ้นมีโอกาสพบภาวะสูงขึ้นอย่างมีนัยสำคัญ",
    "avg_glucose_level": "ภาวะน้ำตาลในเลือดสูงส่งผลต่อหลอดเลือดเปราะแตกง่าย",
    "bmi": "ภาวะน้ำหนักเกินและโรคอ้วนสัมพันธ์กับความดันและไขมัน",
    "hypertension": "เพิ่มแรงดันต่อผนังหลอดเลือดสมองโดยตรง",
    "heart_disease": "ลิ่มเลือดจากหัวใจอาจหลุดไปอุดตันในหลอดเลือดสมอง",
    "smoking_status": "สารนิโคตินและทาร์เร่งการตีบตันของผนังหลอดเลือด",
    "work_type": "ความเครียดและระดับกิจกรรมทางกายภาพในแต่ละอาชีพ",
    "residence_urban": "การเข้าถึงระบบบริการสุขภาพและวิถีชีวิต",
}


def aggregate_top_level_importance(feature_importance: dict) -> dict:
    """รวม importance ของ one-hot ย่อย (work_*, smoke_*) กลับเป็นหมวดใหญ่เดียว"""
    agg = {k: 0.0 for k in TOP_LEVEL_FEATURES_TH}
    for name, val in feature_importance.items():
        if name.startswith("work_"):
            agg["work_type"] += val
        elif name.startswith("smoke_"):
            agg["smoking_status"] += val
        elif name in agg:
            agg[name] += val
    return agg


def get_model_importance(model, model_id: str) -> dict:
    """คืนค่า importance ต่อฟีเจอร์ (raw, ยังไม่รวมหมวด) ไม่ว่าโมเดลจะเป็น tree-based หรือ linear"""
    if hasattr(model, "feature_importances_"):
        raw = model.feature_importances_
    else:  # Logistic Regression: ใช้ |coefficient| แล้ว normalize ให้รวม = 1 เหมือน feature_importances_
        coef = np.abs(model.coef_[0])
        raw = coef / (coef.sum() or 1.0)
    return dict(zip(FEATURE_ORDER, raw.tolist()))


def build_factor_explanation(feature: str, value: float, is_driver: bool) -> str:
    explanations = {
        "age": "อายุเกิน 55 ปี เป็นปัจจัยหลักที่ส่งผลต่อการเสื่อมของหลอดเลือด" if is_driver
               else "อายุอยู่ในเกณฑ์ที่ความเสี่ยงหลอดเลือดสมองยังต่ำ",
        "avg_glucose_level": "ระดับน้ำตาลสูงกว่าเกณฑ์ปกติ ส่งผลต่อผนังหลอดเลือดเปราะ" if is_driver
                              else "ระดับน้ำตาลอยู่ในเกณฑ์ที่ควบคุมได้ดี",
        "hypertension": "ภาวะความดันโลหิตสูงเป็นปัจจัยเร่งหลักที่ทำให้เส้นเลือดในสมองแตกหรือตีบ" if is_driver
                        else "ไม่มีภาวะความดันสูง ช่วยลดแรงดันในหลอดเลือด",
        "heart_disease": "ลิ่มเลือดจากหัวใจอาจหลุดไปอุดตันในเส้นเลือดสมอง (Embolic Stroke)" if is_driver
                          else "ระบบหลอดเลือดหัวใจปกติ ไม่พบความเสี่ยงลิ่มเลือด",
        "bmi": "อยู่ในภาวะโรคอ้วน มีความสัมพันธ์กับภาวะหลอดเลือดแดงแข็ง" if is_driver
               else "ดัชนีมวลกายอยู่ในเกณฑ์ปกติหรือเกินเล็กน้อย",
        "smoking_status": "สารพิษในบุหรี่ทำลายเยื่อบุหลอดเลือดและเร่งการเกาะตัวของคราบไขมัน" if is_driver
                           else "การไม่สูบบุหรี่ช่วยรักษาความยืดหยุ่นของหลอดเลือด",
    }
    return explanations.get(feature, "")


def main():
    df = pd.read_csv(DATA_PATH)
    print(f"โหลดข้อมูล {len(df)} แถว | stroke=1 จำนวน {int(df['stroke'].sum())} แถว "
          f"({df['stroke'].mean() * 100:.2f}%)")

    bmi_median = float(df["bmi"].median())
    continuous_ranges = {
        "age": {"min": float(df["age"].min()), "max": float(df["age"].max())},
        "avg_glucose_level": {"min": float(df["avg_glucose_level"].min()), "max": float(df["avg_glucose_level"].max())},
        "bmi": {"min": float(df["bmi"].min(skipna=True)), "max": float(df["bmi"].max(skipna=True))},
    }

    X = dataframe_to_matrix(df, bmi_median)
    y = df["stroke"].to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y, shuffle=True
    )
    sample_weight_train = compute_sample_weight("balanced", y_train)

    # =========================================================
    # 1) โมเดลหลัก (Random Forest) — ใช้โดยเว็บแอป Flask+HTML/JS เดิม
    # =========================================================
    rf_legacy = RandomForestClassifier(
        n_estimators=300, max_depth=8, min_samples_leaf=3,
        class_weight="balanced", random_state=42, n_jobs=-1,
    )
    rf_legacy.fit(X_train, y_train)
    y_pred = rf_legacy.predict(X_test)
    y_proba = rf_legacy.predict_proba(X_test)[:, 1]
    legacy_metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1": round(f1_score(y_test, y_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "n_train": int(len(y_train)), "n_test": int(len(y_test)),
        "positive_rate_pct": round(float(y.mean()) * 100, 2),
    }
    legacy_importance = dict(sorted(
        get_model_importance(rf_legacy, "random-forest").items(), key=lambda kv: kv[1], reverse=True
    ))
    joblib.dump(rf_legacy, MODEL_DIR / "model.pkl")
    (MODEL_DIR / "metrics.json").write_text(json.dumps(legacy_metrics, indent=2, ensure_ascii=False), encoding="utf-8")
    (MODEL_DIR / "feature_importance.json").write_text(json.dumps(legacy_importance, indent=2, ensure_ascii=False), encoding="utf-8")
    (MODEL_DIR / "meta.json").write_text(json.dumps(
        {"bmi_median": bmi_median, "continuous_ranges": continuous_ranges}, indent=2
    ), encoding="utf-8")
    print("\n[legacy Flask+HTML app] Random Forest -> accuracy={accuracy}, recall={recall}, roc_auc={roc_auc}".format(**legacy_metrics))
    print(classification_report(y_test, y_pred, target_names=["No Stroke", "Stroke"]))

    # =========================================================
    # 2) 4 โมเดลจริงสำหรับหน้าเว็บ React (Model Performance / Settings)
    #    ทุกโมเดลตัดสิน stroke=1 ที่ threshold เดียวกัน (0.45) เพื่อเทียบกันตรงๆ
    # =========================================================
    model_specs = [
        {
            "id": "random-forest",
            "name": "Random Forest Classifier",
            "nameThai": "โมเดลสุ่มต้นไม้หลายชุด (Random Forest)",
            "isDefault": True,
            "pros": "จัดการความสัมพันธ์แบบไม่เป็นเชิงเส้นได้ดีเยี่ยม ทนต่อ Outlier และให้ค่า Feature Importance ที่แม่นยำ",
            "cons": "ใช้หน่วยความจำสูงกว่า Linear Model และมีความซับซ้อนในการอธิบายผลระดับตัวแปรเดี่ยว",
            "make": lambda: RandomForestClassifier(
                n_estimators=300, max_depth=8, min_samples_leaf=3,
                class_weight="balanced", random_state=42, n_jobs=-1,
            ),
            "uses_sample_weight": False,
        },
        {
            "id": "logistic-regression",
            "name": "Logistic Regression (Balanced)",
            "nameThai": "การถดถอยโลจิสติก (Logistic Regression)",
            "isDefault": False,
            "pros": "คำนวณเร็วมาก สามารถแปลผลสัมประสิทธิ์ (Odds Ratio) ได้ชัดเจน เหมาะเป็นเกณฑ์มาตรฐาน (Baseline)",
            "cons": "ไม่สามารถจับความสัมพันธ์แบบซับซ้อน (Non-linear interactions) ได้เท่าโมเดลกลุ่ม Tree",
            "make": lambda: LogisticRegression(class_weight="balanced", max_iter=2000),
            "uses_sample_weight": False,
        },
        {
            "id": "decision-tree",
            "name": "Decision Tree (CART)",
            "nameThai": "ต้นไม้ตัดสินใจ (Decision Tree)",
            "isDefault": False,
            "pros": "เข้าใจง่าย สามารถแปลงโครงสร้างเป็นกฎ If-Else ทางคลินิกได้",
            "cons": "มีโอกาสเกิด Overfitting ได้ง่าย ไวต่อการเปลี่ยนแปลงเล็กน้อยของชุดข้อมูล",
            "make": lambda: DecisionTreeClassifier(max_depth=6, min_samples_leaf=8, class_weight="balanced", random_state=42),
            "uses_sample_weight": False,
        },
        {
            # หมายเหตุ: เครื่องนี้ไม่มีไลบรารี xgboost ติดตั้งไว้ จึงใช้ Gradient Boosting ของ
            # scikit-learn แทนอย่างตรงไปตรงมา (ไม่ใช่ XGBoost จริง) ผลลัพธ์เป็นของจริงจากข้อมูลจริง
            # แต่ชื่อโมเดลตั้งให้ตรงกับสิ่งที่ใช้จริง หากต้องการ XGBoost จริงสามารถ pip install xgboost เพิ่มได้
            "id": "gradient-boosting",
            "name": "Gradient Boosting Classifier",
            "nameThai": "เกรเดียนต์บูสติง (Gradient Boosting)",
            "isDefault": False,
            "pros": "ประสิทธิภาพการทำนายสูง ปรับปรุงจุดผิดพลาดของต้นไม้ก่อนหน้าไปเรื่อยๆ",
            "cons": "เทรนช้ากว่า Random Forest และไวต่อการปรับ hyperparameter",
            "make": lambda: GradientBoostingClassifier(n_estimators=150, max_depth=3, random_state=42),
            "uses_sample_weight": True,  # ไม่มี class_weight param เลยใช้ sample_weight แทน
        },
    ]

    models_comparison = []
    roc_points_by_model = {}

    for spec in model_specs:
        t0 = time.perf_counter()
        clf = spec["make"]()
        if spec["uses_sample_weight"]:
            clf.fit(X_train, y_train, sample_weight=sample_weight_train)
        else:
            clf.fit(X_train, y_train)
        train_time = time.perf_counter() - t0

        proba = clf.predict_proba(X_test)[:, 1]
        pred_at_threshold = (proba >= CLASSIFY_THRESHOLD).astype(int)

        cm = confusion_matrix(y_test, pred_at_threshold, labels=[0, 1])
        tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])

        models_comparison.append({
            "id": spec["id"],
            "name": spec["name"],
            "nameThai": spec["nameThai"],
            "accuracy": round(accuracy_score(y_test, pred_at_threshold) * 100, 1),
            "precision": round(precision_score(y_test, pred_at_threshold, zero_division=0) * 100, 1),
            "recall": round(recall_score(y_test, pred_at_threshold, zero_division=0) * 100, 1),
            "f1Score": round(f1_score(y_test, pred_at_threshold, zero_division=0) * 100, 1),
            "rocAuc": round(roc_auc_score(y_test, proba), 3),
            "trainingTime": f"{train_time:.2f}s",
            "isDefault": spec["isDefault"],
            "pros": spec["pros"],
            "cons": spec["cons"],
            "confusionMatrix": {
                "trueNegative": tn, "falsePositive": fp, "falseNegative": fn, "truePositive": tp,
                "totalTest": int(len(y_test)),
            },
        })

        fpr, tpr, _ = roc_curve(y_test, proba)
        roc_points_by_model[spec["id"]] = (fpr, tpr)

        joblib.dump(clf, MODELS_SUBDIR / f"{spec['id']}.pkl")
        model_importance = get_model_importance(clf, spec["id"])
        (MODELS_SUBDIR / f"{spec['id']}_importance.json").write_text(
            json.dumps(model_importance, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(f"[{spec['id']}] accuracy={models_comparison[-1]['accuracy']}% "
              f"recall={models_comparison[-1]['recall']}% roc_auc={models_comparison[-1]['rocAuc']} "
              f"({train_time:.2f}s)")

    (MODEL_DIR / "models_comparison.json").write_text(
        json.dumps(models_comparison, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # รวม ROC curve ของทุกโมเดลลงบน fpr grid เดียวกัน (สำหรับกราฟเส้นซ้อนกันในหน้า React)
    common_fpr = np.linspace(0, 1, 21)
    roc_curve_data = []
    for i, f in enumerate(common_fpr):
        point = {"fpr": round(float(f), 3), "baseline": round(float(f), 3)}
        short_name_map = {"random-forest": "rf", "logistic-regression": "lr", "decision-tree": "dt", "gradient-boosting": "gb"}
        for model_id, short in short_name_map.items():
            fpr_arr, tpr_arr = roc_points_by_model[model_id]
            point[short] = round(float(np.interp(f, fpr_arr, tpr_arr)), 3)
        roc_curve_data.append(point)
    (MODEL_DIR / "roc_curve.json").write_text(json.dumps(roc_curve_data, indent=2, ensure_ascii=False), encoding="utf-8")

    # =========================================================
    # 3) Dataset summary + distributions (Dashboard/Dataset ฝั่ง React)
    # =========================================================
    dataset_summary = {
        "totalRecords": int(len(df)),
        "strokeCases": int(df["stroke"].sum()),
        "nonStrokeCases": int((df["stroke"] == 0).sum()),
        "strokePercentage": round(float(df["stroke"].mean() * 100), 2),
        "featuresCount": 10,
        "targetName": "stroke (0 = ไม่พบภาวะ, 1 = พบภาวะ)",
        "missingBmiHandled": int(df["bmi"].isna().sum()),
        "source": "ไฟล์ CSV จริงที่อัปโหลด (healthcare-dataset-stroke-data.csv) — คำนวณสดทุกค่า ไม่ใช่ตัวเลขสมมติ",
    }
    (MODEL_DIR / "dataset_summary.json").write_text(json.dumps(dataset_summary, indent=2, ensure_ascii=False), encoding="utf-8")

    stroke_distribution = [
        {"name": "Non-Stroke (ปกติ)", "count": dataset_summary["nonStrokeCases"],
         "percentage": round(100 - dataset_summary["strokePercentage"], 2), "fill": "#10B981"},
        {"name": "Stroke (พบภาวะ)", "count": dataset_summary["strokeCases"],
         "percentage": dataset_summary["strokePercentage"], "fill": "#EF4444"},
    ]

    age_bins = [0, 18, 39, 59, 74, 150]
    age_labels = ["0-18 ปี", "19-39 ปี", "40-59 ปี", "60-74 ปี", "75+ ปี"]
    age_group = pd.cut(df["age"], bins=age_bins, labels=age_labels, right=True)
    age_dist = []
    for label in age_labels:
        sub = df[age_group == label]
        total = int(len(sub))
        stroke_count = int(sub["stroke"].sum())
        age_dist.append({
            "group": label, "total": total, "strokeCount": stroke_count,
            "strokeRate": round(stroke_count / total * 100, 2) if total else 0.0,
            "nonStroke": total - stroke_count,
        })

    bmi_bins = [0, 18.5, 25, 30, 35, 200]
    bmi_labels = ["Underweight (<18.5)", "Normal (18.5-24.9)", "Overweight (25-29.9)", "Obese I (30-34.9)", "Obese II+ (≥35)"]
    bmi_group = pd.cut(df["bmi"], bins=bmi_bins, labels=bmi_labels, right=False)
    bmi_dist = []
    total_rows = len(df)
    for label in bmi_labels:
        sub = df[bmi_group == label]
        count = int(len(sub))
        bmi_dist.append({
            "category": label, "count": count, "strokeCount": int(sub["stroke"].sum()),
            "percentage": round(count / total_rows * 100, 1),
        })

    glucose_bins = [0, 80, 100, 140, 200, 1000]
    glucose_labels = ["< 80 (ต่ำ)", "80 - 100 (ปกติ)", "101 - 140 (เสี่ยงเบาหวาน)", "141 - 200 (เบาหวาน)", "> 200 (เบาหวานรุนแรง)"]
    glucose_group = pd.cut(df["avg_glucose_level"], bins=glucose_bins, labels=glucose_labels, right=False)
    glucose_dist = []
    for label in glucose_labels:
        sub = df[glucose_group == label]
        glucose_dist.append({
            "range": label, "total": int(len(sub)), "stroke": int(sub["stroke"].sum()),
        })

    top_level_importance = aggregate_top_level_importance(legacy_importance)
    max_imp = max(top_level_importance.values()) or 1.0
    feature_importance_display = sorted(
        [
            {
                "feature": k, "thai": TOP_LEVEL_FEATURES_TH[k],
                "importance": round(v / max_imp * 90),
                "color": TOP_LEVEL_COLORS[k], "note": TOP_LEVEL_NOTES_TH[k],
            }
            for k, v in top_level_importance.items()
        ],
        key=lambda d: d["importance"], reverse=True,
    )

    distributions = {
        "strokeDistribution": stroke_distribution,
        "ageDistribution": age_dist,
        "bmiDistribution": bmi_dist,
        "glucoseDistribution": glucose_dist,
        "featureImportance": feature_importance_display,
    }
    (MODEL_DIR / "distributions.json").write_text(json.dumps(distributions, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\nบันทึกไฟล์ทั้งหมดไว้ที่ {MODEL_DIR}/ เรียบร้อยแล้ว (รวม 4 โมเดลจริงสำหรับหน้า React)")


if __name__ == "__main__":
    main()

