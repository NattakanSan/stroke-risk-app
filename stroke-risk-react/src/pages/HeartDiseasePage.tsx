import React, { useState } from 'react';
import { HeartPulse, RotateCcw, AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { BmiCalculatorModal } from '../components/BmiCalculatorModal';

/**
 * หน้านี้พอร์ตมาจากโปรแกรม Desktop เดิมของผู้ใช้ "Calculate the risk of heart disease.py"
 * (Tkinter/CustomTkinter) — ใช้ตรรกะ/ฟีเจอร์/โมเดลเดียวกันทุกจุด เปลี่ยนแค่ UI จาก
 * หน้าต่างโปรแกรมมาเป็นหน้าเว็บที่เรียก /api/heart/predict (Flask backend) แทน
 */

const AGE_CODE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: '18-24 ปี' }, { value: 2, label: '25-29 ปี' }, { value: 3, label: '30-34 ปี' },
  { value: 4, label: '35-39 ปี' }, { value: 5, label: '40-44 ปี' }, { value: 6, label: '45-49 ปี' },
  { value: 7, label: '50-54 ปี' }, { value: 8, label: '55-59 ปี' }, { value: 9, label: '60-64 ปี' },
  { value: 10, label: '65-69 ปี' }, { value: 11, label: '70-74 ปี' }, { value: 12, label: '75-79 ปี' },
  { value: 13, label: '80 ปีขึ้นไป' },
];

interface HeartFormState {
  HighBP: 0 | 1;
  HighChol: 0 | 1;
  CholCheck: 0 | 1;
  BMI: number;
  Smoker: 0 | 1;
  Stroke: 0 | 1;
  Diabetes: 0 | 1 | 2;
  PhysActivity: 0 | 1;
  Fruits: 0 | 1;
  Veggies: 0 | 1;
  Sex: 0 | 1;
  Age: number;
}

const DEFAULT_FORM: HeartFormState = {
  HighBP: 0, HighChol: 0, CholCheck: 1, BMI: 24, Smoker: 0, Stroke: 0,
  Diabetes: 0, PhysActivity: 1, Fruits: 1, Veggies: 1, Sex: 0, Age: 5,
};

interface HeartPredictResult {
  modelChoice: 'knn' | 'lir';
  prediction: number | null;
  riskScore: number | null;
  riskScoreClamped?: number;
  resultText: string;
  subText: string;
  riskLevel: 'low' | 'high';
  modelAccuracyPct?: number;
  modelR2?: number;
}

