"""
app.py — เว็บแอปพยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง (Flask)

วิธีรัน (คำสั่งเดียว จากโฟลเดอร์นี้):
    python run.py
`run.py` จะเทรนโมเดล (ถ้ายังไม่มี), build หน้าเว็บ React (ถ้ายังไม่มี/ยังไม่ทันสมัย)
แล้วค่อยรัน Flask ตัวนี้ให้อัตโนมัติ — ดูรายละเอียดใน run.py หรือ README.md

รันแบบ manual ทีละขั้น (เผื่อ debug เอง) ยังทำได้เหมือนเดิม:
    1) pip install -r requirements.txt
    2) python train_model.py      (รันครั้งแรกครั้งเดียว เพื่อเทรนโมเดลจาก data/*.csv)
    3) (cd stroke-risk-react && npm install && npm run build)   (ครั้งแรก/เมื่อแก้โค้ด React)
    4) python app.py
    5) เปิดเบราว์เซอร์ไปที่ http://localhost:5000  (หน้า React ที่ build แล้ว)
       หรือ http://localhost:5000/classic  (หน้าเว็บ vanilla JS ตัวเดิม)
"""
import json
import time
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request, render_template, send_from_directory, abort

from model_utils import row_to_features, FEATURE_ORDER, FEATURE_LABELS_TH, compute_contributions

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "healthcare-dataset-stroke-data.csv"
MODEL_DIR = BASE_DIR / "model"
MODELS_SUBDIR = MODEL_DIR / "models"
# หน้าเว็บ React ที่ build แล้ว (เกิดจาก `npm run build` ในโฟลเดอร์ stroke-risk-react/)
REACT_DIST_DIR = BASE_DIR / "stroke-risk-react" / "dist"

app = Flask(__name__)

if not (MODEL_DIR / "model.pkl").exists():
    raise SystemExit(
        "ยังไม่พบโมเดล กรุณารัน `python train_model.py` ก่อนแล้วค่อยรัน app.py"
    )

model = joblib.load(MODEL_DIR / "model.pkl")
meta = json.loads((MODEL_DIR / "meta.json").read_text(encoding="utf-8"))
metrics = json.loads((MODEL_DIR / "metrics.json").read_text(encoding="utf-8"))
feature_importance = json.loads((MODEL_DIR / "feature_importance.json").read_text(encoding="utf-8"))
dataset_df = pd.read_csv(DATA_PATH)
BMI_MEDIAN = meta["bmi_median"]
CONTINUOUS_RANGES = meta.get("continuous_ranges", {})

# ---------- ทรัพยากรเพิ่มเติมสำหรับหน้าเว็บ React (4-model comparison) ----------
MODELS_COMPARISON = json.loads((MODEL_DIR / "models_comparison.json").read_text(encoding="utf-8"))
ROC_CURVE_DATA = json.loads((MODEL_DIR / "roc_curve.json").read_text(encoding="utf-8"))
DATASET_SUMMARY = json.loads((MODEL_DIR / "dataset_summary.json").read_text(encoding="utf-8"))
DISTRIBUTIONS = json.loads((MODEL_DIR / "distributions.json").read_text(encoding="utf-8"))
MODEL_NAME_LOOKUP = {m["id"]: m["name"] for m in MODELS_COMPARISON}
VALID_MODEL_IDS = set(MODEL_NAME_LOOKUP.keys())

# ---------- โมเดลโรคหัวใจ (พอร์ตจากโปรแกรม Desktop เดิมของผู้ใช้) ----------
HEART_MODEL_DIR = MODEL_DIR / "heart"
if not (HEART_MODEL_DIR / "knn_model.pkl").exists():
    raise SystemExit(
        "ยังไม่พบโมเดลโรคหัวใจ กรุณารัน `python train_heart_model.py` ก่อนแล้วค่อยรัน app.py"
    )
