export type ThemeMode = 'light' | 'dark' | 'healthcare-blue' | 'soft-green';

export type PageId = 'dashboard' | 'prediction' | 'dataset' | 'model-performance' | 'heart-disease' | 'about' | 'settings';

export type Gender = 'Male' | 'Female' | 'Other';
export type WorkType = 'Private' | 'Self-employed' | 'Govt_job' | 'children' | 'Never_worked';
export type ResidenceType = 'Urban' | 'Rural';
export type SmokingStatus = 'never smoked' | 'formerly smoked' | 'smokes' | 'Unknown';

export interface StrokePredictionInput {
  gender: Gender;
  age: number;
  hypertension: 0 | 1;
  heart_disease: 0 | 1;
  ever_married: 'Yes' | 'No';
  work_type: WorkType;
  Residence_type: ResidenceType;
  avg_glucose_level: number;
  bmi: number;
  smoking_status: SmokingStatus;
}

export interface FactorImportance {
  feature: string;
  featureThai: string;
  importance: number; // 0 to 100 percentage
  userValueText: string;
  isRiskDriver: boolean;
  explanation: string;
}

export interface PredictionOutput {
  stroke: 0 | 1;
  probability: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  modelStatement: string;
  modelUsed: string;
  factors: FactorImportance[];
  recommendations: string[];
  assessedAt: string;
}

export interface DatasetRecord {
  id: number;
  gender: Gender;
  age: number;
  hypertension: 0 | 1;
  heart_disease: 0 | 1;
  ever_married: 'Yes' | 'No';
  work_type: WorkType;
  Residence_type: ResidenceType;
  avg_glucose_level: number;
  bmi: number;
  smoking_status: SmokingStatus;
  stroke: 0 | 1;
}

export interface ModelMetric {
  id: string;
  name: string;
  nameThai: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  trainingTime: string;
  isDefault: boolean;
  pros: string;
  cons: string;
  confusionMatrix: {
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
    truePositive: number;
    totalTest: number;
  };
}

export interface RocPoint {
  fpr: number;
  rf: number;
  lr: number;
  dt: number;
  gb: number;
  baseline: number;
}

export interface DatasetSummary {
  totalRecords: number;
  strokeCases: number;
  nonStrokeCases: number;
  strokePercentage: number;
  featuresCount: number;
  targetName: string;
  missingBmiHandled: number;
  source: string;
}

export interface Distributions {
  strokeDistribution: Array<{ name: string; count: number; percentage: number; fill: string }>;
  ageDistribution: Array<{ group: string; total: number; strokeCount: number; strokeRate: number; nonStroke: number }>;
  bmiDistribution: Array<{ category: string; count: number; strokeCount: number; percentage: number }>;
  glucoseDistribution: Array<{ range: string; total: number; stroke: number }>;
  featureImportance: Array<{ feature: string; thai: string; importance: number; color: string; note: string }>;
}
