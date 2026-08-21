import React, { useEffect, useState, useRef } from 'react';
import { GlassPanel } from '../layout/GlassPanel';
import { Layers, Thermometer, DollarSign, RefreshCw, Compass, MapPin, Wind, Droplets } from 'lucide-react';
import { fetchPlanningLayers, fetchClimate, fetchUAEStats, PlanningFeature, LiveClimateData, UAEMacroStats } from '../../services/planning';

const CATEGORY_STYLES: Record<string, { label: string; stroke: string; fill: string; fillOpacity: number }> = {
  residential: { label: 'Residential', stroke: '#00e5ff', fill: '#00e5ff', fillOpacity: 0.25 },
  commercial:  { label: 'Commercial', stroke: '#ffd700', fill: '#ffd700', fillOpacity: 0.3 },
  industrial:  { label: 'Industrial', stroke: '#ff6b35', fill: '#ff6b35', fillOpacity: 0.3 },
  park:        { label: 'Parks & Greenery', stroke: '#10b981', fill: '#10b981', fillOpacity: 0.3 },
  road:        { label: 'Arterial Roads', stroke: '#94a3b8', fill: 'transparent', fillOpacity: 0 },
  rail:        { label: 'Metro & Rail', stroke: '#d4ff00', fill: 'transparent', fillOpacity: 0 },
};

// Downtown Dubai bounding box coordinates for normalisation
const MIN_LAT = 25.185;
const MAX_LAT = 25.205;
const MIN_LNG = 55.262;
const MAX_LNG = 55.285;

