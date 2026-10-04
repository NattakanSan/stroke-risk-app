// ---------- Theme switching ----------
const root = document.documentElement;
function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('stroke-app-theme', theme);
  document.querySelectorAll('.theme-dot').forEach(d => {
    d.classList.toggle('active-theme', d.dataset.themeChoice === theme);
  });
}
document.querySelectorAll('.theme-dot').forEach(dot => {
  dot.addEventListener('click', () => applyTheme(dot.dataset.themeChoice));
});
applyTheme(localStorage.getItem('stroke-app-theme') || 'dark');

// ---------- Sidebar navigation ----------
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('page-' + btn.dataset.page).classList.add('active');
    if (btn.dataset.page === 'dataset') loadDatasetPage();
    if (btn.dataset.page === 'performance') loadPerformancePage();
  });
});

// ---------- Toggle button groups ----------
const formState = {
  gender: '0', hypertension: '0', heart_disease: '0', ever_married: '1',
  Residence_type: 'Urban', smoking_status: 'never smoked',
};
document.querySelectorAll('.btn-toggle').forEach(group => {
  const field = group.dataset.field;
  group.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      formState[field] = btn.dataset.value;
    });
  });
});

// ---------- Age slider ----------
const ageInput = document.getElementById('age');
const ageOut = document.getElementById('age-out');
ageInput.addEventListener('input', () => { ageOut.textContent = ageInput.value; });

// ---------- BMI calculator modal ----------
const bmiModal = document.getElementById('bmi-modal');
document.getElementById('open-bmi-modal').addEventListener('click', () => bmiModal.classList.remove('hidden'));
document.getElementById('bmi-cancel').addEventListener('click', () => bmiModal.classList.add('hidden'));

function computeBmi() {
  const w = parseFloat(document.getElementById('bmi-weight').value);
  const h = parseFloat(document.getElementById('bmi-height').value) / 100;
  if (!w || !h) return null;
  return w / (h * h);
}
['bmi-weight', 'bmi-height'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    const bmi = computeBmi();
    document.getElementById('bmi-result').textContent = bmi ? `BMI = ${bmi.toFixed(1)} kg/m²` : 'BMI = —';
  });
});
document.getElementById('bmi-apply').addEventListener('click', () => {
  const bmi = computeBmi();
  if (bmi) document.getElementById('bmi').value = bmi.toFixed(1);
  bmiModal.classList.add('hidden');
});

// ---------- Preset profiles ----------
const PRESETS = {
  low: {
    gender: '0', age: 25, hypertension: '0', heart_disease: '0',
    avg_glucose_level: 85, bmi: 21.5, smoking_status: 'never smoked',
    ever_married: '0', Residence_type: 'Urban', work_type: 'Private',
  },
  medium: {
    gender: '1', age: 52, hypertension: '0', heart_disease: '0',
    avg_glucose_level: 110, bmi: 27.0, smoking_status: 'formerly smoked',
    ever_married: '1', Residence_type: 'Urban', work_type: 'Private',
  },
  high: {
    gender: '1', age: 74, hypertension: '1', heart_disease: '1',
    avg_glucose_level: 190, bmi: 33.5, smoking_status: 'smokes',
    ever_married: '1', Residence_type: 'Urban', work_type: 'Self-employed',
  },
};
function applyPreset(name) {
  const p = PRESETS[name];
  ageInput.value = p.age; ageOut.textContent = p.age;
  document.getElementById('avg_glucose_level').value = p.avg_glucose_level;
  document.getElementById('bmi').value = p.bmi;
  document.getElementById('work_type').value = p.work_type;
  ['gender', 'hypertension', 'heart_disease', 'ever_married', 'Residence_type', 'smoking_status'].forEach(field => {
    formState[field] = String(p[field]);
    const group = document.querySelector(`.btn-toggle[data-field="${field}"]`);
    group.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset.value === String(p[field]));
    });
  });
}
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => applyPreset(chip.dataset.preset));
});

