# Stroke Risk Prediction — หน้าเว็บ React (เชื่อมกับข้อมูลจริงแล้ว)

โปรเจกต์นี้เดิมมาจากไฟล์ตัวอย่างที่สร้างด้วย Google AI Studio — **หน้าตาสวยแต่ทุกตัวเลขเป็นของสมมติ**
(สูตรพยากรณ์เขียนมือ, ข้อมูล dataset มีแค่ ~40 แถวปลอม, ผลเทียบ 4 โมเดลก็แต่งขึ้นเอง)

ตอนนี้แก้ให้ต่อกับ **Flask backend จริง** (โฟลเดอร์ `stroke-risk-app/` ที่เทรนจาก CSV ของคุณจริงๆ)
แล้ว — โครงหน้าตา/design เดิมทั้งหมดไม่ได้แตะเลย เปลี่ยนแค่แหล่งข้อมูลจากไฟล์ hardcode
เป็นการเรียก API จริง

## วิธีรัน

**แนะนำ: จากโฟลเดอร์ `stroke-risk-app/` (โฟลเดอร์แม่) รันคำสั่งเดียว**
```bash
cd stroke-risk-app
python run.py
```
จะ build หน้าเว็บ React ตัวนี้ให้อัตโนมัติแล้วให้ Flask (port 5000) serve ทั้งหน้าเว็บ
และ API จากเซิร์ฟเวอร์เดียว ไม่ต้องเปิด 2 terminal — ดูรายละเอียดที่ README หลักของ
`stroke-risk-app/`

**หรือถ้ากำลังแก้โค้ดหน้านี้บ่อยๆ และอยาก hot-reload (ต้องรัน 2 โปรเจกต์พร้อมกัน):**

Terminal 1 — Backend (ต้องรันค้างไว้ก่อนเสมอ):
```bash
cd stroke-risk-app
python -m pip install -r requirements.txt   # ถ้ายังไม่เคยลง
python train_model.py                        # เทรนโมเดล 4 ตัวจาก CSV จริง (รันครั้งแรกครั้งเดียว)
python app.py                                # เปิดที่ port 5000
```

Terminal 2 — หน้าเว็บ React (มี hot-reload):
```bash
cd stroke-risk-react
npm install
npm run dev                                  # เปิดที่ http://localhost:3000
```

Vite ตั้ง proxy ให้ `/api/*` ที่เรียกจากหน้าเว็บ React วิ่งไปที่ Flask (port 5000) ให้อัตโนมัติแล้ว
(ดูใน `vite.config.ts`) จึงไม่มีปัญหา CORS — **แค่ต้องเปิด backend ค้างไว้ก่อนเปิดหน้าเว็บเสมอ**

## สิ่งที่เปลี่ยนจากไฟล์ตัวอย่างเดิม

| ไฟล์ | เดิม | ตอนนี้ |
|---|---|---|
| `src/utils/predictionEngine.ts` | สูตร log-odds เขียนมือ | เรียก `/api/predict-v2` ใช้โมเดลจริงที่เทรนจาก CSV |
| `src/data/strokeDataset.ts` | ~40 แถวปลอม + กราฟแต่งตัวเลข | ลบทิ้ง แทนด้วย `src/hooks/useApi.ts` ที่ดึงข้อมูลจริงทั้ง 5,110 แถว |
| `src/data/modelPerformance.ts` | ตัวเลข 4 โมเดลที่แต่งขึ้นเอง | ลบทิ้ง แทนด้วยผลเทรนจริงของ Random Forest / Logistic Regression / Decision Tree / Gradient Boosting |
| Confusion Matrix ในหน้า Model Performance | ค้างที่ค่า Random Forest เสมอไม่ว่าจะเลือกโมเดลไหน (บั๊กเดิม) | เปลี่ยนตามโมเดลที่เลือกจริง |

หน้าตา/เลย์เอาต์/ธีม/แอนิเมชันทั้งหมดยังเหมือนเดิมทุกอย่าง — เปลี่ยนแค่ตัวเลขให้เป็นของจริง

## หมายเหตุ

- **"Gradient Boosting"** ในหน้า Model Performance ใช้ `GradientBoostingClassifier` ของ
  scikit-learn แทน XGBoost จริง เพราะเครื่องที่เทรนให้ไม่มีไลบรารี `xgboost` ติดตั้งไว้
  ผลลัพธ์เป็นของจริงจากข้อมูลจริงเหมือนกัน แค่ไม่ใช่อัลกอริทึม XGBoost โดยตรง
  ถ้าต้องการ XGBoost จริง ติดตั้งด้วย `pip install xgboost` แล้วแก้ `train_model.py` ในฝั่ง
  backend ให้ import และใช้ `xgboost.XGBClassifier` แทนได้เลย
- ทุก endpoint คำนวณ threshold การตัดสิน stroke=1 ที่ 0.45 ให้ตรงกับข้อความ
  "Threshold: 0.45" ที่โชว์อยู่ในหน้า Model Performance อยู่แล้ว
- `metadata.json` เป็นของเดิมจาก Google AI Studio (สำหรับ deploy ขึ้น Cloud Run พร้อม
  Gemini API) ไม่ได้ใช้งานในโปรเจกต์นี้ ทิ้งไว้เฉยๆ ไม่มีผลอะไร — ส่วน `.env.example`,
  `express`, `@google/genai`, `dotenv`, `tsx` ที่เคยติดมากับเทมเพลตเดิม (ไม่เกี่ยวกับแอปนี้
  เลยและไม่มีที่ไหนใน `src/` เรียกใช้) ถูกลบออกไปแล้วเพื่อให้ `npm install` เบาและตั้งค่าง่ายขึ้น
