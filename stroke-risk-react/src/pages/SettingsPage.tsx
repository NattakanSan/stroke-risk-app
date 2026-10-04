import React from 'react';
import {
  Settings,
  Palette,
  Brain,
  Sliders,
  Sun,
  Moon,
  Droplets,
  Leaf,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types';
import { useModels } from '../hooks/useApi';

interface SettingsPageProps {
  activeModelId: string;
  onSetActiveModelId: (id: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  activeModelId,
  onSetActiveModelId,
}) => {
  const { theme, setTheme, themeConfig } = useTheme();
  const { models: ML_MODELS } = useModels();
  const isDark = theme === 'dark';

  const themes: Array<{
    id: ThemeMode;
    name: string;
    description: string;
    icon: React.ReactNode;
    colorSwatch: string;
  }> = [
    {
      id: 'light',
      name: 'Modern Light',
      description: 'ธีมสว่าง สะอาด ทันสมัย เหมาะกับการใช้งานเวลากลางวัน',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      colorSwatch: 'bg-white border-slate-300 ring-slate-400',
    },
    {
      id: 'dark',
      name: 'Midnight Dark',
      description: 'ธีมมืด ถนอมสายตา คอนทราสต์สูงสไตล์แดชบอร์ด AI สมัยใหม่',
      icon: <Moon className="w-5 h-5 text-teal-400" />,
      colorSwatch: 'bg-slate-900 border-slate-700 ring-teal-400',
    },
    {
      id: 'healthcare-blue',
      name: 'Healthcare Blue',
      description: 'ธีมสีฟ้าคลินิกทางการแพทย์ ดูน่าเชื่อถือ เป็นระเบียบและสบายตา',
      icon: <Droplets className="w-5 h-5 text-sky-500" />,
      colorSwatch: 'bg-sky-500 border-sky-600 ring-sky-500',
    },
    {
      id: 'soft-green',
      name: 'Soft Green',
      description: 'ธีมสีเขียวธรรมชาติ สื่อถึงสุขภาพที่ดีและการดูแลป้องกัน',
      icon: <Leaf className="w-5 h-5 text-emerald-500" />,
      colorSwatch: 'bg-emerald-500 border-emerald-600 ring-emerald-500',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>Application Settings</span>
        </div>
        <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${themeConfig.textPrimary}`}>
          System Settings & Theming
        </h2>
        <p className={`text-xs sm:text-sm ${themeConfig.textSecondary} mt-1`}>
          ปรับแต่งธีมการแสดงผลทั้งระบบและเลือกอัลกอริทึม Machine Learning สำหรับการพยากรณ์
        </p>
      </div>

      {/* Theme Switcher Card (Requirement 1 & 2) */}
      <div className={`rounded-2xl p-6 sm:p-7 border shadow-sm ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
        <div className="flex items-center gap-3 pb-4 border-b border-inherit">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
              Theme Switcher (เลือกธีมการแสดงผล)
            </h3>
            <p className={`text-xs ${themeConfig.textMuted}`}>
              ธีมที่เลือกจะถูกนำไปปรับใช้กับทุกหน้าจอและจำค่าไว้ในระบบ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          {themes.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                id={`settings-theme-${t.id}`}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-teal-500/5 ring-2 ring-teal-500/20 shadow-sm'
                    : isDark
                    ? 'border-slate-800 bg-slate-850 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                }`}
              >
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-inherit shadow-2xs shrink-0">
                  {t.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-sm ${themeConfig.textPrimary}`}>{t.name}</span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {t.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Model Selector */}
      <div className={`rounded-2xl p-6 sm:p-7 border shadow-sm ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
        <div className="flex items-center gap-3 pb-4 border-b border-inherit">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
              Machine Learning Model Selection
            </h3>
            <p className={`text-xs ${themeConfig.textMuted}`}>
              เลือกโมเดลที่ต้องการให้ระบบ Prediction Page นำไปใช้คำนวณความเสี่ยง
            </p>
          </div>
        </div>

        <div className="space-y-3 mt-5">
          {ML_MODELS.map((m) => {
            const isSelected = activeModelId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => onSetActiveModelId(m.id)}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-teal-500/5 ring-2 ring-teal-500/20'
                    : isDark
                    ? 'border-slate-800 hover:bg-slate-800/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${themeConfig.textPrimary}`}>{m.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Accuracy {m.accuracy}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{m.nameThai}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs font-mono text-slate-500 hidden sm:block">
                    <span>Recall: {m.recall}%</span> | <span>ROC-AUC: {m.rocAuc}</span>
                  </div>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'กำลังใช้งาน' : 'เลือกใช้โมเดลนี้'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Academic Prototype Notice */}
      <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-xs text-slate-500 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-500" />
          <span>ระบบจำลองเพื่อโครงงานการศึกษา มหาวิทยาลัย</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">v1.0.4-academic</span>
      </div>
    </div>
  );
};
