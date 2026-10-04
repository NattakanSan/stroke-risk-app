import React, { useState } from 'react';
import {
  LineChart,
  Brain,
  CheckCircle2,
  Award,
  Zap,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart as RechartsLineChart,
  Line,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useModels, useRocCurve } from '../hooks/useApi';

interface ModelPerformancePageProps {
  activeModelId: string;
  onSetActiveModelId: (id: string) => void;
}

export const ModelPerformancePage: React.FC<ModelPerformancePageProps> = ({
  activeModelId,
  onSetActiveModelId,
}) => {
  const { themeConfig, theme } = useTheme();
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'f1Score' | 'recall' | 'precision' | 'rocAuc'>('f1Score');
  const { models: ML_MODELS, loading: modelsLoading } = useModels();
  const { rocCurve: ROC_CURVE_DATA, loading: rocLoading } = useRocCurve();

  const isDark = theme === 'dark';
  const activeModel = ML_MODELS.find((m) => m.id === activeModelId) || ML_MODELS[0];

  if (modelsLoading || rocLoading || !activeModel) {
    return (
      <div className={`rounded-2xl border p-8 text-center ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
        <p className={`text-sm ${themeConfig.textMuted}`}>กำลังโหลดผลการเทรนโมเดลจริงทั้ง 4 ตัว...</p>
      </div>
    );
  }

  const CONFUSION_MATRIX_RF = activeModel.confusionMatrix;

  const comparisonChartData = ML_MODELS.map((m) => ({
    name: m.name.split(' ')[0],
    fullName: m.name,
    accuracy: m.accuracy,
    precision: m.precision,
    recall: m.recall,
    f1Score: m.f1Score,
    rocAuc: Math.round(m.rocAuc * 100),
    isActive: m.id === activeModelId,
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Machine Learning Evaluation</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${themeConfig.textPrimary}`}>
            Model Performance & Comparison
          </h2>
          <p className={`text-xs sm:text-sm ${themeConfig.textSecondary} mt-1`}>
            การเปรียบเทียบประสิทธิภาพแบบจำลองการเรียนรู้ของเครื่อง (Logistic Regression, Decision Tree, Random Forest)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">โมเดลที่เลือกใช้งาน:</span>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-teal-600 text-white shadow-xs">
            {activeModel.name.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Active Model Spotlight Card */}
      <div
        id="active-model-spotlight"
        className={`rounded-2xl p-6 border shadow-sm transition-all ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-bold ${themeConfig.textPrimary}`}>{activeModel.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white">
                  Active in System
                </span>
              </div>
              <p className={`text-xs ${themeConfig.textMuted}`}>{activeModel.nameThai}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-400">สลับโมเดลที่ใช้งาน:</span>
            {ML_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                id={`select-model-${m.id}`}
                onClick={() => onSetActiveModelId(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  m.id === activeModelId
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-300 bg-slate-100/70 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-inherit">
            <span className="text-xs text-slate-400 font-semibold block">Accuracy</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {activeModel.accuracy}%
            </div>
            <span className="text-[10px] text-slate-400">ความแม่นยำภาพรวม</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-inherit">
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold block">Precision</span>
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
              {activeModel.precision}%
            </div>
            <span className="text-[10px] text-slate-400">ความแม่นยำผลบวก</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-inherit">
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block">Recall (Sensitivity)</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {activeModel.recall}%
            </div>
            <span className="text-[10px] text-slate-400">ความไวในการดักจับ Stroke</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-inherit">
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold block">F1-Score</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {activeModel.f1Score}%
            </div>
            <span className="text-[10px] text-slate-400">ค่าเฉลี่ยฮาร์มอนิก P&R</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-inherit">
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold block">ROC-AUC</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {activeModel.rocAuc}
            </div>
            <span className="text-[10px] text-slate-400">พื้นที่ใต้กราฟ ROC</span>
          </div>
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-inherit text-xs">
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-300">
            <span className="font-bold block mb-1">จุดเด่นของโมเดลนี้ (Strengths):</span>
            <p>{activeModel.pros}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300">
            <span className="font-bold block mb-1">ข้อจำกัดที่ควรระวัง (Considerations):</span>
            <p>{activeModel.cons}</p>
          </div>
        </div>
      </div>

      {/* Comparison Table (Section 10) */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
        <div className="p-5 border-b border-inherit">
          <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
            ตารางเปรียบเทียบประสิทธิภาพโมเดล (Model Comparison Matrix)
          </h3>
          <p className={`text-xs ${themeConfig.textMuted} mt-0.5`}>
            ผลการทดสอบด้วย 5-Fold Stratified Cross-Validation บนชุดข้อมูลทดสอบ (Test Set 20%)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table id="model-comparison-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-inherit bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Machine Learning Model</th>
                <th className="py-3.5 px-4">Accuracy</th>
                <th className="py-3.5 px-4">Precision</th>
                <th className="py-3.5 px-4">Recall</th>
                <th className="py-3.5 px-4">F1-Score</th>
                <th className="py-3.5 px-4">ROC-AUC</th>
                <th className="py-3.5 px-4">Train Latency</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {ML_MODELS.map((model) => {
                const isActive = model.id === activeModelId;
                return (
                  <tr
                    key={model.id}
                    className={`transition-colors ${
                      isActive ? 'bg-teal-500/10 dark:bg-teal-950/20 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{model.name}</span>
                        {model.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                            Recommended
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">{model.nameThai}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm">{model.accuracy}%</td>
                    <td className="py-3.5 px-4 font-mono">{model.precision}%</td>
                    <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      {model.recall}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-purple-600 dark:text-purple-400 font-semibold">
                      {model.f1Score}%
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {model.rocAuc}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{model.trainingTime}</td>
                    <td className="py-3.5 px-4 text-center">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSetActiveModelId(model.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          เลือกใช้
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Charts & ROC Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Metrics Bar Comparison */}
        <div className={`p-6 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
                กราฟเปรียบเทียบประสิทธิภาพโมเดล
              </h3>
              <p className={`text-xs ${themeConfig.textMuted}`}>
                เปรียบเทียบค่าชี้วัดหลักระหว่างโมเดลการทดลอง
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {(['f1Score', 'accuracy', 'recall', 'precision'] as const).map((metric) => (
                <button
                  key={metric}
                  type="button"
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold border uppercase transition-all ${
                    selectedMetric === metric
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {metric.replace('Score', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeConfig.chartTheme.grid} />
                <XAxis dataKey="name" stroke={themeConfig.chartTheme.text} fontSize={11} />
                <YAxis domain={[50, 100]} stroke={themeConfig.chartTheme.text} fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, selectedMetric]}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                  }}
                />
                <Bar
                  dataKey={selectedMetric}
                  name={selectedMetric}
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-slate-400">
            * ในโจทย์ Medical Screening ที่ข้อมูล Imbalanced ค่า Recall และ F1-Score มีความสำคัญสูงกว่า Accuracy ทั่วไป
          </div>
        </div>

        {/* ROC Curve Comparison */}
        <div className={`p-6 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
                Receiver Operating Characteristic (ROC Curve)
              </h3>
              <p className={`text-xs ${themeConfig.textMuted}`}>
                ความสัมพันธ์ระหว่าง True Positive Rate vs False Positive Rate
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              AUC Comparison
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={ROC_CURVE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeConfig.chartTheme.grid} />
                <XAxis
                  dataKey="fpr"
                  label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -5, fontSize: 10 }}
                  stroke={themeConfig.chartTheme.text}
                  fontSize={10}
                />
                <YAxis
                  domain={[0, 1]}
                  label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  stroke={themeConfig.chartTheme.text}
                  fontSize={10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Line type="monotone" dataKey="rf" name="Random Forest" stroke="#0d9488" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="lr" name="Logistic Regression" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="dt" name="Decision Tree" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gb" name="Gradient Boosting" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="baseline" name="Random Guess (0.50)" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-slate-400">
            * เส้นกราฟที่โค้งชิดมุมซ้ายบนมากที่สุดแสดงถึงความสามารถในการแยกแยะคลาสที่มีประสิทธิภาพสูงสุด
          </div>
        </div>
      </div>

      {/* Confusion Matrix Interactive Block for Active Model */}
      <div className={`p-6 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
              Confusion Matrix: {activeModel.name}
            </h3>
            <p className={`text-xs ${themeConfig.textMuted}`}>
              ตารางแจกแจงผลการทำนายจริงเทียบกับผลทำนายจากโมเดล (Test Data = {CONFUSION_MATRIX_RF.totalTest.toLocaleString()} รายการ)
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Threshold: <strong className="text-teal-600 dark:text-teal-400">0.45</strong> (Balanced Criteria)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Matrix Grid */}
          <div className="max-w-md mx-auto w-full">
            <div className="grid grid-cols-2 gap-3 text-center">
              {/* True Negative */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  True Negative (TN)
                </span>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 my-1">
                  {CONFUSION_MATRIX_RF.trueNegative}
                </div>
                <p className="text-[11px] text-slate-500">คนปกติและโมเดลทำนายว่าปกติ</p>
              </div>

              {/* False Positive */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  False Positive (FP)
                </span>
                <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 my-1">
                  {CONFUSION_MATRIX_RF.falsePositive}
                </div>
                <p className="text-[11px] text-slate-500">คนปกติแต่โมเดลเตือนว่าเสี่ยง</p>
              </div>

              {/* False Negative */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                  False Negative (FN)
                </span>
                <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 my-1">
                  {CONFUSION_MATRIX_RF.falseNegative}
                </div>
                <p className="text-[11px] text-slate-500">มีภาวะแต่โมเดลพลาด (ต้องกดให้ต่ำสุด)</p>
              </div>

              {/* True Positive */}
              <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20">
                <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider block">
                  True Positive (TP)
                </span>
                <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 my-1">
                  {CONFUSION_MATRIX_RF.truePositive}
                </div>
                <p className="text-[11px] text-slate-500">มีภาวะและโมเดลตรวจพบถูกต้อง</p>
              </div>
            </div>
          </div>

          {/* Clinical Interpretation Guide */}
          <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <div className="p-3.5 rounded-xl border border-inherit bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <span>ความสำคัญของ Recall ในงาน AI การแพทย์</span>
              </span>
              <p>
                ในโรคหลอดเลือดสมอง ภาวะ False Negative (คนที่มีความเสี่ยงสูงแต่โมเดลบอกว่าปลอดภัย) มีอันตรายต่อชีวิตสูงสุด
                ดังนั้นการปรับแต่งโมเดลจึงให้ความสำคัญกับค่า Recall ที่สูง ({activeModel.recall}%) เพื่อให้ไม่พลาดผู้ป่วยที่มีความเสี่ยงจริง
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-inherit bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>การรับมือกับ Imbalanced Dataset</span>
              </span>
              <p>
                เนื่องจากอัตราการเกิดโรค Stroke ในประชากรอยู่ที่ประมาณ 4.87% หากใช้โมเดลทายว่าไม่มีโรคทั้งหมด จะได้ Accuracy สูงถึง 95.1%
                แต่ไร้ประโยชน์ในทางปฏิบัติ จึงต้องใช้ F1-Score และ ROC-AUC ในการประเมิน
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
