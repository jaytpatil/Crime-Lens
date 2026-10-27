/**
 * API Service for connecting to the Crime Analytics Backend.
 */

const API_BASE = "http://localhost:8000/api";

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/summary`);
  if (!res.ok) throw new Error("Failed to load summary KPIs");
  return res.json();
}

export async function fetchCrimeTrends(filters = {}) {
  const params = new URLSearchParams();
  if (filters.area && filters.area !== "all") params.append("area", filters.area);
  if (filters.category && filters.category !== "all") params.append("category", filters.category);
  if (filters.startDate) params.append("start_date", filters.startDate);
  if (filters.endDate) params.append("end_date", filters.endDate);

  const res = await fetch(`${API_BASE}/crime-trends?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load crime trends");
  return res.json();
}

export async function fetchCrimeCategories() {
  const res = await fetch(`${API_BASE}/crime-categories`);
  if (!res.ok) throw new Error("Failed to load crime categories");
  return res.json();
}

export async function fetchTimeAnalysis() {
  const res = await fetch(`${API_BASE}/time-analysis`);
  if (!res.ok) throw new Error("Failed to load temporal analysis");
  return res.json();
}

export async function fetchAreaAnalysis() {
  const res = await fetch(`${API_BASE}/area-analysis`);
  if (!res.ok) throw new Error("Failed to load area analysis");
  return res.json();
}

export async function fetchHotspots(minIncidents = 0) {
  const res = await fetch(`${API_BASE}/hotspots?min_incidents=${minIncidents}`);
  if (!res.ok) throw new Error("Failed to load hotspots");
  return res.json();
}

export async function fetchRiskDistribution() {
  const res = await fetch(`${API_BASE}/risk-distribution`);
  if (!res.ok) throw new Error("Failed to load risk distribution");
  return res.json();
}

export async function fetchModelMetrics() {
  const res = await fetch(`${API_BASE}/model-metrics`);
  if (!res.ok) throw new Error("Failed to load model metrics");
  return res.json();
}

export async function predictRisk(payload) {
  const res = await fetch(`${API_BASE}/predict-risk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Prediction request failed");
  }
  return res.json();
}

export async function fetchPipelineStatus() {
  const res = await fetch(`${API_BASE}/pipeline/status`);
  if (!res.ok) throw new Error("Failed to load pipeline status");
  return res.json();
}

export async function fetchDatasetInfo() {
  const res = await fetch(`${API_BASE}/pipeline/dataset-info`);
  if (!res.ok) throw new Error("Failed to load dataset quality info");
  return res.json();
}

export async function triggerPipeline(nClusters = 12) {
  const res = await fetch(`${API_BASE}/pipeline/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ n_clusters: nClusters })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to trigger pipeline");
  }
  return res.json();
}
