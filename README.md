# Stroke Risk Prediction — เว็บแอปพยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง

โปรเจกต์ตัวอย่างเพื่อการศึกษา (ML Education Project) เทรนจากไฟล์
`healthcare-dataset-stroke-data.csv` ของคุณจริงๆ (ไม่ได้ hardcode ค่า)

## วิธีรัน (คำสั่งเดียว)

ต้องมี [Python 3.10+](https://www.python.org/) และ [Node.js](https://nodejs.org)
(สำหรับ build หน้าเว็บ React) ติดตั้งไว้ก่อน แล้วรัน:

```bash
# 1) สร้าง virtual environment (แนะนำ ไม่บังคับ)
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# 2) ติดตั้ง Python dependencies
pip install -r requirements.txt

# 3) รันคำสั่งเดียวจบ
python run.py
```

`run.py` จะจัดการให้อัตโนมัติทุกขั้นตอน:
1. เทรนโมเดลจาก `data/*.csv` (ข้ามให้ถ้ามี `model/model.pkl` อยู่แล้ว)
2. `npm install` + `npm run build` หน้าเว็บ React ในโฟลเดอร์ `stroke-risk-react/`
   (ข้ามให้ถ้า build ไว้แล้ว)
3. เปิด Flask ที่ **http://localhost:5000**

ครั้งต่อๆ ไปที่แก้แค่ backend (`app.py`, `model_utils.py`) รัน `python run.py` เฉยๆ
ได้เลย จะข้าม 2 ขั้นตอนแรกไปเปิดเว็บทันที ถ้าแก้ไฟล์ในกลุ่มนี้แล้วอยากให้มีผลใหม่:
- แก้ `train_model.py` หรือ `data/*.csv` → `python run.py --retrain`
- แก้โค้ดใน `stroke-risk-react/src/` → `python run.py --rebuild-frontend`

เปิดเว็บได้ 2 หน้า: **http://localhost:5000** (หน้า React ที่ build แล้ว — หน้าหลัก)
และ **http://localhost:5000/classic** (หน้า vanilla JS ตัวเดิม)

<details>
<summary>รันแบบ manual ทีละขั้น (เผื่อ debug เอง)</summary>

```bash
python train_model.py                              # เทรนโมเดล
cd stroke-risk-react && npm install && npm run build && cd ..   # build หน้าเว็บ React
python app.py                                       # เปิด Flask
```

</details>


## โครงสร้างโปรเจกต์

```
stroke-risk-app/
├── run.py                 # รันคำสั่งเดียว: เทรนโมเดล + build React + เปิด Flask
├── app.py                 # Flask backend: serve หน้าเว็บ (React ที่ build แล้ว + /classic) + API
├── train_model.py         # เทรนโมเดล stroke จาก CSV แล้วบันทึกไว้ใน model/
├── train_heart_model.py   # เทรนโมเดลโรคหัวใจ (k-NN + Linear Regression) ไว้ใน model/heart/
├── model_utils.py         # feature engineering ใช้ร่วมกันทั้งตอนเทรนและตอนทำนาย (stroke)
├── requirements.txt
├── data/
│   ├── healthcare-dataset-stroke-data.csv
│   └── heart_disease_health_indicators_BRFSS2015.csv
├── model/                 # ไฟล์ที่ train_model.py / train_heart_model.py สร้างให้
│   ├── model.pkl, meta.json, metrics.json, feature_importance.json   (stroke)
│   ├── models/             (stroke: 4 โมเดลเทียบกัน)
│   └── heart/               (โรคหัวใจ: knn_model.pkl, lir_model.pkl, metrics.json)
├── stroke-risk-react/     # หน้าเว็บหลัก (React) — `npm run build` สร้าง dist/ ให้ app.py serve
├── templates/
│   └── index.html         # หน้าเว็บ vanilla JS เดิม เข้าถึงได้ที่ /classic
└── static/
    ├── style.css
    └── script.js
```

## โมเดลที่ใช้ และผลลัพธ์จริงบนข้อมูลของคุณ

- **Algorithm**: RandomForestClassifier (`n_estimators=300, max_depth=8, class_weight="balanced"`)
- **ทำไมต้อง `class_weight="balanced"`**: ข้อมูลมี stroke=1 แค่ **4.87%** (imbalanced มาก) ถ้าไม่ปรับ
  โมเดลจะเรียนรู้ว่าทายว่า "ไม่เป็น" ตลอดก็ได้ accuracy ~95% ทั้งที่ตรวจจับผู้ป่วยจริงไม่ได้เลย
- ผลบน test set (20%, ไม่เคยเห็นตอนเทรน):

  | Metric | ค่า |
  |---|---|
  | Accuracy | 86.5% |
  | Precision (Stroke) | 19.4% |
  | Recall (Stroke) | 56.0% |
  | ROC-AUC | 0.826 |

  **ควรดู ROC-AUC และ Recall เป็นหลัก ไม่ใช่ Accuracy** เพราะข้อมูล imbalance รุนแรง — ตัวเลขนี้ดูได้แบบ
  real-time ในหน้า "Model Performance" ของเว็บ (ดึงจาก `model/metrics.json` ที่คุณเทรนเองในเครื่อง)

## ข้อสังเกตเกี่ยวกับข้อมูล (สำคัญ ควรรู้ก่อนใช้งานต่อ)

1. **`bmi` ขาดหาย 201 แถว** — เติมด้วยค่ามัธยฐานของข้อมูลเทรน (เก็บไว้ใน `model/meta.json`)
2. **`ever_married` เป็นค่า `1` ทุกแถวในไฟล์นี้** ทำให้ feature importance ของคอลัมน์นี้ออกมาเป็น 0
   (โมเดลใช้แยกแยะไม่ได้เพราะไม่มีความหลากหลายของค่าเลย) — ถ้าอยากให้ปัจจัยนี้มีความหมาย ต้องเช็ค
   ไฟล์ต้นทางว่ามีแถวที่ `ever_married = No` หลุดหายไปหรือเปล่า
3. `gender` ในไฟล์นี้ถูก encode เป็น 0/1 แล้ว (ไม่มี string) จับคู่ตามสัดส่วนกับ dataset ต้นฉบับ:
   **0 = หญิง (Female), 1 = ชาย (Male)** — ปุ่ม "อื่นๆ (Other)" ในฟอร์มจึงถูก map ไปที่ 1 ชั่วคราว
   (dataset ต้นฉบับมี Other แค่ 1 แถว ไม่พอให้โมเดลเรียนรู้แยกอยู่แล้ว)
4. แถวในไฟล์เรียงแบบไม่สุ่ม (stroke=1 อยู่ต้นไฟล์) — `train_model.py` จึง shuffle + stratify
   ตอน split train/test เสมอ

## หมายเหตุด้าน Explainable AI

หน้า Prediction จะโชว์ "ปัจจัยที่มีผลต่อการพยากรณ์" ต่อ**เคสนั้นๆ** โดยคำนวณจาก
`feature_importance` ของโมเดล (global) คูณกับค่าจริงของฟีเจอร์ในเคสนั้น (ดู `compute_contributions`
ใน `model_utils.py`) เป็นการประมาณอย่างง่ายเพื่อให้เข้าใจง่าย **ไม่ใช่ SHAP value ที่แม่นยำระดับทฤษฎี**
ถ้าต้องการความแม่นยำระดับงานวิจัย แนะนำติดตั้งไลบรารี `shap` เพิ่มเติม

## ข้อควรระวัง

เว็บนี้เป็นโปรเจกต์เพื่อการศึกษา **ไม่ใช่เครื่องมือวินิจฉัยทางการแพทย์** ผลลัพธ์ที่ได้ไม่ควรใช้แทน
คำแนะนำจากแพทย์ ในหน้าเว็บมีข้อความ disclaimer กำกับไว้แล้ว

## ต่อยอดได้อีก

- เพิ่ม model selector ให้เทียบ Logistic Regression / XGBoost กับ Random Forest
- เพิ่มภาษา (TH/EN toggle)
- Export ผลพยากรณ์เป็น PDF
- ใช้ไลบรารี `shap` สำหรับ per-case explanation ที่แม่นยำขึ้น

## หน้าเว็บ React

โฟลเดอร์ `stroke-risk-react/` เป็นหน้าเว็บ React/TypeScript หลักของโปรเจกต์นี้ (สร้างด้วย
Google AI Studio ตอนแรก ตอนนี้ต่อกับ backend จริงแล้วทั้งหมด) ผ่าน endpoint เพิ่มเติม:
`/api/models`, `/api/roc-curve`, `/api/dataset/all`, `/api/dataset/summary`,
`/api/dataset/distributions`, `/api/predict-v2` — ใช้ 4 โมเดลจริงที่เทรนไว้ใน `model/models/`
(Random Forest, Logistic Regression, Decision Tree, Gradient Boosting)

`python run.py` จัดการ build + serve หน้านี้ให้อัตโนมัติแล้ว (ดูหัวข้อ "วิธีรัน" ด้านบน)
ไม่ต้องเปิด 2 terminal แยกกันอีกต่อไป

## เมนู "Heart Disease Risk" (พอร์ตจากระบบเดิมของคุณ)

เมนูนี้พอร์ตมาจากโปรแกรม Desktop (Tkinter) ที่คุณทำไว้ก่อนหน้านี้
(`Calculate the risk of heart disease.py`) — ใช้ตรรกะ/พารามิเตอร์เดิมทุกจุด เปลี่ยนแค่ UI
จากหน้าต่างโปรแกรมมาเป็นหน้าเว็บ:

- **ข้อมูล**: `data/heart_disease_health_indicators_BRFSS2015.csv` (Kaggle, 253,680 แถว)
- **โมเดล**: k-NN (k=3, จำแนก 0/1) และ Linear Regression (ให้คะแนนความเสี่ยงต่อเนื่อง 0-1)
  — เทรนด้วย `train_heart_model.py` (`test_size=0.3, random_state=42` ตรงกับต้นฉบับ)
- **Endpoints**: `GET /api/heart/metrics`, `POST /api/heart/predict`
- **หน้าเว็บ**: `stroke-risk-react/src/pages/HeartDiseasePage.tsx` (เมนู "Heart Disease Risk" ในแถบด้านข้าง)

`run.py` จะเทรนโมเดลนี้ให้อัตโนมัติด้วย (เช็คจาก `model/heart/knn_model.pkl`)

**ข้อควรรู้**: โมเดลนี้พอร์ตแบบตรงไปตรงมาจากต้นฉบับ ซึ่งไม่ได้ปรับ scale ของฟีเจอร์
(BMI/Age ค่าตัวเลขสูงกว่าฟีเจอร์ 0/1 มาก ส่งผลต่อระยะทางใน k-NN) และไม่ได้ปรับเรื่องข้อมูล
ไม่สมดุล (มี HeartDiseaseorAttack=1 แค่ 9.4%) เหมือนต้นฉบับเป๊ะๆ — ผลคือ accuracy ดูสูง (88.6%)
แต่ recall ของกลุ่มเสี่ยงจริงค่อนข้างต่ำ (~13%) ถ้าอยากให้แม่นขึ้น บอกได้เลย ปรับให้ได้
(เช่น เพิ่ม `StandardScaler` + `class_weight="balanced"` แบบเดียวกับที่ทำกับโมเดล stroke)
