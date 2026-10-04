import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Database,
  LineChart,
  Info,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Droplets,
  Leaf,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { PageId, ThemeMode } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { theme, setTheme, themeConfig } = useTheme();

  const navItems: Array<{ id: PageId; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'prediction', label: 'Prediction', icon: <BrainCircuit className="w-5 h-5" />, badge: 'Core' },
    { id: 'dataset', label: 'Dataset & Analytics', icon: <Database className="w-5 h-5" /> },
    { id: 'model-performance', label: 'Model Performance', icon: <LineChart className="w-5 h-5" /> },
    { id: 'heart-disease', label: 'Heart Disease Risk', icon: <HeartPulse className="w-5 h-5" />, badge: 'New' },
    { id: 'about', label: 'About Project', icon: <Info className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const themesList: Array<{ id: ThemeMode; label: string; icon: React.ReactNode; previewBg: string }> = [
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" />, previewBg: 'bg-white border-slate-300' },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" />, previewBg: 'bg-slate-900 border-slate-700' },
    { id: 'healthcare-blue', label: 'Blue', icon: <Droplets className="w-3.5 h-3.5" />, previewBg: 'bg-sky-500 border-sky-600' },
    { id: 'soft-green', label: 'Green', icon: <Leaf className="w-3.5 h-3.5" />, previewBg: 'bg-emerald-500 border-emerald-600' },
  ];

  const handleNavClick = (id: PageId) => {
    onSelectPage(id);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  const isDark = theme === 'dark';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out ${
          themeConfig.sidebarBg
        } ${themeConfig.sidebarBorder} ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-inherit">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className={`font-bold text-sm tracking-tight leading-tight ${themeConfig.textPrimary}`}>
                  Stroke Risk AI
                </span>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium truncate">
                  Prediction System
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            id="toggle-sidebar-button"
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Prototype Academic Tag */}
        {!isCollapsed && (
          <div className="px-4 py-3 mx-3 mt-3 rounded-xl border border-teal-500/20 bg-teal-500/5 flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-teal-500 shrink-0" />
            <div className="leading-tight">
              <span className="font-semibold text-teal-600 dark:text-teal-400 block">
                ML Education Project
              </span>
              <span className="text-[10px] text-slate-400">ต้นแบบวิเคราะห์เพื่อการศึกษา</span>
            </div>
          </div>
        )}

        {/* Navigation Menu Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? `${themeConfig.accentBg} shadow-sm shadow-teal-500/20 font-semibold`
                    : `${themeConfig.textSecondary} ${themeConfig.accentHover} hover:text-teal-600 dark:hover:text-teal-400`
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <span className={`shrink-0 ${isActive ? 'text-inherit' : 'opacity-80'}`}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/80'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Theme Switcher Section */}
        <div className="p-3 border-t border-inherit">
          {!isCollapsed ? (
            <div className="rounded-xl p-3 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Theme Switcher
                </span>
                <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400 capitalize">
                  {theme.replace('-', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {themesList.map((t) => (
                  <button
                    key={t.id}
                    id={`theme-select-${t.id}`}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    title={t.label}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium border transition-all ${
                      theme === t.id
                        ? 'border-teal-500 bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs ring-2 ring-teal-500/20 font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full mb-1 border ${t.previewBg}`}
                    />
                    <span className="text-[10px] truncate max-w-full">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Collapsed theme quick button */
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const sequence: ThemeMode[] = ['light', 'dark', 'healthcare-blue', 'soft-green'];
                  const nextIndex = (sequence.indexOf(theme) + 1) % sequence.length;
                  setTheme(sequence[nextIndex]);
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={`สลับธีม (ปัจจุบัน: ${theme})`}
              >
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-teal-400" />
                ) : theme === 'healthcare-blue' ? (
                  <Droplets className="w-5 h-5 text-sky-500" />
                ) : theme === 'soft-green' ? (
                  <Leaf className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
