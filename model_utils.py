"""
model_utils.py
แปลงข้อมูลดิบ (จากฟอร์มหน้าเว็บ หรือจากแถวใน CSV) ให้เป็น feature vector
รูปแบบเดียวกันทุกครั้ง เพื่อให้ตอนเทรน (train_model.py) กับตอนทำนายจริง (app.py)
ใช้ชุดฟีเจอร์เดียวกันเป๊ะๆ
"""
import numpy as np
import pandas as pd

WORK_TYPE_CATEGORIES = ["Private", "Self-employed", "Govt_job", "children", "Never_worked"]
SMOKING_CATEGORIES = ["never smoked", "formerly smoked", "smokes", "Unknown"]
CONTINUOUS_FEATURES = ["age", "avg_glucose_level", "bmi"]

FEATURE_ORDER = (
    ["age", "avg_glucose_level", "bmi", "gender", "hypertension", "heart_disease",
     "ever_married", "residence_urban"]
    + [f"work_{c.replace(' ', '_')}" for c in WORK_TYPE_CATEGORIES]
    + [f"smoke_{c.replace(' ', '_')}" for c in SMOKING_CATEGORIES]
)

# ป้ายกำกับภาษาไทยไว้ใช้แสดงผลฝั่งหน้าเว็บ (Explainable AI panel)
FEATURE_LABELS_TH = {
    "age": "อายุ (Age)",
    "avg_glucose_level": "ระดับน้ำตาลเฉลี่ย (Avg Glucose)",
    "bmi": "ดัชนีมวลกาย (BMI)",
    "gender": "เพศ (Gender)",
    "hypertension": "โรคความดันโลหิตสูง",
    "heart_disease": "ประวัติโรคหัวใจ",
    "ever_married": "สถานะการสมรส",
    "residence_urban": "ที่อยู่อาศัย (เขตเมือง/ชนบท)",
}
for c in WORK_TYPE_CATEGORIES:
    FEATURE_LABELS_TH[f"work_{c.replace(' ', '_')}"] = f"ประเภทงาน: {c}"
for c in SMOKING_CATEGORIES:
    FEATURE_LABELS_TH[f"smoke_{c.replace(' ', '_')}"] = f"ประวัติการสูบบุหรี่: {c}"


def _one_hot(value, categories, prefix):
    return {f"{prefix}{c.replace(' ', '_')}": 1.0 if value == c else 0.0 for c in categories}


def row_to_features(row: dict, bmi_median: float) -> list:
    """แปลง record 1 แถว (dict ที่มี 10 ฟิลด์จากฟอร์ม/CSV) ให้เป็น feature vector ตาม FEATURE_ORDER"""
    bmi = row.get("bmi")
    if bmi is None or (isinstance(bmi, float) and np.isnan(bmi)):
        bmi = bmi_median

    feat = {
        "age": float(row["age"]),
        "avg_glucose_level": float(row["avg_glucose_level"]),
        "bmi": float(bmi),
        "gender": float(row["gender"]),
        "hypertension": float(row["hypertension"]),
        "heart_disease": float(row["heart_disease"]),
        "ever_married": float(row["ever_married"]),
        "residence_urban": 1.0 if row["Residence_type"] == "Urban" else 0.0,
    }
    feat.update(_one_hot(row["work_type"], WORK_TYPE_CATEGORIES, "work_"))
    feat.update(_one_hot(row["smoking_status"], SMOKING_CATEGORIES, "smoke_"))
    return [feat[name] for name in FEATURE_ORDER]


def dataframe_to_matrix(df: pd.DataFrame, bmi_median: float) -> np.ndarray:
    rows = df.to_dict(orient="records")
    return np.array([row_to_features(r, bmi_median) for r in rows])


def compute_contributions(x: list, feature_importance: dict, continuous_ranges: dict) -> dict:
    """
    ประมาณ 'น้ำหนักของแต่ละปัจจัยสำหรับเคสนี้โดยเฉพาะ' (ไม่ใช่แค่ importance รวมของทั้งโมเดล)
    วิธีคิด: importance (global) x ค่าฟีเจอร์ของเคสนี้ (normalize ให้อยู่ช่วง 0-1)
    ตัวแปรตัวเลข (age/glucose/bmi) จะ normalize ด้วย min-max จากข้อมูลเทรน
    ตัวแปร binary/one-hot (0 หรือ 1 อยู่แล้ว) ใช้ค่าตรงๆ -> หมวดที่ไม่ถูกเลือกจะได้ 0 ไปเลย
    หมายเหตุ: นี่คือค่าประมาณเพื่อการอธิบายผลแบบง่าย ไม่ใช่ SHAP value ที่แม่นยำระดับทฤษฎี
    """
    contributions = {}
    for name, val in zip(FEATURE_ORDER, x):
        imp = feature_importance.get(name, 0.0)
        if name in CONTINUOUS_FEATURES:
            rng = continuous_ranges.get(name, {"min": 0.0, "max": 1.0})
            span = (rng["max"] - rng["min"]) or 1.0
            norm = max(0.0, min(1.0, (val - rng["min"]) / span))
            contributions[name] = imp * norm
        else:
            contributions[name] = imp * val
    return contributions
