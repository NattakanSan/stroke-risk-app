"""
train_heart_model.py
เทรนโมเดลพยากรณ์ความเสี่ยงโรคหัวใจจาก data/heart_disease_health_indicators_BRFSS2015.csv
(พอร์ตมาจากโปรแกรม Desktop เดิม "Calculate the risk of heart disease.py" ของผู้ใช้ ใช้ตรรกะ/
พารามิเตอร์เดียวกันทุกจุด เพียงแค่เทรนใหม่ด้วย scikit-learn เวอร์ชันของเครื่องนี้ แทนการโหลด
ไฟล์ .pkl เดิมตรงๆ เพื่อเลี่ยงปัญหาเวอร์ชัน sklearn ไม่ตรงกัน)

รัน: python train_heart_model.py
ผลลัพธ์บันทึกไว้ที่ model/heart/
"""
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import accuracy_score, confusion_matrix, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "heart_disease_health_indicators_BRFSS2015.csv"
MODEL_DIR = BASE_DIR / "model" / "heart"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# 12 ปัจจัยเดียวกับโปรแกรม Desktop เดิมเป๊ะๆ (ไม่ได้เพิ่ม/ลด หรือทำ scaling เพิ่มเติม
# เพื่อให้พฤติกรรมของโมเดลตรงกับต้นฉบับที่ผู้ใช้ทำไว้ก่อนหน้านี้)
FEATURE_COLUMNS = [
    "HighBP", "HighChol", "CholCheck", "BMI", "Smoker", "Stroke",
    "Diabetes", "PhysActivity", "Fruits", "Veggies", "Sex", "Age",
]
CSV_USECOLS = ["HeartDiseaseorAttack"] + FEATURE_COLUMNS
CSV_DTYPES = {
    "HeartDiseaseorAttack": "int8", "HighBP": "int8", "HighChol": "int8",
    "CholCheck": "int8", "BMI": "int16", "Smoker": "int8", "Stroke": "int8",
    "Diabetes": "int8", "PhysActivity": "int8", "Fruits": "int8",
    "Veggies": "int8", "Sex": "int8", "Age": "int8",
}


def main():
    df = pd.read_csv(DATA_PATH, usecols=CSV_USECOLS, dtype=CSV_DTYPES)
    print(f"โหลดข้อมูล {len(df)} แถว | HeartDiseaseorAttack=1 จำนวน "
          f"{int(df['HeartDiseaseorAttack'].sum())} แถว ({df['HeartDiseaseorAttack'].mean() * 100:.2f}%)")

    X = df[FEATURE_COLUMNS]
    y = df["HeartDiseaseorAttack"]

    # test_size=0.3, random_state=42 -> ค่าเดียวกับโปรแกรม Desktop เดิมเป๊ะๆ
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

    # ---------- k-NN (classification) ----------
    knn_model = KNeighborsClassifier(n_neighbors=3)
    knn_model.fit(X_train, y_train)
    knn_pred = knn_model.predict(X_test)
    knn_accuracy = accuracy_score(y_test, knn_pred)
    knn_cm = confusion_matrix(y_test, knn_pred, labels=[0, 1])

    # ---------- Linear Regression (regression บน target 0/1 เพื่อประมาณคะแนนความเสี่ยงต่อเนื่อง) ----------
    lir_model = LinearRegression()
    lir_model.fit(X_train, y_train)
    lir_pred = lir_model.predict(X_test)
    lir_mse = mean_squared_error(y_test, lir_pred)
    lir_r2 = r2_score(y_test, lir_pred)

    metrics = {
        "knn_accuracy": round(float(knn_accuracy), 4),
        "knn_confusion_matrix": knn_cm.tolist(),  # [[TN, FP], [FN, TP]]
        "lir_mse": round(float(lir_mse), 4),
        "lir_r2": round(float(lir_r2), 4),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "positive_rate_pct": round(float(y.mean()) * 100, 2),
    }

    joblib.dump(knn_model, MODEL_DIR / "knn_model.pkl")
    joblib.dump(lir_model, MODEL_DIR / "lir_model.pkl")
    (MODEL_DIR / "metrics.json").write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    dataset_summary = {
        "totalRecords": int(len(df)),
        "positiveCases": int(df["HeartDiseaseorAttack"].sum()),
        "positiveRatePct": round(float(df["HeartDiseaseorAttack"].mean() * 100), 2),
        "source": "Heart Disease Health Indicators (BRFSS2015) — Alex Teboul, Kaggle",
    }
    (MODEL_DIR / "dataset_summary.json").write_text(
        json.dumps(dataset_summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"\n[kNN] accuracy = {knn_accuracy * 100:.2f}%  confusion_matrix(TN,FP,FN,TP) = "
          f"{knn_cm[0,0]},{knn_cm[0,1]},{knn_cm[1,0]},{knn_cm[1,1]}")
    print(f"[Linear Regression] MSE = {lir_mse:.4f}  R² = {lir_r2:.4f}")
    print(f"\nบันทึกไฟล์ไว้ที่ {MODEL_DIR}/ เรียบร้อยแล้ว")


if __name__ == "__main__":
    main()
