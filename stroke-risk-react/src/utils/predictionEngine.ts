import { StrokePredictionInput, PredictionOutput } from '../types';

/**
 * เดิมไฟล์นี้คำนวณความเสี่ยงด้วยสูตร log-odds ที่เขียนมือ (ตัวเลขสมมติ ไม่ได้เทรนจากข้อมูลจริง)
 * ตอนนี้เปลี่ยนมาเรียก Flask backend (`python app.py`) ซึ่งใช้โมเดลที่เทรนจริงจาก
 * data/healthcare-dataset-stroke-data.csv ของคุณแทน — โครงสร้างผลลัพธ์ (PredictionOutput)
 * ยังคงเดิมทุกฟิลด์ ดังนั้นหน้า PredictionPage.tsx ไม่ต้องแก้ JSX ส่วนแสดงผลเลย
 */
export async function calculateStrokeRisk(
  input: StrokePredictionInput,
  modelId: string = 'random-forest'
): Promise<PredictionOutput> {
  const res = await fetch('/api/predict-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, model_id: modelId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `เรียก API พยากรณ์ไม่สำเร็จ (HTTP ${res.status})`);
  }

  return res.json();
}

export const SAMPLE_PRESETS: Array<{
  name: string;
  tag: string;
  description: string;
  data: StrokePredictionInput;
}> = [
  {
    name: 'เคสที่ 1: ผู้สูงอายุความดันสูง & เบาหวาน (ความเสี่ยงสูง)',
    tag: 'High Risk Profile',
    description: 'อายุ 67 ปี, มีประวัติความดันโลหิตสูงและโรคหัวใจ, ระดับน้ำตาล 228 mg/dL',
    data: {
      gender: 'Male',
      age: 67,
      hypertension: 1,
      heart_disease: 1,
      ever_married: 'Yes',
      work_type: 'Private',
      Residence_type: 'Urban',
      avg_glucose_level: 228.5,
      bmi: 34.2,
      smoking_status: 'formerly smoked',
    },
  },
  {
    name: 'เคสที่ 2: วัยทำงานสุขภาพดี (ความเสี่ยงต่ำ)',
    tag: 'Low Risk Profile',
    description: 'อายุ 28 ปี, ไม่มีโรคประจำตัว, น้ำตาลปกติ 85 mg/dL, ไม่สูบบุหรี่',
    data: {
      gender: 'Female',
      age: 28,
      hypertension: 0,
      heart_disease: 0,
      ever_married: 'No',
      work_type: 'Private',
      Residence_type: 'Urban',
      avg_glucose_level: 85.0,
      bmi: 21.8,
      smoking_status: 'never smoked',
    },
  },
  {
    name: 'เคสที่ 3: วัยกลางคนน้ำหนักเกินและสูบบุหรี่ (ความเสี่ยงปานกลาง)',
    tag: 'Medium Risk Profile',
    description: 'อายุ 53 ปี, ความดันปกติแต่น้ำตาลเริ่มสูง 142 mg/dL, สูบบุหรี่',
    data: {
      gender: 'Male',
      age: 53,
      hypertension: 0,
      heart_disease: 0,
      ever_married: 'Yes',
      work_type: 'Self-employed',
      Residence_type: 'Rural',
      avg_glucose_level: 142.3,
      bmi: 29.5,
      smoking_status: 'smokes',
    },
  },
  {
    name: 'เคสที่ 4: ผู้สูงอายุหญิงดูแลสุขภาพดี',
    tag: 'Senior Well-managed',
    description: 'อายุ 74 ปี, คุมอาหารดี น้ำตาล 92 mg/dL, ไม่มีโรคหัวใจ',
    data: {
      gender: 'Female',
      age: 74,
      hypertension: 0,
      heart_disease: 0,
      ever_married: 'Yes',
      work_type: 'Govt_job',
      Residence_type: 'Rural',
      avg_glucose_level: 92.4,
      bmi: 24.1,
      smoking_status: 'never smoked',
    },
  },
];
