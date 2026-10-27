import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewPage from './pages/OverviewPage';
import CrimeAnalyticsPage from './pages/CrimeAnalyticsPage';
import HotspotExplorerPage from './pages/HotspotExplorerPage';
import RiskPredictionPage from './pages/RiskPredictionPage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';
import DataPipelinePage from './pages/DataPipelinePage';
import VivaGuidePage from './pages/VivaGuidePage';
import {
  fetchHealth,
  fetchSummary,
  fetchCrimeTrends,
  fetchCrimeCategories,
  fetchRiskDistribution
} from './services/api';

export default function App() {
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'overview';
  };
  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const setActiveTab = (tab) => {
    window.location.hash = tab;
    setActiveTabState(tab);
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveTabState(hash);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [categories, setCategories] = useState(null);
  const [riskDist, setRiskDist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hRes, sRes, tRes, cRes, rRes] = await Promise.all([
        fetchHealth().catch(() => ({ status: "offline", execution_mode: "Mode A: Local Development" })),
        fetchSummary().catch(() => null),
        fetchCrimeTrends().catch(() => null),
        fetchCrimeCategories().catch(() => null),
        fetchRiskDistribution().catch(() => null)
      ]);
      setHealth(hRes);
      setSummary(sRes);
      setTrends(tRes);
      setCategories(cRes);
      setRiskDist(rRes);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Could not load backend data. Ensure the FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar health={health} onRefresh={loadAllData} loading={loading} />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-300">
              {error}
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewPage
              summary={summary}
              trends={trends}
              categories={categories}
              riskDist={riskDist}
            />
          )}

          {activeTab === 'analytics' && <CrimeAnalyticsPage />}

          {activeTab === 'hotspots' && <HotspotExplorerPage />}

          {activeTab === 'prediction' && <RiskPredictionPage />}

          {activeTab === 'evaluation' && <ModelEvaluationPage />}

          {activeTab === 'pipeline' && <DataPipelinePage />}

          {activeTab === 'viva' && <VivaGuidePage />}
        </main>
      </div>
    </div>
  );
}