heart_knn_model = joblib.load(HEART_MODEL_DIR / "knn_model.pkl")
heart_lir_model = joblib.load(HEART_MODEL_DIR / "lir_model.pkl")
heart_metrics = json.loads((HEART_MODEL_DIR / "metrics.json").read_text(encoding="utf-8"))
heart_dataset_summary = json.loads((HEART_MODEL_DIR / "dataset_summary.json").read_text(encoding="utf-8"))

HEART_FEATURE_COLUMNS = [
    "HighBP", "HighChol", "CholCheck", "BMI", "Smoker", "Stroke",
    "Diabetes", "PhysActivity", "Fruits", "Veggies", "Sex", "Age",
]
HEART_BMI_MIN, HEART_BMI_MAX = 10.0, 70.0

_loaded_models = {}
_loaded_importances = {}


def get_react_model(model_id: str):
    if model_id not in VALID_MODEL_IDS:
        model_id = "random-forest"
    if model_id not in _loaded_models:
        _loaded_models[model_id] = joblib.load(MODELS_SUBDIR / f"{model_id}.pkl")
        _loaded_importances[model_id] = json.loads(
            (MODELS_SUBDIR / f"{model_id}_importance.json").read_text(encoding="utf-8")
        )
    return model_id, _loaded_models[model_id], _loaded_importances[model_id]


CORE_FACTORS_TH = {
    "age": "อายุ (Age)",
    "avg_glucose_level": "ระดับน้ำตาลเฉลี่ย (Avg Glucose)",
    "hypertension": "โรคความดันโลหิตสูง (Hypertension)",
    "heart_disease": "โรคหัวใจ (Heart Disease)",
    "bmi": "ดัชนีมวลกาย (BMI)",
    "smoking_status": "ประวัติการสูบบุหรี่ (Smoking Status)",
}


def core_factor_explanation(feature, is_driver):
    table = {
        "age": ("อายุเกิน 55 ปี เป็นปัจจัยหลักที่ส่งผลต่อการเสื่อมของหลอดเลือด",
                "อายุอยู่ในเกณฑ์ที่ความเสี่ยงหลอดเลือดสมองยังต่ำ"),
        "avg_glucose_level": ("ระดับน้ำตาลสูงกว่าเกณฑ์ปกติ ส่งผลต่อผนังหลอดเลือดเปราะ",
                               "ระดับน้ำตาลอยู่ในเกณฑ์ที่ควบคุมได้ดี"),
        "hypertension": ("ภาวะความดันโลหิตสูงเป็นปัจจัยเร่งหลักที่ทำให้เส้นเลือดในสมองแตกหรือตีบ",
                          "ไม่มีภาวะความดันสูง ช่วยลดแรงดันในหลอดเลือด"),
        "heart_disease": ("ลิ่มเลือดจากหัวใจอาจหลุดไปอุดตันในเส้นเลือดสมอง (Embolic Stroke)",
                           "ระบบหลอดเลือดหัวใจปกติ ไม่พบความเสี่ยงลิ่มเลือด"),
        "bmi": ("อยู่ในภาวะโรคอ้วน มีความสัมพันธ์กับภาวะหลอดเลือดแดงแข็ง",
                "ดัชนีมวลกายอยู่ในเกณฑ์ปกติหรือเกินเล็กน้อย"),
        "smoking_status": ("สารพิษในบุหรี่ทำลายเยื่อบุหลอดเลือดและเร่งการเกาะตัวของคราบไขมัน",
                            "การไม่สูบบุหรี่ช่วยรักษาความยืดหยุ่นของหลอดเลือด"),
    }
    yes, no = table.get(feature, ("", ""))
    return yes if is_driver else no


REQUIRED_FIELDS = [
    "gender", "age", "hypertension", "heart_disease", "ever_married",
    "work_type", "Residence_type", "avg_glucose_level", "bmi", "smoking_status",
]


def risk_level(prob: float) -> str:
    if prob < 0.20:
        return "low"
    if prob < 0.55:
        return "medium"
    return "high"


