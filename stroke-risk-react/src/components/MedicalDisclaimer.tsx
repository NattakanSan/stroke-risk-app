import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MedicalDisclaimerProps {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ compact = false }) => {
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  if (compact) {
    return (
      <div
        id="medical-disclaimer-compact"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
          isDark
            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}
      >
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <span>
          <strong>ระบบต้นแบบเพื่อการศึกษา:</strong> ผลการพยากรณ์จากโมเดล AI ไม่ใช่การวินิจฉัยทางการแพทย์
        </span>
      </div>
    );
  }

  return (
    <div
      id="medical-disclaimer-card"
      className={`rounded-xl p-4 sm:p-5 border transition-all ${
        isDark
          ? 'bg-amber-950/20 border-amber-900/50 text-amber-200'
          : 'bg-amber-50/90 border-amber-200/90 text-amber-900'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-sm leading-relaxed">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span>คำเตือนและข้อจำกัดความรับผิดชอบ (Medical Disclaimer)</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                isDark ? 'bg-amber-900/60 text-amber-300' : 'bg-amber-200/70 text-amber-800'
              }`}
            >
              Educational Prototype
            </span>
          </div>
          <p className="text-xs sm:text-sm opacity-95">
            คำเตือน: ระบบนี้เป็นโครงงานสำหรับการศึกษาและใช้โมเดล Machine Learning ในการพยากรณ์จากข้อมูล Dataset เท่านั้น
            ผลลัพธ์ไม่ใช่การวินิจฉัยทางการแพทย์ และไม่ควรใช้แทนคำแนะนำจากแพทย์หรือบุคลากรทางการแพทย์
            หากท่านหรือคนใกล้ชิดมีอาการปากเบี้ยว แขนขาอ่อนแรงข้างใดข้างหนึ่ง พูดไม่ชัด หรือตามัวกะทันหัน (อาการ FAST)
            กรุณาติดต่อสายด่วนการแพทย์ฉุกเฉิน <strong>1669</strong> ทันที
          </p>
          <div className="pt-1.5 flex items-center gap-2 text-xs opacity-80">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>มาตรฐานความปลอดภัยข้อมูลสุขภาพเพื่อการวิจัยทางวิชาการ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
