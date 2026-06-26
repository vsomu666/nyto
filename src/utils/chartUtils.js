// Chart.js shared scale config
export const SCALE_CONFIG = {
  x: {
    ticks: { color: '#64748b', font: { size: 10 } },
    grid: { display: false },
    border: { display: false },
  },
  y: {
    ticks: { color: '#64748b', font: { size: 10 } },
    grid: { color: 'rgba(255,255,255,.05)' },
    border: { display: false },
  },
};

export const barColor = (value) => {
  if (value >= 40) return '#f97316';
  if (value >= 25) return 'rgba(249,115,22,.8)';
  if (value >= 10) return 'rgba(99,102,241,.8)';
  return 'rgba(99,102,241,.35)';
};

export const weekBarColor = (value) => {
  if (value >= 150) return '#f97316';
  if (value >= 100) return 'rgba(249,115,22,.75)';
  return 'rgba(99,102,241,.75)';
};

export const heatmapCellColor = (v) => {
  if (v >= 60) return '#f97316';
  if (v >= 35) return 'rgba(249,115,22,.6)';
  if (v >= 15) return 'rgba(99,102,241,.6)';
  if (v >= 5)  return 'rgba(99,102,241,.28)';
  return 'rgba(99,102,241,.1)';
};

export function generateTrendData(days = 30) {
  return Array.from({ length: days }, (_, i) =>
    Math.round(80 + Math.sin(i * 0.4) * 30 + Math.random() * 20)
  );
}

export function generateTrendLabels(days = 30) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - days + 1 + i);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  });
}
