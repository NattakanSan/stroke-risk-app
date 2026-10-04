import React from 'react';
import {
  Brain,
  Activity,
  Database,
  Users,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Award,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { PageId } from '../types';
import { useDatasetSummary, useDistributions, useModels } from '../hooks/useApi';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
  activeModelId: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, activeModelId }) => {
  const { themeConfig, theme } = useTheme();
  const { models } = useModels();
  const { summary } = useDatasetSummary();
  const { distributions } = useDistributions();
  const activeModel = models.find((m) => m.id === activeModelId) || models[0];
  const isDark = theme === 'dark';

  if (!summary || !distributions || !activeModel) {
    return (
      <div className={`rounded-2xl border p-8 text-center ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
        <p className={`text-sm ${themeConfig.textMuted}`}>กำลังโหลดข้อมูลจากโมเดลจริง...</p>
      </div>
    );
  }

  const STROKE_DISTRIBUTION_DATA = distributions.strokeDistribution;
  const AGE_DISTRIBUTION_DATA = distributions.ageDistribution;
  const BMI_DISTRIBUTION_DATA = distributions.bmiDistribution;
  const FEATURE_IMPORTANCE_DATA = distributions.featureImportance;
  const DATASET_SUMMARY = summary;

  const statCards = [
    {
      title: 'จำนวนข้อมูลใน Dataset',
      value: DATASET_SUMMARY.totalRecords.toLocaleString(),
      unit: 'Records',
      sub: 'Kaggle Health Stroke Dataset',
      icon: <Database className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'ข้อมูลกลุ่ม Stroke (พบภาวะ)',
      value: DATASET_SUMMARY.strokeCases.toLocaleString(),
      unit: `(${DATASET_SUMMARY.strokePercentage}%)`,
      sub: 'Class Imbalance SMOTE Tuned',
      icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
      title: 'ข้อมูลกลุ่ม Non-Stroke (ปกติ)',
      value: DATASET_SUMMARY.nonStrokeCases.toLocaleString(),
      unit: `(${(100 - DATASET_SUMMARY.strokePercentage).toFixed(2)}%)`,
      sub: 'เคสที่ไม่มีประวัติหลอดเลือดสมอง',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'จำนวนตัวแปร (Features)',
      value: DATASET_SUMMARY.featuresCount.toString(),
      unit: 'Features',
      sub: 'สุขภาพ, ชีวประวัติ, พฤติกรรม',
      icon: <Activity className="w-5 h-5 text-purple-500" />,
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'โมเดล AI ที่กำลังใช้งาน',
      value: activeModel.name.split(' ')[0],
      unit: 'Ensemble',
      sub: activeModel.nameThai,
      icon: <Brain className="w-5 h-5 text-teal-500" />,
      bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    },
    {
      title: 'ความแม่นยำรวม (Accuracy)',
      value: `${activeModel.accuracy}%`,
      unit: `ROC-AUC: ${activeModel.rocAuc}`,
      sub: `Recall: ${activeModel.recall}% | F1: ${activeModel.f1Score}%`,
      icon: <Award className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Hero Welcome Card */}
      <div
        id="dashboard-hero-card"
        className={`rounded-2xl p-6 sm:p-8 border shadow-sm relative overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border-slate-800'
            : 'bg-gradient-to-br from-white via-teal-50/40 to-cyan-50/50 border-teal-100'
        }`}
      >
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <Zap className="w-3.5 h-3.5" />
            <span>Healthcare Machine Learning Prototype</span>
          </div>

          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${themeConfig.textPrimary}`}>
            Stroke Risk Prediction
          </h2>
          <p className={`text-sm sm:text-base font-medium text-teal-600 dark:text-teal-400`}>
            ระบบ AI พยากรณ์ความเสี่ยงการเกิดโรคหลอดเลือดในสมอง
          </p>
          <p className={`text-xs sm:text-sm leading-relaxed ${themeConfig.textSecondary} max-w-2xl`}>
            ระบบต้นแบบการเรียนรู้ของเครื่อง (Machine Learning) สำหรับการศึกษาทางวิทยาการข้อมูลสุขภาพ
            วิเคราะห์ความเสี่ยงจาก 10 ตัวแปรสุขภาพด้วยโมเดลสุ่มต้นไม้ (Random Forest) และระบบอธิบายผลการทำนาย (XAI)
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              id="hero-start-prediction-btn"
              type="button"
              onClick={() => onNavigate('prediction')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold shadow-md transition-all ${themeConfig.accentBg} hover:scale-[1.02]`}
            >
              <span>เริ่มทำการพยากรณ์ความเสี่ยง</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-explore-dataset-btn"
              type="button"
              onClick={() => onNavigate('dataset')}
              className={`px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              สำรวจข้อมูล 5,110 รายการ
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <Brain className="w-64 h-64 text-teal-600 dark:text-teal-400" />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-5 border transition-all hover:shadow-md ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${themeConfig.textSecondary}`}>{card.title}</span>
              <div className={`p-2 rounded-xl ${card.bg}`}>{card.icon}</div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${themeConfig.textPrimary}`}>
                {card.value}
              </span>
              <span className={`text-xs font-semibold ${themeConfig.textMuted}`}>{card.unit}</span>
            </div>
            <p className={`mt-1.5 text-xs ${themeConfig.textMuted}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Target Distribution */}
        <div
          id="chart-stroke-distribution"
          className={`rounded-2xl p-5 sm:p-6 border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
                สัดส่วนการเกิด Stroke ใน Dataset
              </h3>
              <p className={`text-xs ${themeConfig.textMuted}`}>
                ความไม่สมดุลของคลาสข้อมูล (Target Imbalance: ~4.9% Stroke)
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              N = 5,110
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={STROKE_DISTRIBUTION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="count"
                  label={(entry: any) => `${entry.name} (${entry.percentage ?? ''}%)`}
                >
                  {STROKE_DISTRIBUTION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} เคส`, 'จำนวน']}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
            * ในทางการแพทย์ อัตราเกิดโรคในประชากรทั่วไปมักต่ำ จึงต้องใช้เทคนิค Balanced Weights หรือ SMOTE ในการเทรนโมเดล
          </div>
        </div>

        {/* Chart 2: Age Distribution and Stroke Cases */}
        <div
          id="chart-age-distribution"
          className={`rounded-2xl p-5 sm:p-6 border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
                การกระจายอายุและอัตราพบ Stroke
              </h3>
              <p className={`text-xs ${themeConfig.textMuted}`}>
                ความเสี่ยงจะเพิ่มขึ้นอย่างก้าวกระโดดในกลุ่มอายุ 50 ปีขึ้นไป
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Age Factor
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={AGE_DISTRIBUTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeConfig.chartTheme.grid} />
                <XAxis dataKey="group" stroke={themeConfig.chartTheme.text} fontSize={11} />
                <YAxis stroke={themeConfig.chartTheme.text} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="strokeCount" name="ผู้พบภาวะ Stroke (เคส)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="strokeRate" name="อัตราส่วนพบภาวะ (%)" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
            * ข้อมูลแสดงให้เห็นว่าช่วงอายุมากกว่า 60 ปี มีอุบัติการณ์เกิด Stroke สูงกว่า 10%
          </div>
        </div>

        {/* Chart 3: BMI Distribution */}
        <div
          id="chart-bmi-distribution"
          className={`rounded-2xl p-5 sm:p-6 border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
                การกระจายดัชนีมวลกาย (BMI Distribution)
              </h3>
              <p className={`text-xs ${themeConfig.textMuted}`}>
                จำแนกตามเกณฑ์มาตรฐานองค์การอนามัยโลก (WHO / Asian Criteria)
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Mean: 28.8
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BMI_DISTRIBUTION_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeConfig.chartTheme.grid} />
                <XAxis dataKey="category" stroke={themeConfig.chartTheme.text} fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke={themeConfig.chartTheme.text} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="จำนวนผู้ตรวจทั้งหมด" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="strokeCount" name="พบภาวะ Stroke" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
            * กลุ่ม Overweight และ Obese มีสัดส่วนผู้พบ Stroke สูงที่สุดในประชากรตัวอย่าง
          </div>
        </div>

        {/* Feature Importance Card */}
        <div
          id="feature-importance-card"
          className={`rounded-2xl p-5 sm:p-6 border flex flex-col justify-between ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
                  ปัจจัยสุขภาพที่สำคัญต่อโมเดล AI
                </h3>
                <p className={`text-xs ${themeConfig.textMuted}`}>
                  น้ำหนักความสำคัญของตัวแปร (Random Forest Feature Importance)
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                XAI Metrics
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {FEATURE_IMPORTANCE_DATA.slice(0, 6).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${themeConfig.textPrimary}`}>{item.thai}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.importance}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${item.importance}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">ผลการวิเคราะห์สอดคล้องกับระบาดวิทยาทางคลินิก</span>
            <button
              onClick={() => onNavigate('model-performance')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>ดูข้อมูลโมเดลละเอียด</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Educational Medical Disclaimer */}
      <MedicalDisclaimer />
    </div>
  );
};
