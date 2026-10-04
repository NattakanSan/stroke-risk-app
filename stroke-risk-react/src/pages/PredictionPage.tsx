import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Calculator,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  HeartPulse,
  Activity,
  User,
  Cigarette,
  Briefcase,
  Home,
  Droplet,
  Scale,
  Calendar,
  Share2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  StrokePredictionInput,
  PredictionOutput,
  Gender,
  WorkType,
  ResidenceType,
  SmokingStatus,
} from '../types';
import { calculateStrokeRisk, SAMPLE_PRESETS } from '../utils/predictionEngine';
import { BmiCalculatorModal } from '../components/BmiCalculatorModal';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface PredictionPageProps {
  activeModelId: string;
}

const DEFAULT_FORM: StrokePredictionInput = {
  gender: 'Female',
  age: 48,
  hypertension: 0,
  heart_disease: 0,
  ever_married: 'Yes',
  work_type: 'Private',
  Residence_type: 'Urban',
  avg_glucose_level: 98.5,
  bmi: 24.5,
  smoking_status: 'never smoked',
};

export const PredictionPage: React.FC<PredictionPageProps> = ({ activeModelId }) => {
  const { themeConfig, theme } = useTheme();
  const [formData, setFormData] = useState<StrokePredictionInput>(DEFAULT_FORM);
  const [result, setResult] = useState<PredictionOutput | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isBmiModalOpen, setIsBmiModalOpen] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // เรียกพยากรณ์ค่าเริ่มต้นครั้งแรกตอนเปิดหน้า (เดิมเป็นการคำนวณ sync ในสูตร แต่ตอนนี้
  // เป็นการเรียก API จริง จึงต้องทำผ่าน useEffect แทน useState initializer)
  useEffect(() => {
    let alive = true;
    calculateStrokeRisk(DEFAULT_FORM, activeModelId)
      .then((pred) => { if (alive) setResult(pred); })
      .catch((err) => { if (alive) setValidationError(err.message); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (field: keyof StrokePredictionInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setValidationError(null);
  };

  const handleApplyPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setFormData(preset.data);
    setValidationError(null);
    setIsCalculating(true);
    // Instant recalculate on preset select (ตอนนี้เป็นการเรียก API จริง)
    calculateStrokeRisk(preset.data, activeModelId)
      .then((pred) => setResult(pred))
      .catch((err) => setValidationError(err.message))
      .finally(() => setIsCalculating(false));
  };

  const handleReset = () => {
    setFormData(DEFAULT_FORM);
    setResult(null);
    setValidationError(null);
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (isNaN(formData.age) || formData.age < 0 || formData.age > 120) {
      setValidationError('กรุณากรอกอายุที่ถูกต้อง (ระหว่าง 0 - 120 ปี)');
      return;
    }
    if (isNaN(formData.avg_glucose_level) || formData.avg_glucose_level < 40 || formData.avg_glucose_level > 400) {
      setValidationError('กรุณากรอกระดับน้ำตาลเฉลี่ย (ระหว่าง 40 - 400 mg/dL)');
      return;
    }
    if (isNaN(formData.bmi) || formData.bmi < 10 || formData.bmi > 80) {
      setValidationError('กรุณากรอกค่า BMI ที่ถูกต้อง (ระหว่าง 10 - 80 kg/m²) หรือใช้เครื่องคำนวณ BMI');
      return;
    }

    setIsCalculating(true);
    setValidationError(null);

    // เรียกโมเดลจริงผ่าน Flask backend (เดิมใช้ setTimeout จำลอง latency ของสูตรมือ)
    calculateStrokeRisk(formData, activeModelId)
      .then((pred) => {
        setResult(pred);
        const resultElem = document.getElementById('prediction-result-section');
        if (resultElem) {
          resultElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      })
      .catch((err) => setValidationError(err.message))
      .finally(() => setIsCalculating(false));
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 mb-2">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>AI Risk Assessment Form</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${themeConfig.textPrimary}`}>
            Stroke Risk Prediction
          </h2>
          <p className={`text-sm ${themeConfig.textSecondary} mt-1`}>
            กรอกข้อมูลสุขภาพ 10 ปัจจัย เพื่อให้โมเดล Machine Learning วิเคราะห์รูปแบบความสัมพันธ์กับโรคหลอดเลือดในสมอง
          </p>
        </div>

        {/* Quick presets for university demo */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400">เคสจำลอง:</span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              id={`preset-btn-${idx}`}
              onClick={() => handleApplyPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 hover:border-teal-400 text-slate-300'
                  : 'bg-white border-slate-200 hover:border-teal-500 text-slate-700 shadow-2xs'
              }`}
              title={preset.description}
            >
              {preset.tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Left / Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form (7 Cols) */}
        <div className="lg:col-span-7">
          <form
            id="stroke-prediction-form"
            onSubmit={handlePredict}
            className={`rounded-2xl border p-5 sm:p-7 shadow-sm transition-all ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
                    แบบฟอร์มข้อมูลสุขภาพผู้ตรวจ
                  </h3>
                  <p className={`text-xs ${themeConfig.textMuted}`}>
                    ระบุข้อมูลตามความเป็นจริงเพื่อความแม่นยำของโมเดล
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                title="ล้างข้อมูลเป็นค่าเริ่มต้น"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ต</span>
              </button>
            </div>

            {validationError && (
              <div
                id="form-validation-alert"
                className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Field Sections */}
            <div className="mt-6 space-y-6">
              {/* Row 1: Gender & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${themeConfig.textPrimary}`}>
                    เพศ (Gender) *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Male', 'Female', 'Other'] as Gender[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        id={`gender-${g.toLowerCase()}`}
                        onClick={() => handleInputChange('gender', g)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                          formData.gender === g
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : `${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`
                        }`}
                      >
                        {g === 'Male' ? 'ชาย (Male)' : g === 'Female' ? 'หญิง (Female)' : 'อื่นๆ (Other)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-semibold ${themeConfig.textPrimary}`}>
                      อายุ (Age) *
                    </label>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      {formData.age} ปี
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="age-input"
                      type="number"
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
                      placeholder="ระบุอายุ"
                      required
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 pointer-events-none">
                      ปี
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Medical Conditions (Hypertension & Heart Disease) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hypertension */}
                <div className={`p-4 rounded-xl border ${themeConfig.cardBorder} bg-slate-50/50 dark:bg-slate-800/40`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-rose-500" />
                      <span className={`text-xs font-semibold ${themeConfig.textPrimary}`}>
                        โรคความดันโลหิตสูง
                      </span>
                    </div>
                  </div>
                  <p className={`text-[11px] mb-3 ${themeConfig.textMuted}`}>
                    Hypertension (ค่าความดันสูงเรื้อรัง)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 0, label: 'ไม่มี (No)' },
                      { val: 1, label: 'มีภาวะนี้ (Yes)' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        id={`hypertension-${opt.val}`}
                        onClick={() => handleInputChange('hypertension', opt.val)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          formData.hypertension === opt.val
                            ? opt.val === 1
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-teal-600 text-white border-teal-600'
                            : `${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heart Disease */}
                <div className={`p-4 rounded-xl border ${themeConfig.cardBorder} bg-slate-50/50 dark:bg-slate-800/40`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-500" />
                      <span className={`text-xs font-semibold ${themeConfig.textPrimary}`}>
                        ประวัติโรคหัวใจ
                      </span>
                    </div>
                  </div>
                  <p className={`text-[11px] mb-3 ${themeConfig.textMuted}`}>
                    Heart Disease (หลอดเลือดหัวใจ, หัวใจเต้นผิดจังหวะ)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 0, label: 'ไม่มี (No)' },
                      { val: 1, label: 'มีประวัติ (Yes)' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        id={`heart-disease-${opt.val}`}
                        onClick={() => handleInputChange('heart_disease', opt.val)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          formData.heart_disease === opt.val
                            ? opt.val === 1
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-teal-600 text-white border-teal-600'
                            : `${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Glucose & BMI with BMI Calculator Modal trigger */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Average Glucose Level */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-semibold ${themeConfig.textPrimary}`}>
                      ระดับน้ำตาลเฉลี่ย (Avg Glucose) *
                    </label>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      {formData.avg_glucose_level.toFixed(1)} mg/dL
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="glucose-input"
                      type="number"
                      step="0.1"
                      min="40"
                      max="400"
                      value={formData.avg_glucose_level}
                      onChange={(e) =>
                        handleInputChange('avg_glucose_level', parseFloat(e.target.value) || 0)
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
                      placeholder="เช่น 95.0"
                      required
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 pointer-events-none">
                      mg/dL
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span>ปกติ: 70 - 99</span>
                    <span>เสี่ยงเบาหวาน: ≥ 126</span>
                  </div>
                </div>

                {/* BMI with Calculator Button */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-semibold ${themeConfig.textPrimary}`}>
                      ดัชนีมวลกาย (BMI) *
                    </label>
                    <button
                      id="open-bmi-calc-button"
                      type="button"
                      onClick={() => setIsBmiModalOpen(true)}
                      className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Calculate BMI</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="bmi-input"
                      type="number"
                      step="0.1"
                      min="10"
                      max="80"
                      value={formData.bmi}
                      onChange={(e) => handleInputChange('bmi', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
                      placeholder="เช่น 24.2"
                      required
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 pointer-events-none">
                      kg/m²
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span>มาตรฐานเอเชีย: 18.5 - 22.9</span>
                    <button
                      type="button"
                      onClick={() => setIsBmiModalOpen(true)}
                      className="text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      คำนวณจาก น้ำหนัก/ส่วนสูง
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 4: Smoking Status */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${themeConfig.textPrimary}`}>
                  ประวัติการสูบบุหรี่ (Smoking Status) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'never smoked', label: 'ไม่เคยสูบ (Never)' },
                    { id: 'formerly smoked', label: 'เคยสูบในอดีต (Formerly)' },
                    { id: 'smokes', label: 'สูบประจำ (Smokes)' },
                    { id: 'Unknown', label: 'ไม่ระบุ (Unknown)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      id={`smoking-${opt.id.replace(' ', '-')}`}
                      onClick={() => handleInputChange('smoking_status', opt.id as SmokingStatus)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        formData.smoking_status === opt.id
                          ? 'bg-teal-600 text-white border-teal-600 font-semibold shadow-xs'
                          : `${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5: Work Type, Ever Married, Residence Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                {/* Ever Married */}
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${themeConfig.textPrimary}`}>
                    สถานะการสมรส (Ever Married)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'Yes', label: 'สมรสแล้ว (Yes)' },
                      { val: 'No', label: 'โสด / หย่าร้าง (No)' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        id={`ever-married-${opt.val.toLowerCase()}`}
                        onClick={() => handleInputChange('ever_married', opt.val)}
                        className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                          formData.ever_married === opt.val
                            ? 'bg-teal-600 text-white border-teal-600 font-semibold'
                            : `${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Residence Type */}
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${themeConfig.textPrimary}`}>
                    ที่อยู่อาศัย (Residence Type)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'Urban', label: 'เขตเมือง (Urban)' },
                      { val: 'Rural', label: 'ชนบท (Rural)' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        id={`residence-${opt.val.toLowerCase()}`}
                        onClick={() => handleInputChange('Residence_type', opt.val)}
                        className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                          formData.Residence_type === opt.val
                            ? 'bg-teal-600 text-white border-teal-600 font-semibold'
                            : `${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Work Type */}
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${themeConfig.textPrimary}`}>
                    ประเภทงาน (Work Type)
                  </label>
                  <select
                    id="work-type-select"
                    value={formData.work_type}
                    onChange={(e) => handleInputChange('work_type', e.target.value as WorkType)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
                  >
                    <option value="Private">เอกชน (Private)</option>
                    <option value="Self-employed">ธุรกิจส่วนตัว (Self-employed)</option>
                    <option value="Govt_job">ราชการ / รัฐวิสาหกิจ (Govt_job)</option>
                    <option value="children">เด็ก / นักเรียน (Children)</option>
                    <option value="Never_worked">ยังไม่เคยทำงาน (Never_worked)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Big Predict Action Button */}
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                id="predict-stroke-risk-button"
                type="submit"
                disabled={isCalculating}
                className={`w-full py-4 px-6 rounded-2xl text-base font-bold shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer ${themeConfig.accentBg}`}
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>โมเดล AI กำลังประมวลผลข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-6 h-6" />
                    <span>พยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง (Predict Stroke Risk)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Prediction Result & Explanation (5 Cols) */}
        <div id="prediction-result-section" className="lg:col-span-5 space-y-6">
          {result ? (
            <>
              {/* Result Card */}
              <div
                id="prediction-result-card"
                className={`rounded-2xl border p-6 shadow-md transition-all ${themeConfig.cardBg} ${
                  result.riskLevel === 'HIGH'
                    ? 'border-rose-300 dark:border-rose-900/60 shadow-rose-500/5'
                    : result.riskLevel === 'MEDIUM'
                    ? 'border-amber-300 dark:border-amber-900/60 shadow-amber-500/5'
                    : 'border-emerald-300 dark:border-emerald-900/60 shadow-emerald-500/5'
                }`}
              >
                {/* Result Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                      Prediction Result
                    </span>
                    <h3 className={`text-base font-bold ${themeConfig.textPrimary}`}>
                      ผลการพยากรณ์จากโมเดล
                    </h3>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      result.riskLevel === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        : result.riskLevel === 'MEDIUM'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {result.modelUsed.split(' ')[0]} Model
                  </span>
                </div>

                {/* Probability & Risk Level Gauge */}
                <div className="py-6 text-center">
                  <span className="text-xs font-semibold text-slate-400 block mb-1">
                    ระดับความเสี่ยงจากโมเดล (Risk Level)
                  </span>

                  <div className="inline-flex items-center gap-2 mb-4">
                    <span
                      className={`text-2xl sm:text-3xl font-black px-4 py-1.5 rounded-xl border ${
                        result.riskLevel === 'HIGH'
                          ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                          : result.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                          : 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      {result.riskLevel} RISK
                    </span>
                  </div>

                  {/* Circular / Large Probability Display */}
                  <div className="my-2">
                    <div className="text-5xl sm:text-6xl font-black tracking-tight">
                      <span
                        className={
                          result.riskLevel === 'HIGH'
                            ? 'text-rose-600 dark:text-rose-400'
                            : result.riskLevel === 'MEDIUM'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {result.probability}%
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-400 mt-1 block">
                      Probability (โอกาสทางสถิติของโมเดล)
                    </span>
                  </div>

                  {/* Visual Multi-step Risk Progress Bar */}
                  <div className="w-full mt-5 px-2">
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          result.riskLevel === 'HIGH'
                            ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                            : result.riskLevel === 'MEDIUM'
                            ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${result.probability}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                      <span>0% (ต่ำ)</span>
                      <span>25% (ปานกลาง)</span>
                      <span>55% (สูง)</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Mandated Compliant Model Statement */}
                <div
                  id="model-statement-box"
                  className={`p-4 rounded-xl border text-sm leading-relaxed transition-all ${
                    result.stroke === 1
                      ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                      : 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {result.stroke === 1 ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-xs uppercase tracking-wider block opacity-75 mb-0.5">
                        Target Classification (Stroke = {result.stroke})
                      </span>
                      <p className="font-semibold text-sm">{result.modelStatement}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 text-center">
                  เวลาที่ประมวลผล: {result.assessedAt} น. | อ้างอิงจากแบบจำลองการเรียนรู้ของเครื่อง
                </div>
              </div>

              {/* Section 7: EXPLANATION - ปัจจัยที่มีผลต่อการพยากรณ์ */}
              <div
                id="feature-explanation-section"
                className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    <h4 className={`font-bold text-sm ${themeConfig.textPrimary}`}>
                      ปัจจัยที่มีผลต่อการพยากรณ์ (Explainable AI)
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Relative Weight</span>
                </div>
                <p className={`text-xs ${themeConfig.textMuted} mb-4`}>
                  แสดงค่าน้ำหนักความสำคัญของปัจจัยแต่ละข้อต่อการจำแนกความเสี่ยงของโมเดลสำหรับผู้ตรวจรายนี้:
                </p>

                {/* Factor Importance Bars */}
                <div className="space-y-3.5">
                  {result.factors.map((factor, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${themeConfig.textPrimary}`}>
                          {factor.featureThai}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {factor.userValueText}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              factor.isRiskDriver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {factor.importance}%
                          </span>
                        </div>
                      </div>

                      {/* Bar Representation */}
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            factor.isRiskDriver
                              ? 'bg-rose-500'
                              : 'bg-teal-500'
                          }`}
                          style={{ width: `${factor.importance}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{factor.explanation}</p>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                      คำแนะนำการส่งเสริมสุขภาพเชิงป้องกัน:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-teal-500 shrink-0 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div
              className={`rounded-2xl border p-8 text-center border-dashed ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-3">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <h4 className={`font-bold text-base ${themeConfig.textPrimary}`}>
                พร้อมสำหรับการพยากรณ์
              </h4>
              <p className={`text-xs ${themeConfig.textMuted} mt-1.5 max-w-sm mx-auto`}>
                กรุณากรอกข้อมูลในแบบฟอร์มด้านซ้ายให้ครบถ้วน จากนั้นกดปุ่ม "Predict Stroke Risk" เพื่อดูผลการวิเคราะห์
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section 12: Medical Disclaimer at bottom of prediction page */}
      <MedicalDisclaimer />

      {/* BMI Calculator Modal */}
      <BmiCalculatorModal
        isOpen={isBmiModalOpen}
        onClose={() => setIsBmiModalOpen(false)}
        initialBmi={formData.bmi}
        onApplyBmi={(newBmi) => {
          handleInputChange('bmi', newBmi);
        }}
      />
    </div>
  );
};