// ---------- Predict ----------
document.getElementById('predict-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    gender: formState.gender,
    age: parseFloat(ageInput.value),
    hypertension: formState.hypertension,
    heart_disease: formState.heart_disease,
    ever_married: formState.ever_married,
    work_type: document.getElementById('work_type').value,
    Residence_type: formState.Residence_type,
    avg_glucose_level: parseFloat(document.getElementById('avg_glucose_level').value),
    bmi: parseFloat(document.getElementById('bmi').value),
    smoking_status: formState.smoking_status,
  };

  const res = await fetch('/api/predict', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) { alert(data.error || 'เกิดข้อผิดพลาด'); return; }

  document.getElementById('result-empty').classList.add('hidden');
  const body = document.getElementById('result-body');
  body.classList.remove('hidden');

  const badge = document.getElementById('risk-badge');
  const labelMap = { low: 'LOW RISK', medium: 'MEDIUM RISK', high: 'HIGH RISK' };
  badge.textContent = labelMap[data.risk_level];
  badge.className = 'risk-badge ' + (data.risk_level === 'low' ? '' : data.risk_level);

  document.getElementById('prob-value').textContent = data.probability_pct + '%';
  document.getElementById('prob-bar-fill').style.width = Math.min(data.probability_pct, 100) + '%';

  const factorsEl = document.getElementById('factors-list');
  factorsEl.innerHTML = '';
  data.top_factors.forEach(f => {
    const row = document.createElement('div');
    row.className = 'factor-row';
    row.innerHTML = `
      <div class="label"><span>${f.label_th}</span><span>${f.weight_pct}%</span></div>
      <div class="factor-bar"><div class="factor-bar-fill" style="width:${f.weight_pct}%"></div></div>`;
    factorsEl.appendChild(row);
  });
});

// ---------- Dataset page ----------
let datasetPage = 1;

async function loadDatasetStats() {
  try {
    const res = await fetch('/api/dataset/stats');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const s = await res.json();

    document.getElementById('dataset-stat-cards').innerHTML = `
      <div class="stat-card"><div class="value">${s.total_records.toLocaleString()}</div><div class="label">จำนวนแถวทั้งหมด</div></div>
      <div class="stat-card"><div class="value">${s.stroke_rate_pct}%</div><div class="label">อัตราการเกิด Stroke (${s.stroke_count} ราย)</div></div>
      <div class="stat-card"><div class="value">${s.avg_age}</div><div class="label">อายุเฉลี่ย (ปี)</div></div>
      <div class="stat-card"><div class="value">${s.missing_bmi}</div><div class="label">แถวที่ BMI ขาดหาย</div></div>`;

    renderChartsSafely(s);
  } catch (err) {
    console.error('loadDatasetStats failed:', err);
    document.getElementById('dataset-stat-cards').innerHTML =
      `<p style="color:var(--danger)">โหลดสถิติไม่สำเร็จ (${err.message}) — เปิด Console (F12) เพื่อดูรายละเอียด</p>`;
  }
}

function renderChartsSafely(s) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js โหลดไม่สำเร็จ (อาจถูกบล็อกโดยเน็ตเวิร์ก/ตัวบล็อกโฆษณา หรือไม่มีอินเทอร์เน็ต) — ข้ามการวาดกราฟ');
    ['chart-age', 'chart-smoking'].forEach(id => {
      const c = document.getElementById(id);
      c.replaceWith(Object.assign(document.createElement('p'), {
        className: 'muted', textContent: 'ไม่สามารถโหลดกราฟได้ (Chart.js ไม่พร้อมใช้งาน)',
      }));
    });
    return;
  }

  new Chart(document.getElementById('chart-age'), {
    type: 'bar',
    data: {
      labels: Object.keys(s.stroke_rate_by_age_group),
      datasets: [{ label: 'อัตรา Stroke (%) ตามช่วงอายุ', data: Object.values(s.stroke_rate_by_age_group), backgroundColor: '#14b8a6' }],
    },
    options: { plugins: { legend: { display: false }, title: { display: true, text: 'Stroke rate by age group (%)' } } },
  });

  new Chart(document.getElementById('chart-smoking'), {
    type: 'bar',
    data: {
      labels: Object.keys(s.stroke_rate_by_smoking),
      datasets: [{ label: 'อัตรา Stroke (%) ตามประวัติสูบบุหรี่', data: Object.values(s.stroke_rate_by_smoking), backgroundColor: '#3b82f6' }],
    },
    options: { plugins: { legend: { display: false }, title: { display: true, text: 'Stroke rate by smoking status (%)' } } },
  });
}

