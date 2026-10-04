import React from 'react';
import {
  Menu,
  Brain,
  ShieldAlert,
  HelpCircle,
  Database,
  Sparkles,
} from 'lucide-react';
import { PageId } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  currentPage: PageId;
  onOpenMobileSidebar: () => void;
  onNavigate: (page: PageId) => void;
  activeModelName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onOpenMobileSidebar,
  onNavigate,
  activeModelName = 'Random Forest Classifier',
}) => {
  const { themeConfig, theme } = useTheme();

  const pageTitles: Record<PageId, { title: string; thaiTitle: string }> = {
    dashboard: {
      title: 'Dashboard Overview',
      thaiTitle: 'แดชบอร์ดภาพรวมระบบพยากรณ์',
    },
    prediction: {
      title: 'Stroke Risk Prediction',
      thaiTitle: 'การพยากรณ์ความเสี่ยงโรคหลอดเลือดสมอง',
    },
    dataset: {
      title: 'Dataset & Analytics',
      thaiTitle: 'สำรวจชุดข้อมูลและสถิติภาพรวม',
    },
    'model-performance': {
      title: 'Model Performance & Evaluation',
      thaiTitle: 'ประสิทธิภาพและการเปรียบเทียบโมเดล AI',
    },
    'heart-disease': {
      title: 'Heart Disease Risk Prediction',
      thaiTitle: 'การพยากรณ์ความเสี่ยงโรคหัวใจ',
    },
    about: {
      title: 'About Machine Learning Project',
      thaiTitle: 'เกี่ยวกับโครงการและเอกสารอ้างอิง',
    },
    settings: {
      title: 'System Settings & Configuration',
      thaiTitle: 'การตั้งค่าระบบและธีมการแสดงผล',
    },
  };

  const currentMeta = pageTitles[currentPage] || pageTitles.dashboard;
  const isDark = theme === 'dark';

  return (
    <header
      id="app-navbar"
      className={`sticky top-0 z-30 h-16 px-4 sm:px-6 flex items-center justify-between transition-colors ${themeConfig.headerBg}`}
    >
      {/* Left: Mobile Menu Trigger + Page Title */}
      <div className="flex items-center gap-3.5">
        <button
          id="mobile-menu-button"
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="เปิดเมนูนำทาง"
          className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className={`font-bold text-base sm:text-lg tracking-tight ${themeConfig.textPrimary}`}>
              {currentMeta.title}
            </h1>
            <span
              className={`hidden md:inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {currentMeta.thaiTitle}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Active Model Badge & Quick CTAs */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Model Indicator */}
        <div
          onClick={() => onNavigate('model-performance')}
          title="คลิกเพื่อดูประสิทธิภาพโมเดล"
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all hover:scale-[1.02] ${
            isDark
              ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-teal-500'
              : 'bg-white border-slate-200 text-slate-700 hover:border-teal-500 shadow-2xs'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-slate-400">Model:</span>
          <span className="font-semibold text-teal-600 dark:text-teal-400 max-w-[140px] truncate">
            {activeModelName.split(' ')[0]}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Prediction Quick Button */}
        {currentPage !== 'prediction' && (
          <button
            id="navbar-predict-cta"
            type="button"
            onClick={() => onNavigate('prediction')}
            className={`hidden xs:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${themeConfig.accentBg}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>พยากรณ์ความเสี่ยง</span>
          </button>
        )}

        {/* Medical disclaimer indicator button */}
        <button
          type="button"
          onClick={() => onNavigate('about')}
          className={`p-2 rounded-xl border transition-colors ${
            isDark
              ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title="โครงงานต้นแบบ AI ทางการแพทย์เพื่อการศึกษา (ไม่ใช่เครื่องมือวินิจฉัย)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
