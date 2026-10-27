import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Info, Layers, Flame, Sliders } from 'lucide-react';
import { fetchHotspots } from '../services/api';
import L from 'leaflet';

export default function HotspotExplorerPage() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circlesLayerRef = useRef(null);

  const [hotspotsData, setHotspotsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [minFilter, setMinFilter] = useState(0);

  // Load hotspots from backend API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchHotspots(minFilter);
        setHotspotsData(data);
        if (data.hotspots?.length > 0 && !selectedHotspot) {
          setSelectedHotspot(data.hotspots[0]);
        }
      } catch (err) {
        console.error("Failed to load hotspots:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [minFilter]);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Los Angeles centroid coordinates
    const map = L.map(mapContainerRef.current, {
      center: [34.0522, -118.2837],
      zoom: 11,
      minZoom: 9,
      maxZoom: 17
    });

    // Dark-themed or CartoDB Dark Matter / Standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const circlesLayer = L.layerGroup().addTo(map);
    circlesLayerRef.current = circlesLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update circles when hotspots data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !circlesLayerRef.current || !hotspotsData?.hotspots) return;

    circlesLayerRef.current.clearLayers();

    const maxIncidents = Math.max(...hotspotsData.hotspots.map(h => h.incident_count), 1);

    hotspotsData.hotspots.forEach((h) => {
      const intensity = h.incident_count / maxIncidents;
      
      // Color based on rank/intensity
      let color = '#38bdf8'; // Sky
      let fillColor = '#0284c7';
      if (h.hotspot_rank <= 3) {
        color = '#ef4444'; // Red for Top 3
        fillColor = '#dc2626';
      } else if (h.hotspot_rank <= 7) {
        color = '#f59e0b'; // Amber for mid
        fillColor = '#d97706';
      }

      const radiusMeters = Math.max(h.radius_km * 450, 800);

      const circle = L.circle([h.center_latitude, h.center_longitude], {
        color: color,
        fillColor: fillColor,
        fillOpacity: 0.35 + intensity * 0.3,
        weight: 2.5,
        radius: radiusMeters
      });

      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: #334155; color: #38bdf8; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
              RANK #${h.hotspot_rank}
            </span>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">
              Cluster ID: ${h.cluster_id}
            </span>
          </div>
          <h4 style="font-size: 14px; font-weight: 700; color: #ffffff; margin: 0 0 4px 0;">
            ${h.dominant_area}
          </h4>
          <p style="font-size: 11px; color: #cbd5e1; margin: 0 0 8px 0;">
            Dominant Offense: <b>${h.dominant_crime}</b>
          </p>
          <div style="background: #0f172a; padding: 6px; border-radius: 6px; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <div><span style="color: #64748b;">Incidents:</span> <b style="color: #38bdf8;">${h.incident_count.toLocaleString()}</b></div>
            <div><span style="color: #64748b;">Share:</span> <b>${h.percentage_of_total}%</b></div>
            <div style="grid-column: span 2;"><span style="color: #64748b;">Coords:</span> <b>${h.center_latitude}, ${h.center_longitude}</b></div>
          </div>
        </div>
      `;

      circle.bindPopup(popupContent);
      circle.on('click', () => {
        setSelectedHotspot(h);
      });

      circlesLayerRef.current.addLayer(circle);
    });
  }, [hotspotsData]);

  const handleFocusHotspot = (h) => {
    setSelectedHotspot(h);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([h.center_latitude, h.center_longitude], 13, {
        duration: 1.2
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            Geographical Crime Hotspots (K-Means Spatial Clustering)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            12 spatial clusters generated on latitude & longitude coordinates. Circles depict approximate cluster density.
          </p>
        </div>

        {/* Filter Slider */}
        <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800">
          <Sliders className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="text-xs">
            <div className="flex justify-between gap-2 text-slate-300">
              <span>Min Incidents:</span>
              <span className="font-mono text-sky-400 font-bold">{minFilter}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="100"
              value={minFilter}
              onChange={(e) => setMinFilter(Number(e.target.value))}
              className="w-32 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Main Map + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map View */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl relative flex flex-col h-[620px]">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between px-4 z-20">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span>Top Hotspots (Rank 1-3)</span>
              <span className="flex items-center gap-1.5 ml-3"><span className="w-3 h-3 rounded-full bg-amber-500"></span>Moderate (Rank 4-7)</span>
              <span className="flex items-center gap-1.5 ml-3"><span className="w-3 h-3 rounded-full bg-sky-500"></span>Other Hotspots</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">OpenStreetMap Tiles</span>
          </div>

          <div ref={mapContainerRef} className="w-full flex-1 z-10" />

          {/* Map Footer Note */}
          <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 px-4 flex items-center gap-2 z-20">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Click any hotspot circle or sidebar entry to center coordinates and view cluster profile.</span>
          </div>
        </div>

        {/* Hotspots Ranking Sidebar */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-5 flex flex-col justify-between h-[620px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Hotspot Ranking (#1 - #12)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {hotspotsData?.hotspots?.length || 0} active
              </span>
            </div>

            <div className="mt-3 space-y-2 overflow-y-auto max-h-[460px] pr-1">
              {hotspotsData?.hotspots?.map((h) => {
                const isSelected = selectedHotspot?.cluster_id === h.cluster_id;
                return (
                  <div
                    key={h.cluster_id}
                    onClick={() => handleFocusHotspot(h)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-950/60 border-sky-500/50 shadow-md shadow-sky-950'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.hotspot_rank <= 3
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : h.hotspot_rank <= 7
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}>
                          #{h.hotspot_rank}
                        </span>
                        <span className="font-bold text-white text-sm">{h.dominant_area}</span>
                      </div>
                      <span className="text-[11px] font-mono text-sky-400 font-semibold">
                        {h.incident_count.toLocaleString()} crimes
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>Primary: <b className="text-slate-300 font-normal">{h.dominant_crime}</b></span>
                      <span>{h.percentage_of_total}% share</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 mt-2">
            <span className="font-semibold text-slate-300 block mb-0.5">Academic Note:</span>
            Cluster rankings reflect observed historical report density only. They do not constitute a legal or moral determination.
          </div>
        </div>
      </div>
    </div>
  );
}