async function loadDatasetTable(page) {
  try {
    const res = await fetch(`/api/dataset?page=${page}&page_size=15`);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || ('HTTP ' + res.status));
    }
    const d = await res.json();
    datasetPage = d.page;

    const table = document.getElementById('dataset-table');
    const cols = d.columns;
    let html = '<thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
    d.rows.forEach(r => {
      html += '<tr>' + cols.map(c => `<td>${r[c] === null ? '-' : r[c]}</td>`).join('') + '</tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;

    document.getElementById('page-indicator').textContent = `หน้า ${d.page} / ${d.total_pages} (ทั้งหมด ${d.total_rows.toLocaleString()} แถว)`;
    document.getElementById('prev-page').disabled = d.page <= 1;
    document.getElementById('next-page').disabled = d.page >= d.total_pages;
  } catch (err) {
    console.error('loadDatasetTable failed:', err);
    document.getElementById('dataset-table').innerHTML =
      `<tr><td style="color:var(--danger)">โหลดตารางไม่สำเร็จ (${err.message}) — เปิด Console (F12) เพื่อดูรายละเอียด</td></tr>`;
  }
}
document.getElementById('prev-page').addEventListener('click', () => loadDatasetTable(datasetPage - 1));
document.getElementById('next-page').addEventListener('click', () => loadDatasetTable(datasetPage + 1));

function loadDatasetPage() {
  loadDatasetStats();
  loadDatasetTable(1);
}

// ---------- Performance page ----------
async function loadPerformancePage() {
  try {
    const res = await fetch('/api/model/metrics');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    const m = d.metrics;

    document.getElementById('metric-cards').innerHTML = `
      <div class="stat-card"><div class="value">${(m.accuracy * 100).toFixed(1)}%</div><div class="label">Accuracy</div></div>
      <div class="stat-card"><div class="value">${(m.recall * 100).toFixed(1)}%</div><div class="label">Recall (Stroke)</div></div>
      <div class="stat-card"><div class="value">${(m.precision * 100).toFixed(1)}%</div><div class="label">Precision (Stroke)</div></div>
      <div class="stat-card"><div class="value">${m.roc_auc.toFixed(3)}</div><div class="label">ROC-AUC</div></div>`;

    const cm = m.confusion_matrix; // [[TN, FP], [FN, TP]]
    document.getElementById('cm-table').innerHTML = `
      <thead><tr><th></th><th>ทายว่าไม่เป็น</th><th>ทายว่าเป็น</th></tr></thead>
      <tbody>
        <tr><th>จริงไม่เป็น</th><td class="tn">${cm[0][0]}</td><td class="fp">${cm[0][1]}</td></tr>
        <tr><th>จริงเป็น</th><td class="fn">${cm[1][0]}</td><td class="tp">${cm[1][1]}</td></tr>
      </tbody>`;

    const list = document.getElementById('importance-list');
    const maxImp = Math.max(...d.feature_importance.map(f => f.importance));
    list.innerHTML = d.feature_importance.slice(0, 10).map(f => `
      <div class="factor-row">
        <div class="label"><span>${f.label_th}</span><span>${(f.importance * 100).toFixed(1)}%</span></div>
        <div class="factor-bar"><div class="factor-bar-fill" style="width:${(f.importance / maxImp * 100).toFixed(1)}%"></div></div>
      </div>`).join('');
  } catch (err) {
    console.error('loadPerformancePage failed:', err);
    document.getElementById('metric-cards').innerHTML =
      `<p style="color:var(--danger)">โหลดข้อมูลไม่สำเร็จ (${err.message}) — เปิด Console (F12) เพื่อดูรายละเอียด</p>`;
  }
}
