import React from 'react';
import {
  Info,
  Brain,
  Database,
  Layers,
  ArrowRight,
  ShieldAlert,
  Heart,
  Activity,
  Award,
  CheckCircle,
  FileText,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const AboutProjectPage: React.FC = () => {
  const { themeConfig, theme } = useTheme();
  const isDark = theme === 'dark';

  const workflowSteps = [
    {
      step: '01',
      title: 'User Input',
      titleThai: 'ผู้ใช้กรอกข้อมูลสุขภาพ',
      description: 'รับข้อมูลสุขภาพ 10 ตัวแปร เช่น อายุ, เพศ, ความดัน, น้ำตาลเฉลี่ย, BMI, และประวัติการสูบบุหรี่',
      icon: <UserCheck className="w-5 h-5 text-blue-500" />,
    },
    {
      step: '02',
      title: 'Data Preprocessing',
      titleThai: 'การประมวลผลและแปลงข้อมูล',
      description: 'One-Hot Encoding สำหรับตัวแปรประเภทกลุ่ม, การแทนที่ค่าสูญหายด้วย Median และ Standard Scaling',
      icon: <Layers className="w-5 h-5 text-purple-500" />,
    },
    {
      step: '03',
      title: 'Machine Learning Model',
      titleThai: 'การประมวลผลด้วยโมเดล AI',
      description: 'ส่งเวกเตอร์ข้อมูลเข้าโมเดล Random Forest Ensemble ที่ผ่านการแก้ปัญหา Class Imbalance ด้วย SMOTE',
      icon: <Brain className="w-5 h-5 text-teal-500" />,
    },
    {
      step: '04',
      title: 'Probability Estimation',
      titleThai: 'การคำนวณความน่าจะเป็น',
      description: 'คำนวณค่าสถิติความเสี่ยงออกมาเป็นเปอร์เซ็นต์ (Probability 0-100%) และแบ่งระดับ LOW / MEDIUM / HIGH',
      icon: <Activity className="w-5 h-5 text-amber-500" />,
    },
    {
      step: '05',
      title: 'XAI & Result Delivery',
      titleThai: 'อธิบายปัจจัยเสี่ยงและแสดงผล',
      description: 'คำนวณ Feature Importance รายบุคคล (Explainable AI) พร้อมข้อความแจ้งเตือนตามมาตรฐานทางการแพทย์',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 mb-2">
          <Info className="w-3.5 h-3.5" />
          <span>Project Documentation & Methodology</span>
        </div>
        <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${themeConfig.textPrimary}`}>
          About Project (เกี่ยวกับโครงการ)
        </h2>
        <p className={`text-xs sm:text-sm ${themeConfig.textSecondary} mt-1`}>
          Stroke Risk Prediction System: โครงงานต้นแบบระบบปัญญาประดิษฐ์เพื่อการศึกษาการพยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง
        </p>
      </div>

      {/* Section 1: Overview and Objective */}
      <div className={`rounded-2xl p-6 sm:p-8 border shadow-sm ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
        <div className="max-w-4xl space-y-4 text-sm leading-relaxed">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>
                ความเป็นมาและปัญหาที่ต้องการแก้ไข (Problem Statement)
              </h3>
              <p className={`text-xs ${themeConfig.textMuted}`}>ทำไมระบบนี้จึงมีความสำคัญต่อการศึกษา</p>
            </div>
          </div>

          <p className={themeConfig.textSecondary}>
            โรคหลอดเลือดสมอง (Stroke) หรืออัมพฤกษ์-อัมพาต เป็นหนึ่งในสาเหตุสำคัญอันดับ 2 ของการเสียชีวิตทั่วโลกตามรายงานขององค์การอนามัยโลก (WHO)
            และเป็นสาเหตุอันดับต้นๆ ของความพิการระยะยาว อย่างไรก็ตาม งานวิจัยทางการแพทย์ระบุว่า <strong>กว่า 80% ของโรคหลอดเลือดสมองสามารถป้องกันได้</strong> หากสามารถระบุและควบคุมปัจจัยเสี่ยงล่วงหน้า เช่น ความดันโลหิตสูง ระดับน้ำตาลในเลือด โรคอ้วน และพฤติกรรมการสูบบุหรี่
          </p>

          <p className={themeConfig.textSecondary}>
            โครงการนี้ถูกพัฒนาขึ้นในฐานะ <strong>โครงงานสำหรับการศึกษาทางปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง (Machine Learning Prototype)</strong> โดยมีเป้าหมายเพื่อทดลองสร้างและประเมินระบบที่สามารถนำข้อมูลตรวจสุขภาพเบื้องต้นมาประมวลผลผ่านโมเดล Machine Learning เพื่อสังเกตการณ์แนวโน้มความสัมพันธ์ของข้อมูล
          </p>
        </div>
      </div>

      {/* Section 2: How It Works Workflow (Section 11) */}
      <div className={`rounded-2xl p-6 sm:p-8 border shadow-sm ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>
              How it works (ขั้นตอนการทำงานของระบบ)
            </h3>
            <p className={`text-xs ${themeConfig.textMuted}`}>
              Workflow สถาปัตยกรรมการประมวลผลตั้งแต่ผู้ใช้กรอกข้อมูลจนถึงการอธิบายผล
            </p>
          </div>
        </div>

        {/* Workflow Diagram Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {workflowSteps.map((step, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                    {step.step}
                  </span>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-inherit">
                    {step.icon}
                  </div>
                </div>

                <h4 className={`font-bold text-xs uppercase tracking-wider ${themeConfig.textPrimary}`}>
                  {step.title}
                </h4>
                <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mt-0.5 mb-2">
                  {step.titleThai}
                </p>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.description}
                </p>
              </div>

              {idx < workflowSteps.length - 1 && (
                <div className="hidden md:flex justify-end pt-2 text-slate-300 dark:text-slate-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Dataset & Features Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset Specifications */}
        <div className={`rounded-2xl p-6 border ${themeConfig.cardBg} ${themeConfig.cardBorder} space-y-3`}>
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-blue-500" />
            <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>ชุดข้อมูล (Dataset Provenance)</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            ระบบใช้ชุดข้อมูล <strong>Kaggle Stroke Prediction Dataset</strong> ซึ่งประกอบด้วยข้อมูลประวัติสุขภาพของผู้เข้ารับการตรวจจำนวน <strong>5,110 ระเบียน (Records)</strong>
          </p>

          <ul className="text-xs space-y-2 pt-2 text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-teal-500 font-bold">•</span>
              <span><strong>Total Records:</strong> 5,110 รายการ</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 font-bold">•</span>
              <span><strong>Positive Class (Stroke = 1):</strong> 249 เคส (~4.87%)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 font-bold">•</span>
              <span><strong>Negative Class (Stroke = 0):</strong> 4,861 เคส (~95.13%)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 font-bold">•</span>
              <span><strong>Missing Values Treatment:</strong> แทนค่า BMI ที่สูญหายด้วย Median (28.1) เพื่อป้องกัน Data Leakage</span>
            </li>
          </ul>
        </div>

        {/* 10 Features Breakdown */}
        <div className={`rounded-2xl p-6 border ${themeConfig.cardBg} ${themeConfig.cardBorder} space-y-3`}>
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-purple-500" />
            <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>10 ตัวแปรที่ใช้ในการพยากรณ์</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            ตัวแปรแบ่งออกเป็นกลุ่มข้อมูลประชากร ชีวเคมี และพฤติกรรมสุขภาพ:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            {[
              { name: 'gender', th: 'เพศ (Male/Female/Other)' },
              { name: 'age', th: 'อายุ (ปี)' },
              { name: 'hypertension', th: 'โรคความดันโลหิตสูง (0/1)' },
              { name: 'heart_disease', th: 'โรคหัวใจ (0/1)' },
              { name: 'ever_married', th: 'สถานะการสมรส' },
              { name: 'work_type', th: 'ประเภทอาชีพ' },
              { name: 'Residence_type', th: 'พื้นที่เขตเมือง/ชนบท' },
              { name: 'avg_glucose_level', th: 'ระดับน้ำตาลเฉลี่ย (mg/dL)' },
              { name: 'bmi', th: 'ดัชนีมวลกาย (kg/m²)' },
              { name: 'smoking_status', th: 'ประวัติการสูบบุหรี่' },
            ].map((f, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-[11px]"
              >
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400 block">{f.name}</span>
                <span className="text-slate-500 dark:text-slate-400">{f.th}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAST Warning Signs Component */}
      <div
        className={`rounded-2xl p-6 border ${
          isDark
            ? 'bg-rose-950/20 border-rose-900/40 text-rose-200'
            : 'bg-rose-50/80 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-6 h-6 text-rose-500" />
          <div>
            <h3 className="font-bold text-base">ความรู้สุขภาพ: สัญญาณเตือนอัมพฤกษ์-อัมพาตตามหลัก F.A.S.T</h3>
            <p className="text-xs opacity-80">หากพบอาการเหล่านี้อย่างเฉียบพลัน ควรรีบไปโรงพยาบาลภายใน 4.5 ชั่วโมง</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-inherit">
            <span className="text-lg font-extrabold text-rose-600 block">F - Face</span>
            <span className="font-bold block mt-1">ใบหน้าชา/เบี้ยว</span>
            <p className="text-[11px] opacity-80 mt-0.5">มุมปากตก ยิ้มแล้วไม่เท่ากันข้างใดข้างหนึ่ง</p>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-inherit">
            <span className="text-lg font-extrabold text-rose-600 block">A - Arms</span>
            <span className="font-bold block mt-1">แขนขาอ่อนแรง</span>
            <p className="text-[11px] opacity-80 mt-0.5">ยกแขนสองข้างไม่เท่ากัน แขนตก หมดแรงทันที</p>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-inherit">
            <span className="text-lg font-extrabold text-rose-600 block">S - Speech</span>
            <span className="font-bold block mt-1">พูดไม่ชัด/ลิ้นแข็ง</span>
            <p className="text-[11px] opacity-80 mt-0.5">พูดตะกุกตะกัก นึกคำไม่ออก หรือฟังไม่เข้าใจ</p>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-inherit">
            <span className="text-lg font-extrabold text-rose-600 block">T - Time</span>
            <span className="font-bold block mt-1">รีบโทร 1669</span>
            <p className="text-[11px] opacity-80 mt-0.5">จดบันทึกเวลาที่เริ่มมีอาการ แล้วไปโรงพยาบาลทันที</p>
          </div>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <MedicalDisclaimer />
    </div>
  );
};