function ToggleField({
  label, value, options, onChange, isDark,
}: {
  label: string;
  value: number;
  options: Array<{ value: number; label: string }>;
  onChange: (v: number) => void;
  isDark: boolean;
}) {
  const { themeConfig } = useTheme();
  return (
    <div>
      <label className={`block text-xs font-semibold mb-2 ${themeConfig.textPrimary}`}>{label}</label>
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
              value === opt.value
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const HeartDiseasePage: React.FC = () => {
  const { themeConfig, theme } = useTheme();
  const isDark = theme === 'dark';
  const [form, setForm] = useState<HeartFormState>(DEFAULT_FORM);
  const [modelChoice, setModelChoice] = useState<'knn' | 'lir'>('knn');
  const [result, setResult] = useState<HeartPredictResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBmiModalOpen, setIsBmiModalOpen] = useState(false);

  const set = <K extends keyof HeartFormState>(key: K, value: HeartFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const yesNo = [{ value: 0, label: 'ไม่มี' }, { value: 1, label: 'มี' }];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.BMI < 10 || form.BMI > 70) {
      setError('BMI ต้องอยู่ในช่วง 10 - 70 kg/m² หรือใช้เครื่องคำนวณ BMI');
      return;
    }
    setIsCalculating(true);
    setError(null);
    fetch('/api/heart/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, model_choice: modelChoice }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setResult(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsCalculating(false));
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${themeConfig.textPrimary}`}>Heart Disease Risk</h1>
          <p className={`text-sm ${themeConfig.textSecondary} mt-1`}>
            กรอกข้อมูลสุขภาพ 12 ปัจจัย — พอร์ตมาจากระบบพยากรณ์ความเสี่ยงโรคหัวใจที่ทำไว้ก่อนหน้านี้
            (เทรนจาก BRFSS2015 Heart Disease Health Indicators, Kaggle, 253,680 แถว)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className={`rounded-2xl border p-5 sm:p-7 shadow-sm transition-all ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>แบบฟอร์มข้อมูลสุขภาพ</h3>
                  <p className={`text-xs ${themeConfig.textMuted}`}>ระบุข้อมูลตามความเป็นจริงเพื่อความแม่นยำของโมเดล</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ต</span>
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleField label="เพศ (Sex)" value={form.Sex} isDark={isDark}
                  options={[{ value: 0, label: 'หญิง' }, { value: 1, label: 'ชาย' }]}
                  onChange={(v) => set('Sex', v as 0 | 1)} />
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${themeConfig.textPrimary}`}>ช่วงอายุ (Age)</label>
                  <select
                    value={form.Age}
                    onChange={(e) => set('Age', Number(e.target.value))}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {AGE_CODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.value} - {opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleField label="ความดันโลหิตสูง (HighBP)" value={form.HighBP} options={yesNo} isDark={isDark}
                  onChange={(v) => set('HighBP', v as 0 | 1)} />
                <ToggleField label="คอเลสเตอรอลสูง (HighChol)" value={form.HighChol} options={yesNo} isDark={isDark}
                  onChange={(v) => set('HighChol', v as 0 | 1)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleField label="เคยตรวจคอเลสเตอรอล (CholCheck)" value={form.CholCheck} options={[{ value: 0, label: 'ไม่เคย' }, { value: 1, label: 'เคย' }]} isDark={isDark}
                  onChange={(v) => set('CholCheck', v as 0 | 1)} />
                <ToggleField label="สูบบุหรี่ (Smoker)" value={form.Smoker} options={[{ value: 0, label: 'ไม่สูบ' }, { value: 1, label: 'สูบ' }]} isDark={isDark}
                  onChange={(v) => set('Smoker', v as 0 | 1)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleField label="เคยเป็นโรคหลอดเลือดสมอง (Stroke)" value={form.Stroke} options={[{ value: 0, label: 'ไม่เคย' }, { value: 1, label: 'เคย' }]} isDark={isDark}
                  onChange={(v) => set('Stroke', v as 0 | 1)} />
                <ToggleField label="เป็นเบาหวาน (Diabetes)" value={form.Diabetes} isDark={isDark}
                  options={[{ value: 0, label: 'ไม่เป็น' }, { value: 1, label: 'ภาวะก่อนเบาหวาน' }, { value: 2, label: 'เป็นเบาหวาน' }]}
                  onChange={(v) => set('Diabetes', v as 0 | 1 | 2)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleField label="ออกกำลังกายสม่ำเสมอ (PhysActivity)" value={form.PhysActivity} options={[{ value: 0, label: 'ไม่ออก' }, { value: 1, label: 'ออก' }]} isDark={isDark}
                  onChange={(v) => set('PhysActivity', v as 0 | 1)} />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-semibold ${themeConfig.textPrimary}`}>ดัชนีมวลกาย (BMI)</label>
                    <button type="button" onClick={() => setIsBmiModalOpen(true)} className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline">
                      คำนวณ BMI
                    </button>
                  </div>
                  <input
                    type="number" step="0.1" min={10} max={70} value={form.BMI}
                    onChange={(e) => set('BMI', Number(e.target.value))}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleField label="ทานผลไม้เป็นประจำ (Fruits)" value={form.Fruits} options={[{ value: 0, label: 'ไม่ทาน' }, { value: 1, label: 'ทาน' }]} isDark={isDark}
                  onChange={(v) => set('Fruits', v as 0 | 1)} />
                <ToggleField label="ทานผักเป็นประจำ (Veggies)" value={form.Veggies} options={[{ value: 0, label: 'ไม่ทาน' }, { value: 1, label: 'ทาน' }]} isDark={isDark}
                  onChange={(v) => set('Veggies', v as 0 | 1)} />
              </div>

              <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <label className={`block text-xs font-semibold mb-2 ${themeConfig.textPrimary}`}>เลือกโมเดลที่ใช้พยากรณ์</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setModelChoice('knn')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      modelChoice === 'knn' ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                    k-NN (จำแนกกลุ่ม)
                  </button>
                  <button type="button" onClick={() => setModelChoice('lir')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      modelChoice === 'lir' ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                    Linear Regression (คะแนนต่อเนื่อง)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCalculating}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm shadow-rose-500/30 transition-all disabled:opacity-60"
              >
                {isCalculating ? 'กำลังประมวลผล...' : 'พยากรณ์ความเสี่ยงโรคหัวใจ'}
              </button>
            </div>
          </form>
        </div>

        {/* Result */}
        <div className="lg:col-span-5">
          <div className={`rounded-2xl border p-5 sm:p-7 shadow-sm ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
            <h3 className={`font-bold text-base mb-4 ${themeConfig.textPrimary}`}>ผลการพยากรณ์</h3>

            {!result ? (
              <div className={`text-sm text-center py-16 ${themeConfig.textMuted}`}>
                กรอกข้อมูลแล้วกดพยากรณ์เพื่อดูผลลัพธ์
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                  result.riskLevel === 'high'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                }`}>
                  {result.riskLevel === 'high' ? (
                    <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <p className={`font-bold text-sm ${result.riskLevel === 'high' ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      {result.resultText}
                    </p>
                    <p className={`text-xs mt-1 ${themeConfig.textMuted}`}>{result.subText}</p>
                  </div>
                </div>

                {result.modelChoice === 'lir' && result.riskScore !== null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={themeConfig.textMuted}>คะแนนความเสี่ยง (0-1)</span>
                      <span className="font-bold">{result.riskScore.toFixed(4)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full ${result.riskLevel === 'high' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(result.riskScoreClamped ?? 0) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className={`flex items-center gap-2 text-[11px] p-3 rounded-lg ${isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {result.modelChoice === 'knn'
                      ? `โมเดล k-NN (k=3) ความแม่นยำบนชุดทดสอบ ${result.modelAccuracyPct}%`
                      : `โมเดล Linear Regression R² บนชุดทดสอบ ${result.modelR2}`}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6">
              <MedicalDisclaimer compact />
            </div>
          </div>
        </div>
      </div>

      <BmiCalculatorModal
        isOpen={isBmiModalOpen}
        onClose={() => setIsBmiModalOpen(false)}
        onApplyBmi={(bmi) => set('BMI', Math.round(bmi * 10) / 10)}
        initialBmi={form.BMI}
      />
    </div>
  );
};