export const PlanningMap: React.FC = () => {
  const [feats, setFeats] = useState<PlanningFeature[]>([]);
  const [climate, setClimate] = useState<LiveClimateData | null>(null);
  const [stats, setStats] = useState<UAEMacroStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visible, setVisible] = useState<Record<string, boolean>>({
    residential: true,
    commercial: true,
    industrial: true,
    park: true,
    road: true,
    rail: true
  });
  const [hoveredFeature, setHoveredFeature] = useState<PlanningFeature | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [f, c, s] = await Promise.all([
        fetchPlanningLayers(),
        fetchClimate(),
        fetchUAEStats()
      ]);
      setFeats(f);
      setClimate(c);
      setStats(s);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Draw planning vector geometries onto high-DPI canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Background tactical dark grid
    ctx.fillStyle = '#040714';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const project = (lat: number, lng: number): [number, number] => {
      const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * width;
      // Invert Y so North is top
      const y = height - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * height;
      return [x, y];
    };

    // Draw active features
    feats.forEach((f) => {
      if (!visible[f.category]) return;
      const style = CATEGORY_STYLES[f.category] || CATEGORY_STYLES.commercial;

      ctx.beginPath();
      f.ring.forEach(([lat, lng], i) => {
        const [x, y] = project(lat, lng);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      if (f.kind === 'polygon') {
        ctx.closePath();
        ctx.fillStyle = style.fill;
        ctx.globalAlpha = style.fillOpacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = f.category === 'rail' ? 2.5 : 1.8;
        if (f.category === 'rail') {
          ctx.setLineDash([6, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw prominent landmark labels
    const landmarks = [
      { name: 'Burj Khalifa', lat: 25.1972, lng: 55.2744, color: '#d4ff00' },
      { name: 'The Dubai Mall', lat: 25.1985, lng: 55.2795, color: '#00e5ff' },
      { name: 'Dubai Opera', lat: 25.1938, lng: 55.2725, color: '#ec4899' },
      { name: 'Burj Park', lat: 25.1940, lng: 55.2750, color: '#10b981' }
    ];

    landmarks.forEach((lm) => {
      const [x, y] = project(lm.lat, lm.lng);
      ctx.fillStyle = lm.color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(lm.name, x + 8, y + 3);
      ctx.shadowBlur = 0;
    });

  }, [feats, visible]);

  return (
    <div className="grid grid-cols-12 gap-4 h-full w-full font-mono-tech select-none">
      {/* Real Planning Layer Map Canvas */}
      <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
        <GlassPanel
          title="REAL PLANNING & ZONING (OPENSTREETMAP LIVE OVERPASS)"
          icon={<Layers size={16} />}
          badge={`${feats.length} FEATURES LOADED`}
          badgeColor="cyan"
          actions={
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/40 text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'SYNCING...' : 'RELOAD OSM'}</span>
            </button>
          }
          className="h-full"
        >
          {/* Layer Filter Toggles */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(CATEGORY_STYLES).map(([cat, style]) => (
              <button
                key={cat}
                onClick={() => setVisible((v) => ({ ...v, [cat]: !v[cat] }))}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  visible[cat]
                    ? 'border-[#00e5ff]/50 text-white bg-[#00e5ff]/15 shadow-[0_0_8px_rgba(0,229,255,0.2)]'
                    : 'border-white/10 text-zinc-500 bg-white/5 hover:text-zinc-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.stroke }} />
                <span>{style.label.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Interactive Canvas Viewport */}
          <div className="relative flex-1 w-full rounded-xl overflow-hidden border border-[#00e5ff]/20 bg-[#040714] min-h-[300px]">
            <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

            {/* Bounding Box Info Overlay */}
            <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-[#040813]/90 border border-white/15 text-[9px] text-zinc-400 backdrop-blur-md">
              DOWNTOWN DUBAI BBOX · 25.185°N, 55.262°E TO 25.205°N, 55.285°E
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Live Climate & Macroeconomic Indicators */}
      <div className="col-span-12 lg:col-span-4 flex flex-col h-full gap-4">
        {/* Real Live Climate Tile (Open-Meteo) */}
        <GlassPanel
          title="LIVE DUBAI CLIMATE (OPEN-METEO API)"
          icon={<Thermometer size={16} />}
          badge="FREE / NO KEY"
          badgeColor="gold"
          className="flex-1"
        >
          {climate ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex flex-col items-center">
                  <Thermometer size={16} className="text-[#00e5ff] mb-1" />
                  <div className="text-xl text-[#00e5ff] font-bold">{climate.temperature_2m}°C</div>
                  <div className="text-[9px] text-zinc-400 uppercase">AIR TEMP</div>
                </div>

                <div className="p-3 rounded-xl bg-[#d4ff00]/10 border border-[#d4ff00]/30 flex flex-col items-center">
                  <Droplets size={16} className="text-[#d4ff00] mb-1" />
                  <div className="text-xl text-[#d4ff00] font-bold">{climate.relative_humidity_2m}%</div>
                  <div className="text-[9px] text-zinc-400 uppercase">HUMIDITY</div>
                </div>

                <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex flex-col items-center">
                  <Wind size={16} className="text-[#10b981] mb-1" />
                  <div className="text-xl text-[#10b981] font-bold">{climate.wind_speed_10m}</div>
                  <div className="text-[9px] text-zinc-400 uppercase">WIND KM/H</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 flex justify-between items-center">
                <span className="text-zinc-400">Surface Pressure:</span>
                <strong className="text-[#00e5ff]">{climate.surface_pressure || 1012.5} hPa</strong>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-xs text-zinc-500">
              Fetching Open-Meteo telemetry...
            </div>
          )}
        </GlassPanel>

        {/* Real UAE Macroeconomic Stats (World Bank API) */}
        <GlassPanel
          title="UAE MACROECONOMICS (WORLD BANK API)"
          icon={<DollarSign size={16} />}
          badge="OFFICIAL DATA"
          badgeColor="green"
          className="flex-1"
        >
          {stats ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30">
                  <div className="text-2xl text-[#10b981] font-bold">${stats.gdpB}B</div>
                  <div className="text-[10px] text-zinc-400 uppercase mt-0.5">GDP ({stats.year})</div>
                </div>

                <div className="p-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30">
                  <div className="text-2xl text-[#00e5ff] font-bold">{stats.popM}M</div>
                  <div className="text-[10px] text-zinc-400 uppercase mt-0.5">POPULATION</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs flex justify-between items-center">
                <span className="text-zinc-400">FDI Inflows:</span>
                <strong className="text-[#d4ff00]">${stats.fdiInflowsB}B USD</strong>
              </div>

              <div className="text-[9px] text-zinc-500 text-center">
                Verified World Bank API indicator `NY.GDP.MKTP.CD` & `SP.POP.TOTL`
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-xs text-zinc-500">
              Fetching World Bank macro statistics...
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
};