@app.route("/")
def index():
    # ถ้า build หน้าเว็บ React ไว้แล้ว (stroke-risk-react/dist/index.html มีอยู่)
    # ให้ใช้หน้านั้นเป็นหน้าแรกแทนหน้า vanilla JS เดิม
    react_index = REACT_DIST_DIR / "index.html"
    if react_index.exists():
        return send_from_directory(REACT_DIST_DIR, "index.html")
    return render_template("index.html")


@app.route("/classic")
def classic_index():
    """หน้าเว็บ vanilla JS ตัวเดิม (templates/index.html + static/script.js) — เข้าถึงได้เสมอ
    ไม่ว่าจะ build React ไว้แล้วหรือไม่"""
    return render_template("index.html")


@app.route("/assets/<path:filename>")
def react_assets(filename):
    """ไฟล์ JS/CSS ที่ Vite build ออกมา (stroke-risk-react/dist/assets/*)"""
    assets_dir = REACT_DIST_DIR / "assets"
    if not assets_dir.exists():
        abort(404)
    return send_from_directory(assets_dir, filename)


@app.route("/api/predict", methods=["POST"])
def predict():
    payload = request.get_json(force=True, silent=True) or {}

    missing = [f for f in REQUIRED_FIELDS if f not in payload or payload[f] in (None, "")]
    if missing:
        return jsonify({"error": f"ขาดข้อมูล: {', '.join(missing)}"}), 400

    try:
        x = row_to_features(payload, BMI_MEDIAN)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": f"ข้อมูลไม่ถูกต้อง: {exc}"}), 400

    proba = float(model.predict_proba([x])[0][1])

    # น้ำหนักของแต่ละปัจจัย "สำหรับเคสนี้โดยเฉพาะ" (ไม่ใช่ importance รวมของทั้งโมเดลตรงๆ)
    # ดู docstring ของ compute_contributions ใน model_utils.py สำหรับวิธีคิด
    contributions = compute_contributions(x, feature_importance, CONTINUOUS_RANGES)
    ranked = sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)
    ranked = [(k, v) for k, v in ranked if v > 0] or \
        sorted(feature_importance.items(), key=lambda kv: kv[1], reverse=True)
    top5 = ranked[:5]
    total = sum(v for _, v in top5) or 1.0
    top_factors = [
        {
            "feature": name,
            "label_th": FEATURE_LABELS_TH.get(name, name),
            "weight_pct": round(v / total * 100, 1),
        }
        for name, v in top5
    ]

    return jsonify({
        "probability_pct": round(proba * 100, 2),
        "risk_level": risk_level(proba),
        "top_factors": top_factors,
    })


