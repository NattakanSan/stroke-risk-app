import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  Database,
  BarChart3,
  PieChart as PieIcon,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { DatasetRecord } from '../types';
import { useDatasetRecords, useDistributions, useDatasetSummary } from '../hooks/useApi';

export const DatasetPage: React.FC = () => {
  const { themeConfig, theme } = useTheme();
  const { records: SAMPLE_DATASET_RECORDS, loading: recordsLoading, error: recordsError } = useDatasetRecords();
  const { distributions } = useDistributions();
  const { summary } = useDatasetSummary();
  const [searchQuery, setSearchQuery] = useState('');
  const [strokeFilter, setStrokeFilter] = useState<'all' | '1' | '0'>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [hypertensionFilter, setHypertensionFilter] = useState<string>('all');
  const [smokingFilter, setSmokingFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof DatasetRecord>('age');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<DatasetRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'analytics'>('table');

  const isDark = theme === 'dark';

  // Filter & Sort Logic
  const filteredRecords = useMemo(() => {
    return SAMPLE_DATASET_RECORDS.filter((rec) => {
      // Search matching id, work_type, residence
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rec.id.toString().includes(q) ||
        rec.gender.toLowerCase().includes(q) ||
        rec.work_type.toLowerCase().includes(q) ||
        rec.Residence_type.toLowerCase().includes(q) ||
        rec.smoking_status.toLowerCase().includes(q);

      const matchesStroke =
        strokeFilter === 'all' || rec.stroke.toString() === strokeFilter;
      const matchesGender =
        genderFilter === 'all' || rec.gender === genderFilter;
      const matchesHypertension =
        hypertensionFilter === 'all' || rec.hypertension.toString() === hypertensionFilter;
      const matchesSmoking =
        smokingFilter === 'all' || rec.smoking_status === smokingFilter;

      return matchesSearch && matchesStroke && matchesGender && matchesHypertension && matchesSmoking;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [SAMPLE_DATASET_RECORDS, searchQuery, strokeFilter, genderFilter, hypertensionFilter, smokingFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleSort = (field: keyof DatasetRecord) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'id',
      'gender',
      'age',
      'hypertension',
      'heart_disease',
      'ever_married',
      'work_type',
      'Residence_type',
      'avg_glucose_level',
      'bmi',
      'smoking_status',
      'stroke',
    ];
    const csvRows = [headers.join(',')];
    SAMPLE_DATASET_RECORDS.forEach((r) => {
      csvRows.push(
        [
          r.id,
          r.gender,
          r.age,
          r.hypertension,
          r.heart_disease,
          r.ever_married,
          r.work_type,
          r.Residence_type,
          r.avg_glucose_level,
          r.bmi,
          `"${r.smoking_status}"`,
          r.stroke,
        ].join(',')
      );
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'stroke_dataset_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (recordsLoading || !distributions || !summary) {
    return (
      <div className={`rounded-2xl border p-8 text-center ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
        <p className={`text-sm ${themeConfig.textMuted}`}>
          {recordsError ? `โหลดข้อมูลไม่สำเร็จ: ${recordsError}` : 'กำลังโหลดข้อมูลจริง 5,110 แถวจาก backend...'}
        </p>
      </div>
    );
  }

  const DATASET_SUMMARY = summary;
  const STROKE_DISTRIBUTION_DATA = distributions.strokeDistribution;
  const AGE_DISTRIBUTION_DATA = distributions.ageDistribution;
  const BMI_DISTRIBUTION_DATA = distributions.bmiDistribution;
  const GLUCOSE_DISTRIBUTION_DATA = distributions.glucoseDistribution;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Kaggle Healthcare Stroke Dataset</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${themeConfig.textPrimary}`}>
            Dataset & Exploration
          </h2>
          <p className={`text-xs sm:text-sm ${themeConfig.textSecondary} mt-1`}>
            สำรวจชุดข้อมูลตัวอย่าง 5,110 รายการ ตรวจสอบตัวแปร และการกระจายตัวของข้อมูลทางการแพทย์
          </p>
        </div>

        {/* View mode toggle & Export */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'table'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Data Table</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dataset Analytics</span>
            </button>
          </div>

          <button
            type="button"
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Section 9 Requirement) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
          <span className="text-xs font-semibold text-slate-400 block">Total Records</span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            {DATASET_SUMMARY.totalRecords.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">จำนวนแถวข้อมูลทั้งหมด</span>
        </div>

        <div className={`p-4 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
          <span className="text-xs font-semibold text-rose-500 block">Stroke Cases</span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 mt-1">
            {DATASET_SUMMARY.strokeCases}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">สัดส่วน {DATASET_SUMMARY.strokePercentage}% ของข้อมูล</span>
        </div>

        <div className={`p-4 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
          <span className="text-xs font-semibold text-emerald-500 block">Non-Stroke Cases</span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
            {DATASET_SUMMARY.nonStrokeCases.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">สัดส่วน 95.13% ปกติ</span>
        </div>

        <div className={`p-4 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
          <span className="text-xs font-semibold text-amber-500 block">Missing Values</span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1">
            {DATASET_SUMMARY.missingBmiHandled}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">BMI ค่าว่างถูกเติมด้วย Median</span>
        </div>
      </div>

      {/* View 1: Data Table View */}
      {activeTab === 'table' ? (
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
          {/* Table Filters & Search Bar */}
          <div className="p-4 sm:p-5 border-b border-inherit bg-slate-50/50 dark:bg-slate-850/50 flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="dataset-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหา ID, เพศ, อาชีพ, ถิ่นที่อยู่..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Stroke Filter */}
              <select
                id="filter-stroke-select"
                value={strokeFilter}
                onChange={(e) => {
                  setStrokeFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl border font-medium ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
              >
                <option value="all">ผล Stroke: ทั้งหมด</option>
                <option value="1">Stroke = 1 (พบภาวะ)</option>
                <option value="0">Stroke = 0 (ปกติ)</option>
              </select>

              {/* Gender Filter */}
              <select
                id="filter-gender-select"
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl border font-medium ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
              >
                <option value="all">เพศ: ทั้งหมด</option>
                <option value="Male">ชาย (Male)</option>
                <option value="Female">หญิง (Female)</option>
              </select>

              {/* Hypertension Filter */}
              <select
                id="filter-hypertension-select"
                value={hypertensionFilter}
                onChange={(e) => {
                  setHypertensionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl border font-medium ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
              >
                <option value="all">ความดัน: ทั้งหมด</option>
                <option value="1">มีความดันสูง</option>
                <option value="0">ไม่มีความดันสูง</option>
              </select>

              {/* Smoking Filter */}
              <select
                id="filter-smoking-select"
                value={smokingFilter}
                onChange={(e) => {
                  setSmokingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-xl border font-medium ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
              >
                <option value="all">การสูบบุหรี่: ทั้งหมด</option>
                <option value="never smoked">ไม่เคยสูบ</option>
                <option value="formerly smoked">เคยสูบ</option>
                <option value="smokes">สูบประจำ</option>
              </select>
            </div>
          </div>

          {/* Table Element */}
          <div className="overflow-x-auto">
            <table id="dataset-data-table" className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-inherit bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-teal-600" onClick={() => handleSort('gender')}>
                    <div className="flex items-center gap-1">Gender <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-teal-600" onClick={() => handleSort('age')}>
                    <div className="flex items-center gap-1">Age <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-3">Hypertension</th>
                  <th className="py-3 px-3">Heart Disease</th>
                  <th className="py-3 px-3">Ever Married</th>
                  <th className="py-3 px-3">Work Type</th>
                  <th className="py-3 px-3">Residence</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-teal-600" onClick={() => handleSort('avg_glucose_level')}>
                    <div className="flex items-center gap-1">Glucose <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-teal-600" onClick={() => handleSort('bmi')}>
                    <div className="flex items-center gap-1">BMI <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-3">Smoking Status</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-teal-600" onClick={() => handleSort('stroke')}>
                    <div className="flex items-center gap-1">Stroke (Target) <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-teal-500/5 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="py-3 px-3 font-mono font-medium text-slate-400">#{record.id}</td>
                      <td className="py-3 px-3 font-medium">{record.gender}</td>
                      <td className="py-3 px-3 font-semibold">{record.age}</td>
                      <td className="py-3 px-3">
                        {record.hypertension === 1 ? (
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Yes (1)
                          </span>
                        ) : (
                          <span className="text-slate-400">No (0)</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {record.heart_disease === 1 ? (
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Yes (1)
                          </span>
                        ) : (
                          <span className="text-slate-400">No (0)</span>
                        )}
                      </td>
                      <td className="py-3 px-3">{record.ever_married}</td>
                      <td className="py-3 px-3">{record.work_type}</td>
                      <td className="py-3 px-3">{record.Residence_type}</td>
                      <td className="py-3 px-3 font-mono">
                        <span className={record.avg_glucose_level > 140 ? 'font-bold text-rose-500' : ''}>
                          {record.avg_glucose_level.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={record.bmi > 30 ? 'font-bold text-amber-600' : ''}>
                          {record.bmi.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-500 dark:text-slate-400">
                        {record.smoking_status}
                      </td>
                      <td className="py-3 px-3">
                        {record.stroke === 1 ? (
                          <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-rose-500 text-white shadow-xs">
                            Stroke = 1
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full font-medium text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Stroke = 0
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="ดูรายละเอียด Record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-inherit bg-slate-50/50 dark:bg-slate-850/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              แสดง <strong>{(currentPage - 1) * pageSize + 1}</strong> ถึง{' '}
              <strong>{Math.min(currentPage * pageSize, filteredRecords.length)}</strong> จาก{' '}
              <strong>{filteredRecords.length}</strong> รายการที่กรอง (จาก 5,110 รายการทั้งหมด)
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">แสดงหน้าละ:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-lg border font-medium ${themeConfig.inputBg} ${themeConfig.inputBorder}`}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* View 2: Dataset Analytics Charts (Section 9) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Stroke Distribution */}
          <div className={`p-6 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
            <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
              Stroke Distribution (การกระจายตัวของคลาสเป้าหมาย)
            </h3>
            <p className={`text-xs ${themeConfig.textMuted} mb-4`}>
              สัดส่วนผู้ป่วยที่เป็นโรคหลอดเลือดสมองในชุดข้อมูล
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STROKE_DISTRIBUTION_DATA}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.name} (${entry.percentage ?? ''}%)`}
                  >
                    {STROKE_DISTRIBUTION_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Age Distribution */}
          <div className={`p-6 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
            <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
              Age Distribution (การกระจายตัวตามช่วงอายุ)
            </h3>
            <p className={`text-xs ${themeConfig.textMuted} mb-4`}>
              จำแนกจำนวนประชากรและการพบ Stroke ในแต่ละช่วงวัย
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={AGE_DISTRIBUTION_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={themeConfig.chartTheme.grid} />
                  <XAxis dataKey="group" stroke={themeConfig.chartTheme.text} fontSize={11} />
                  <YAxis stroke={themeConfig.chartTheme.text} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                  <Bar dataKey="nonStroke" name="ปกติ (Non-Stroke)" fill="#10B981" stackId="a" />
                  <Bar dataKey="strokeCount" name="พบ Stroke" fill="#EF4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: BMI Distribution */}
          <div className={`p-6 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
            <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
              BMI Distribution (การกระจายตัวของค่าดัชนีมวลกาย)
            </h3>
            <p className={`text-xs ${themeConfig.textMuted} mb-4`}>
              สัดส่วนกลุ่มน้ำหนักและจำนวนผู้มีภาวะ Stroke
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BMI_DISTRIBUTION_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={themeConfig.chartTheme.grid} />
                  <XAxis dataKey="category" stroke={themeConfig.chartTheme.text} fontSize={10} angle={-15} textAnchor="end" />
                  <YAxis stroke={themeConfig.chartTheme.text} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="จำนวนประชากร (คน)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="strokeCount" name="พบภาวะ Stroke (เคส)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Glucose Distribution */}
          <div className={`p-6 rounded-2xl border ${themeConfig.cardBg} ${themeConfig.cardBorder}`}>
            <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
              Glucose Distribution (ระดับน้ำตาลเฉลี่ยในเลือด)
            </h3>
            <p className={`text-xs ${themeConfig.textMuted} mb-4`}>
              เปรียบเทียบระดับน้ำตาลเฉลี่ยกับอุบัติการณ์ของโรคหลอดเลือดสมอง
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={GLUCOSE_DISTRIBUTION_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={themeConfig.chartTheme.grid} />
                  <XAxis dataKey="range" stroke={themeConfig.chartTheme.text} fontSize={10} />
                  <YAxis stroke={themeConfig.chartTheme.text} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                  <Bar dataKey="total" name="จำนวนเคสทั้งหมด" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stroke" name="พบ Stroke" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Record Detail Modal Inspector */}
      {selectedRecord && (
        <div
          id="record-detail-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            id="record-detail-modal"
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${themeConfig.cardBg} ${themeConfig.cardBorder}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-inherit">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${themeConfig.textPrimary}`}>
                    Record #{selectedRecord.id} Details
                  </h3>
                  <p className={`text-xs ${themeConfig.textMuted}`}>ข้อมูลรายบุคคลในชุดทดสอบ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Gender (เพศ)</span>
                  <span className="font-bold text-sm">{selectedRecord.gender}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Age (อายุ)</span>
                  <span className="font-bold text-sm">{selectedRecord.age} ปี</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Hypertension</span>
                  <span className="font-bold text-sm">
                    {selectedRecord.hypertension === 1 ? 'มีภาวะความดันสูง (1)' : 'ไม่มี (0)'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Heart Disease</span>
                  <span className="font-bold text-sm">
                    {selectedRecord.heart_disease === 1 ? 'มีประวัติโรคหัวใจ (1)' : 'ไม่มี (0)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">Avg Glucose Level</span>
                  <span className="font-bold text-sm">{selectedRecord.avg_glucose_level.toFixed(2)} mg/dL</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-1">BMI</span>
                  <span className="font-bold text-sm">{selectedRecord.bmi.toFixed(1)} kg/m²</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5 text-[10px]">Work Type</span>
                  <span className="font-semibold text-xs">{selectedRecord.work_type}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5 text-[10px]">Residence</span>
                  <span className="font-semibold text-xs">{selectedRecord.Residence_type}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5 text-[10px]">Ever Married</span>
                  <span className="font-semibold text-xs">{selectedRecord.ever_married}</span>
                </div>
              </div>

              {/* Target Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  selectedRecord.stroke === 1
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    Target Label (Ground Truth)
                  </span>
                  <span className="font-bold text-sm">
                    {selectedRecord.stroke === 1
                      ? 'stroke = 1 (พบภาวะโรคหลอดเลือดสมอง)'
                      : 'stroke = 0 (ไม่พบภาวะ)'}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedRecord.stroke === 1 ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {selectedRecord.stroke === 1 ? 'POSITIVE' : 'NEGATIVE'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                  isDark
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
