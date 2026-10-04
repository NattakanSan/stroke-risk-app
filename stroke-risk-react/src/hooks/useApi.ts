import { useEffect, useState } from 'react';
import { ModelMetric, RocPoint, DatasetSummary, Distributions, DatasetRecord } from '../types';

/**
 * hooks ทั้งหมดในไฟล์นี้ทำหน้าที่แทน src/data/modelPerformance.ts และ
 * src/data/strokeDataset.ts เดิม (ซึ่งเป็นตัวเลขสมมติที่ hardcode ไว้)
 * ด้วยการดึงข้อมูลจริงจาก Flask backend (train_model.py เทรนจาก CSV จริง)
 *
 * ใช้ module-level cache ง่ายๆ กันไม่ให้ยิง fetch ซ้ำเวลาหลาย component
 * เรียก hook เดียวกันพร้อมกัน (เช่น ML_MODELS ที่ App.tsx, Dashboard, Settings,
 * ModelPerformance ต่างก็ต้องใช้)
 */
function createCachedFetchHook<T>(url: string, fallback: T) {
  let cache: T | null = null;
  let inflight: Promise<T> | null = null;

  async function fetchOnce(): Promise<T> {
    if (cache) return cache;
    if (!inflight) {
      inflight = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
          return res.json();
        })
        .then((data: T) => {
          cache = data;
          return data;
        })
        .catch((err) => {
          inflight = null; // อนุญาตให้ retry ได้ในครั้งถัดไปถ้าพัง
          throw err;
        });
    }
    return inflight;
  }

  return function useCachedFetch() {
    const [data, setData] = useState<T>(cache ?? fallback);
    const [loading, setLoading] = useState<boolean>(!cache);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let alive = true;
      fetchOnce()
        .then((d) => {
          if (alive) {
            setData(d);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (alive) {
            setError(err.message || 'โหลดข้อมูลไม่สำเร็จ');
            setLoading(false);
          }
        });
      return () => {
        alive = false;
      };
    }, []);

    return { data, loading, error };
  };
}

const useModelsRaw = createCachedFetchHook<ModelMetric[]>('/api/models', []);
const useRocCurveRaw = createCachedFetchHook<RocPoint[]>('/api/roc-curve', []);
const useDatasetSummaryRaw = createCachedFetchHook<DatasetSummary | null>('/api/dataset/summary', null);
const useDistributionsRaw = createCachedFetchHook<Distributions | null>('/api/dataset/distributions', null);
const useDatasetRecordsRaw = createCachedFetchHook<DatasetRecord[]>('/api/dataset/all', []);

export function useModels() {
  const { data, loading, error } = useModelsRaw();
  return { models: data, loading, error };
}

export function useRocCurve() {
  const { data, loading, error } = useRocCurveRaw();
  return { rocCurve: data, loading, error };
}

export function useDatasetSummary() {
  const { data, loading, error } = useDatasetSummaryRaw();
  return { summary: data, loading, error };
}

export function useDistributions() {
  const { data, loading, error } = useDistributionsRaw();
  return { distributions: data, loading, error };
}

export function useDatasetRecords() {
  const { data, loading, error } = useDatasetRecordsRaw();
  return { records: data, loading, error };
}