@app.route("/api/dataset")
def get_dataset():
    try:
        page = max(int(request.args.get("page", 1)), 1)
        page_size = min(max(int(request.args.get("page_size", 20)), 1), 100)
    except (TypeError, ValueError):
        return jsonify({"error": "page/page_size ต้องเป็นตัวเลข"}), 400

    start = (page - 1) * page_size
    end = start + page_size
    total = len(dataset_df)
    columns = list(dataset_df.columns)
    chunk = dataset_df.iloc[start:end]

    # แปลงค่าทีละเซลล์ด้วยมือให้เป็น native Python type (int/float/str/None) เสมอ
    # แทนที่จะพึ่ง .where()/.to_dict() ตรงๆ ซึ่งพฤติกรรมต่างกันไปตามเวอร์ชัน pandas
    # ของแต่ละเครื่อง (นี่คือสาเหตุที่หน้า Dataset ก่อนหน้านี้โหลดไม่ขึ้น)
    rows = []
    for _, record in chunk.iterrows():
        clean = {}
        for col in columns:
            val = record[col]
            if pd.isna(val):
                clean[col] = None
            elif isinstance(val, np.integer):
                clean[col] = int(val)
            elif isinstance(val, np.floating):
                clean[col] = float(val)
            else:
                clean[col] = val
        rows.append(clean)

    return jsonify({
        "rows": rows,
        "columns": columns,
        "page": page,
        "page_size": page_size,
        "total_rows": total,
        "total_pages": max((total + page_size - 1) // page_size, 1),
    })


@app.route("/api/dataset/stats")
def dataset_stats():
    df = dataset_df
    age_bins = [0, 18, 35, 50, 65, 150]
    age_labels = ["0-18", "19-35", "36-50", "51-65", "65+"]
    age_group = pd.cut(df["age"], bins=age_bins, labels=age_labels)

    stroke_by_age = df.groupby(age_group, observed=True)["stroke"].mean().mul(100).round(2)
    stroke_by_smoking = df.groupby("smoking_status")["stroke"].mean().mul(100).round(2)
    stroke_by_hypertension = df.groupby("hypertension")["stroke"].mean().mul(100).round(2)

    return jsonify({
        "total_records": int(len(df)),
        "stroke_count": int(df["stroke"].sum()),
        "stroke_rate_pct": round(float(df["stroke"].mean() * 100), 2),
        "avg_age": round(float(df["age"].mean()), 1),
        "missing_bmi": int(df["bmi"].isna().sum()),
        "stroke_rate_by_age_group": stroke_by_age.to_dict(),
        "stroke_rate_by_smoking": stroke_by_smoking.to_dict(),
        "stroke_rate_by_hypertension": {
            "ไม่มีความดันสูง": float(stroke_by_hypertension.get(0, 0.0)),
            "มีความดันสูง": float(stroke_by_hypertension.get(1, 0.0)),
        },
    })


@app.route("/api/model/metrics")
def get_metrics():
    return jsonify({
        "metrics": metrics,
        "feature_importance": [
            {"feature": k, "label_th": FEATURE_LABELS_TH.get(k, k), "importance": v}
            for k, v in feature_importance.items()
        ],
    })


# =========================================================================
# Endpoints ด้านล่างนี้ใช้โดยหน้าเว็บ React (stroke-risk-react) เท่านั้น
# เพื่อแทนที่ข้อมูลสมมติที่เคย hardcode ไว้ใน src/data/*.ts และ
# src/utils/predictionEngine.ts ด้วยของจริงที่เทรนจาก data/*.csv
# =========================================================================

@app.route("/api/models")
def api_models():
    """รายชื่อ 4 โมเดลจริงพร้อม metrics/confusion matrix -> แทน ML_MODELS (fake) เดิม"""
    return jsonify(MODELS_COMPARISON)


@app.route("/api/roc-curve")
def api_roc_curve():
    """จุด ROC ของทั้ง 4 โมเดลบน fpr grid เดียวกัน -> แทน ROC_CURVE_DATA (fake) เดิม"""
    return jsonify(ROC_CURVE_DATA)


@app.route("/api/dataset/summary")
def api_dataset_summary():
    """สรุปข้อมูล dataset จริง -> แทน DATASET_SUMMARY (fake) เดิม"""
    return jsonify(DATASET_SUMMARY)


@app.route("/api/dataset/distributions")
def api_dataset_distributions():
    """กราฟ distribution ต่างๆ + feature importance คำนวณจากข้อมูลจริง"""
    return jsonify(DISTRIBUTIONS)


@app.route("/api/dataset/all")
def api_dataset_all():
    """
    ส่งข้อมูลทั้ง 5,110 แถวจริง แปลง gender/ever_married กลับเป็น
    'Male'/'Female' และ 'Yes'/'No' ให้ตรงกับ DatasetRecord type ฝั่ง React
    (หน้า DatasetPage.tsx ทำ filter/sort/pagination/export เองฝั่ง client อยู่แล้ว
    จึงส่งเป็นก้อนเดียวไปเลย ไม่ต้องแก้ logic เดิมของหน้านั้น)
    """
    records = []
    for _, r in dataset_df.iterrows():
        bmi_val = r["bmi"]
        records.append({
            "id": int(r["id"]),
            "gender": "Male" if int(r["gender"]) == 1 else "Female",
            "age": float(r["age"]),
            "hypertension": int(r["hypertension"]),
            "heart_disease": int(r["heart_disease"]),
            "ever_married": "Yes" if int(r["ever_married"]) == 1 else "No",
            "work_type": r["work_type"],
            "Residence_type": r["Residence_type"],
            "avg_glucose_level": float(r["avg_glucose_level"]),
            # เติมค่า median แทนที่ NaN (เหมือนตอนเทรนโมเดล) เพื่อให้ตรงกับ type
            # `bmi: number` ฝั่ง React — ส่วนจำนวนแถวที่ขาดหายจริงยังนับถูกต้องใน
            # /api/dataset/summary (missingBmiHandled) แยกต่างหาก
            "bmi": round(BMI_MEDIAN, 1) if pd.isna(bmi_val) else float(bmi_val),
            "smoking_status": r["smoking_status"],
            "stroke": int(r["stroke"]),
        })
    return jsonify(records)


@app.route("/api/predict-v2", methods=["POST"])
def predict_v2():
    """
    เวอร์ชันสำหรับหน้าเว็บ React: รับ input ตามรูปแบบ StrokePredictionInput
    (gender เป็น 'Male'/'Female'/'Other', ever_married เป็น 'Yes'/'No')
    และตอบกลับตามรูปแบบ PredictionOutput พอดี (ไม่ต้องแก้ JSX ฝั่ง React เลย)
    """
    payload = request.get_json(force=True, silent=True) or {}
    model_id = payload.get("model_id") or "random-forest"

    missing = [f for f in REQUIRED_FIELDS if f not in payload or payload[f] in (None, "")]
    if missing:
        return jsonify({"error": f"ขาดข้อมูล: {', '.join(missing)}"}), 400

    internal_row = {
        "gender": 0 if payload["gender"] == "Female" else 1,  # Male/Other -> 1, Female -> 0
        "age": payload["age"],
        "hypertension": payload["hypertension"],
        "heart_disease": payload["heart_disease"],
        "ever_married": 1 if payload["ever_married"] == "Yes" else 0,
        "work_type": payload["work_type"],
        "Residence_type": payload["Residence_type"],
        "avg_glucose_level": payload["avg_glucose_level"],
        "bmi": payload["bmi"],
        "smoking_status": payload["smoking_status"],
    }

    try:
        x = row_to_features(internal_row, BMI_MEDIAN)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": f"ข้อมูลไม่ถูกต้อง: {exc}"}), 400

    used_model_id, clf, model_importance = get_react_model(model_id)
    raw_proba = float(clf.predict_proba([x])[0][1])
    # ปัด scale 2-96 ล้วนๆ เพื่อความสวยงามของ progress bar (ไม่ให้ค้างที่ 0%/100% พอดี)
    # ตัวเลขความน่าจะเป็นจริงยังคงมาจากโมเดลจริงทั้งหมด นี่แค่ clamp ปลายสุดสองด้าน
    probability = min(max(round(raw_proba * 100), 2), 96)
    stroke = 1 if probability >= 45 else 0
    if probability < 25:
        risk = "LOW"
    elif probability < 55:
        risk = "MEDIUM"
    else:
        risk = "HIGH"

    contributions = compute_contributions(x, model_importance, CONTINUOUS_RANGES)
    # รวม contribution ของ smoke_* กลับเป็น 'smoking_status' เดียว (ตาม 6 ปัจจัยหลักที่ UI แสดง)
    smoking_status = internal_row["smoking_status"]
    smoke_key = f"smoke_{smoking_status.replace(' ', '_')}"

    def user_value_text(feat):
        if feat == "age":
            return f"{internal_row['age']} ปี"
        if feat == "avg_glucose_level":
            return f"{float(internal_row['avg_glucose_level']):.1f} mg/dL"
        if feat == "hypertension":
            return "มีภาวะความดันสูง (Yes)" if internal_row["hypertension"] in (1, "1") else "ไม่มีประวัติ (No)"
        if feat == "heart_disease":
            return "มีประวัติโรคหัวใจ (Yes)" if internal_row["heart_disease"] in (1, "1") else "ไม่มีประวัติ (No)"
        if feat == "bmi":
            bmi_val = internal_row["bmi"] if internal_row["bmi"] not in (None, "") else BMI_MEDIAN
            return f"{float(bmi_val):.1f} kg/m²"
        if feat == "smoking_status":
            labels = {"never smoked": "ไม่เคยสูบ", "formerly smoked": "เคยสูบในอดีต",
                      "smokes": "สูบเป็นประจำ", "Unknown": "ไม่ระบุ"}
            return labels.get(smoking_status, smoking_status)
        return ""

    is_driver_map = {
        "age": float(internal_row["age"]) >= 55,
        "avg_glucose_level": float(internal_row["avg_glucose_level"]) >= 140,
        "hypertension": internal_row["hypertension"] in (1, "1"),
        "heart_disease": internal_row["heart_disease"] in (1, "1"),
        "bmi": float(internal_row["bmi"] or BMI_MEDIAN) >= 30,
        "smoking_status": smoking_status in ("smokes", "formerly smoked"),
    }

    factors = []
    for feat in CORE_FACTORS_TH:
        imp_raw = contributions.get(smoke_key, 0.0) if feat == "smoking_status" else contributions.get(feat, 0.0)
        factors.append({
            "feature": feat,
            "featureThai": CORE_FACTORS_TH[feat],
            "importance": min(round(imp_raw * 300), 96),  # scale ให้เห็นความต่างชัดเจนบนแถบ 0-100
            "userValueText": user_value_text(feat),
            "isRiskDriver": is_driver_map[feat],
            "explanation": core_factor_explanation(feat, is_driver_map[feat]),
        })
    factors.sort(key=lambda f: f["importance"], reverse=True)

    recommendations = []
    if is_driver_map["hypertension"]:
        recommendations.append("ตรวจวัดความดันโลหิตสม่ำเสมอ และควบคุมให้อยู่ในเกณฑ์มาตรฐาน (<130/80 mmHg)")
    if float(internal_row["avg_glucose_level"]) > 125:
        recommendations.append("ควบคุมปริมาณน้ำตาลและคาร์โบไฮเดรต พร้อมปรึกษาแพทย์เพื่อตรวจค่าน้ำตาลสะสม (HbA1c)")
    if smoking_status == "smokes":
        recommendations.append("การลดหรือเลิกสูบบุหรี่ช่วยลดความเสี่ยงโรคหลอดเลือดสมองได้อย่างมีนัยสำคัญภายใน 1-2 ปี")
    if float(internal_row["bmi"] or BMI_MEDIAN) >= 25:
        recommendations.append("ควบคุมอาหารและออกกำลังกายแบบแอโรบิกอย่างน้อย 150 นาทีต่อสัปดาห์เพื่อควบคุมน้ำหนัก")
    if is_driver_map["heart_disease"]:
        recommendations.append("ปฏิบัติตามคำแนะนำของแพทย์โรคหัวใจอย่างเคร่งครัดและตรวจการเต้นของหัวใจเป็นประจำ")
    if not recommendations:
        recommendations = [
            "รักษารูปแบบการใช้ชีวิตที่มีสุขภาพดี ดื่มน้ำให้เพียงพอ และตรวจสุขภาพประจำปี",
            "สังเกตอาการเตือนโรคหลอดเลือดสมองตามหลัก FAST (Face, Arms, Speech, Time)",
        ]

    return jsonify({
        "stroke": stroke,
        "probability": probability,
        "riskLevel": risk,
        "modelStatement": "โมเดลพบรูปแบบข้อมูลที่สัมพันธ์กับการเกิด Stroke ใน Dataset" if stroke == 1
                           else "โมเดลไม่พบรูปแบบข้อมูลที่สัมพันธ์กับการเกิด Stroke ใน Dataset",
        "modelUsed": MODEL_NAME_LOOKUP.get(used_model_id, used_model_id),
        "factors": factors,
        "recommendations": recommendations,
        "assessedAt": datetime.now().strftime("%H:%M"),
    })


# =========================================================================
# เมนู "Heart Disease Risk" — พอร์ตมาจากโปรแกรม Desktop เดิมของผู้ใช้
# (Calculate the risk of heart disease.py) ใช้ CSV จริง BRFSS2015 253,680 แถว
# โมเดล k-NN (k=3) และ Linear Regression เทรนจริงเหมือนต้นฉบับทุกพารามิเตอร์
# =========================================================================

@app.route("/api/heart/metrics")
def api_heart_metrics():
    return jsonify({**heart_metrics, **heart_dataset_summary})


@app.route("/api/heart/predict", methods=["POST"])
def api_heart_predict():
    payload = request.get_json(force=True, silent=True) or {}
    model_choice = payload.get("model_choice", "knn")
    if model_choice not in ("knn", "lir"):
        return jsonify({"error": "model_choice ต้องเป็น 'knn' หรือ 'lir'"}), 400

    missing = [f for f in HEART_FEATURE_COLUMNS if f not in payload or payload[f] in (None, "")]
    if missing:
        return jsonify({"error": f"ขาดข้อมูล: {', '.join(missing)}"}), 400

    try:
        values = {k: float(payload[k]) for k in HEART_FEATURE_COLUMNS}
    except (TypeError, ValueError):
        return jsonify({"error": "ค่าทุกช่องต้องเป็นตัวเลข"}), 400

    if not (HEART_BMI_MIN <= values["BMI"] <= HEART_BMI_MAX):
        return jsonify({"error": f"BMI ต้องอยู่ในช่วง {HEART_BMI_MIN:.0f} - {HEART_BMI_MAX:.0f}"}), 400

    row_df = pd.DataFrame([[values[c] for c in HEART_FEATURE_COLUMNS]], columns=HEART_FEATURE_COLUMNS)

    if model_choice == "knn":
        pred = int(heart_knn_model.predict(row_df)[0])
        if pred == 1:
            result_text = "ผลทำนาย (k-NN): มีความเสี่ยงเป็นโรคหัวใจ"
            sub_text = "จากข้อมูลที่ให้มา ระบบประเมินว่าคุณมีความเสี่ยงเป็นโรคหัวใจ ควรปรึกษาแพทย์"
            risk_level_out = "high"
        else:
            result_text = "ผลทำนาย (k-NN): ไม่มีความเสี่ยงเป็นโรคหัวใจ"
            sub_text = "จากข้อมูลที่ให้มา ระบบประเมินว่าคุณไม่มีความเสี่ยงเป็นโรคหัวใจ"
            risk_level_out = "low"
        return jsonify({
            "modelChoice": "knn",
            "prediction": pred,
            "riskScore": None,
            "resultText": result_text,
            "subText": sub_text,
            "riskLevel": risk_level_out,
            "modelAccuracyPct": round(heart_metrics["knn_accuracy"] * 100, 1),
        })

    # Linear Regression
    score = float(heart_lir_model.predict(row_df)[0])
    score_clamped = max(0.0, min(1.0, score))
    result_text = "ผลทำนาย (Linear Regression)"
    sub_text = f"คะแนนความเสี่ยงโดยประมาณ: {score:.4f} (ค่าใกล้ 1 = เสี่ยงสูง, ใกล้ 0 = เสี่ยงต่ำ)"
    return jsonify({
        "modelChoice": "lir",
        "prediction": None,
        "riskScore": round(score, 4),
        "riskScoreClamped": round(score_clamped, 4),
        "resultText": result_text,
        "subText": sub_text,
        "riskLevel": "high" if score >= 0.5 else "low",
        "modelR2": heart_metrics["lir_r2"],
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
