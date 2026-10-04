import React, { useState } from 'react';
import { X, Scale, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface BmiCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBmi: (bmiValue: number) => void;
  initialBmi?: number;
}

export const BmiCalculatorModal: React.FC<BmiCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyBmi,
  initialBmi,
}) => {
  const { themeConfig, theme } = useTheme();
  const [weight, setWeight] = useState<string>('68');
  const [height, setHeight] = useState<string>('170');
  const [calculatedBmi, setCalculatedBmi] = useState<number | null>(initialBmi || 23.5);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleCalculate = (wStr = weight, hStr = height) => {
    const w = parseFloat(wStr);
    const h = parseFloat(hStr);

    if (w > 0 && h > 0) {
      const heightInMeters = h / 100;
      const bmi = w / (heightInMeters * heightInMeters);
      const rounded = Math.round(bmi * 10) / 10;
      setCalculatedBmi(rounded);
      return rounded;
    }
    setCalculatedBmi(null);
    return null;
  };

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) {
      return {
        label: 'น้ำหนักน้อยกว่าเกณฑ์ (Underweight)',
        color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        barColor: 'bg-amber-400',
        note: 'ควรรับประทานอาหารให้ได้รับพลังงานเพียงพอและสร้างมวลกล้ามเนื้อ',
      };
    }
    if (bmi < 23.0) {
      return {
        label: 'สมส่วน / ปกติ (Normal Weight)',
        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        barColor: 'bg-emerald-500',
        note: 'น้ำหนักอยู่ในเกณฑ์มาตรฐานเอเชีย มีความเสี่ยงต่อโรคหลอดเลือดต่ำสุด',
      };
    }
    if (bmi < 25.0) {
      return {
        label: 'น้ำหนักเกินเกณฑ์ (Overweight)',
        color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800',
        barColor: 'bg-yellow-500',
        note: 'เริ่มมีความเสี่ยง ควรควบคุมปริมาณพลังงานจากอาหารและออกกำลังกาย',
      };
    }
    if (bmi < 30.0) {
      return {
        label: 'โรคอ้วนระดับ 1 (Obese Class I)',
        color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
        barColor: 'bg-orange-500',
        note: 'มีความเสี่ยงต่อภาวะความดันโลหิตสูงและเบาหวานเพิ่มขึ้น',
      };
    }
    return {
      label: 'โรคอ้วนอันตราย (Obese Class II+)',
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      barColor: 'bg-rose-500',
      note: 'ความเสี่ยงสูงมากต่อภาวะหลอดเลือดแดงแข็งและหลอดเลือดสมองอุดตัน',
    };
  };

  const handleApply = () => {
    if (calculatedBmi !== null && calculatedBmi > 0) {
      onApplyBmi(calculatedBmi);
      onClose();
    }
  };

  const category = calculatedBmi ? getBmiCategory(calculatedBmi) : null;

  return (
    <div
      id="bmi-calculator-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="bmi-calculator-modal"
        className={`w-full max-w-md rounded-2xl shadow-2xl border p-6 ${themeConfig.cardBg} ${themeConfig.cardBorder} transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-semibold text-base ${themeConfig.textPrimary}`}>
                เครื่องมือคำนวณค่า BMI
              </h3>
              <p className={`text-xs ${themeConfig.textMuted}`}>Body Mass Index Calculator</p>
            </div>
          </div>
          <button
            id="close-bmi-modal-button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${themeConfig.textSecondary}`}>
                น้ำหนัก (Weight)
              </label>
              <div className="relative">
                <input
                  id="bmi-weight-input"
                  type="number"
                  min="20"
                  max="250"
                  step="0.5"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    handleCalculate(e.target.value, height);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
                  placeholder="65"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                  kg
                </span>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${themeConfig.textSecondary}`}>
                ส่วนสูง (Height)
              </label>
              <div className="relative">
                <input
                  id="bmi-height-input"
                  type="number"
                  min="60"
                  max="230"
                  step="1"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value);
                    handleCalculate(weight, e.target.value);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
                  placeholder="170"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>
          </div>

          {/* Quick presets for testing */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto pb-1">
            <span className="text-[11px] shrink-0 font-medium text-slate-400">ตัวอย่าง:</span>
            {[
              { label: 'สมส่วน', w: '62', h: '168' },
              { label: 'ท้วม', w: '75', h: '165' },
              { label: 'อ้วน', w: '95', h: '170' },
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setWeight(p.w);
                  setHeight(p.h);
                  handleCalculate(p.w, p.h);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] border ${
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                    : 'border-slate-200 bg-slate-100/70 hover:bg-slate-200 text-slate-700'
                } transition-colors`}
              >
                {p.label} ({p.w}kg/{p.h}cm)
              </button>
            ))}
          </div>

          {/* Formula info */}
          <div
            className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              isDark ? 'bg-slate-800/60 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <span>สูตร: BMI = น้ำหนัก (kg) / [ส่วนสูง (m)]²</span>
          </div>

          {/* BMI Result Display Card */}
          {calculatedBmi !== null && (
            <div
              id="bmi-result-card"
              className={`mt-4 rounded-xl p-4 border text-center transition-all ${
                isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                ค่า BMI ที่คำนวณได้
              </span>
              <div className="text-4xl font-extrabold text-teal-600 dark:text-teal-400 my-1">
                {calculatedBmi.toFixed(1)}
                <span className="text-sm font-normal text-slate-400 ml-1.5">kg/m²</span>
              </div>

              {category && (
                <div className="mt-2 space-y-2">
                  <span
                    className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${category.color}`}
                  >
                    {category.label}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-2">{category.note}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              isDark
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            ยกเลิก
          </button>
          <button
            id="use-this-bmi-button"
            type="button"
            onClick={handleApply}
            disabled={!calculatedBmi}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all ${themeConfig.accentBg} disabled:opacity-50`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>นำค่า BMI นี้ไปใช้ (Use this BMI)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
