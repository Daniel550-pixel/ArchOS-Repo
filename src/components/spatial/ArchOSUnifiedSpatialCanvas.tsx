import React, { useMemo, useState } from 'react';
import { Layers3, Network, Radio, Search, ShieldCheck, Sparkles, Target, X } from 'lucide-react';
import { UAE3DWorldModel, UAE_LANDMARKS, type ActiveLayer, type LandmarkPOI, type LightingMode } from '../world/UAE3DWorldModel';
import ArchosIntelligenceGraph from '../experience/ArchosIntelligenceGraph';

/**
 * Canonical ArchOS spatial surface.
 *
 * The 3D World Model is the primary spatial canvas. Intelligence Fabric,
 * telemetry and entity context are rendered as coordinated overlays. Model
 * providers are intentionally absent from the experience identity.
 */
export const ArchOSUnifiedSpatialCanvas: React.FC = () => {
  const [lightingMode, setLightingMode] = useState<LightingMode>('CYBER');
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('ALL');
  const [sliceSeparation, setSliceSeparation] = useState(0.85);
  const [cameraPreset, setCameraPreset] = useState<'COMMAND' | 'ORBIT' | 'NADIR' | 'STREET'>('COMMAND');
  const [selectedLandmarkId, setSelectedLandmarkId] = useState('burj-khalifa');
  const [showFabric, setShowFabric] = useState(true);
  const [query, setQuery] = useState('');

  const selectedLandmark = useMemo(
    () => UAE_LANDMARKS.find((landmark) => landmark.id === selectedLandmarkId),
    [selectedLandmarkId]
  );

  const filteredLandmarks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return UAE_LANDMARKS;
    return UAE_LANDMARKS.filter((landmark) =>
      `${landmark.name} ${landmark.emirate} ${landmark.district}`.toLowerCase().includes(normalized)
    );
  }, [query]);

  return (
    <section className="archos-unified-spatial" aria-label="ArchOS unified spatial intelligence canvas">
      <div className="archos-unified-spatial__canvas">
        <UAE3DWorldModel
          lightingMode={lightingMode}
          activeLayer={activeLayer}
          sliceSeparation={sliceSeparation}
          selectedLandmarkId={selectedLandmarkId}
          onSelectLandmark={(landmark: LandmarkPOI) => setSelectedLandmarkId(landmark.id)}
          cameraPreset={cameraPreset}
        />
      </div>

      <header className="archos-spatial-header archos-surface">
        <div className="archos-spatial-brand">
          <span className="archos-spatial-mark" aria-hidden="true" />
          <div>
            <strong>ARCHOS</strong>
            <span>SPATIAL INTELLIGENCE</span>
          </div>
        </div>
        <div className="archos-spatial-state">
          <span className="archos-live-dot" />
          WORLD MODEL · LIVE
        </div>
      </header>

      <aside className="archos-spatial-rail archos-surface">
        <div className="archos-eyebrow">WORLD / LAYERS</div>
        <div className="archos-spatial-layer-list">
          {(['ALL', 'SKYLINE', 'MOBILITY', 'SENSORS', 'SUBSURFACE'] as ActiveLayer[]).map((layer) => (
            <button
              key={layer}
              className={activeLayer === layer ? 'is-active' : ''}
              onClick={() => setActiveLayer(layer)}
              type="button"
            >
              <Layers3 size={13} />
              {layer}
            </button>
          ))}
        </div>

        <div className="archos-eyebrow archos-spatial-section-label">CAMERA</div>
        <div className="archos-camera-grid">
          {(['COMMAND', 'ORBIT', 'NADIR', 'STREET'] as const).map((preset) => (
            <button
              key={preset}
              className={cameraPreset === preset ? 'is-active' : ''}
              onClick={() => setCameraPreset(preset)}
              type="button"
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="archos-eyebrow archos-spatial-section-label">RENDER</div>
        <select value={lightingMode} onChange={(event) => setLightingMode(event.target.value as LightingMode)}>
          <option value="CYBER">CYBER</option>
          <option value="TWILIGHT">TWILIGHT</option>
          <option value="THERMAL">THERMAL</option>
          <option value="LIDAR">LIDAR</option>
        </select>

        <label className="archos-spatial-slider">
          <span><span>SPATIAL SEPARATION</span><b>{sliceSeparation.toFixed(2)}</b></span>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={sliceSeparation}
            onChange={(event) => setSliceSeparation(Number(event.target.value))}
          />
        </label>
      </aside>

      <div className="archos-spatial-search archos-surface">
        <Search size={14} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Locate entity, district or emirate"
          aria-label="Locate entity, district or emirate"
        />
        <kbd>⌘K</kbd>
        {query && (
          <div className="archos-spatial-search-results">
            {filteredLandmarks.slice(0, 5).map((landmark) => (
              <button key={landmark.id} type="button" onClick={() => { setSelectedLandmarkId(landmark.id); setQuery(''); }}>
                <span>{landmark.name}</span>
                <small>{landmark.emirate} · {landmark.district}</small>
              </button>
            ))}
            {!filteredLandmarks.length && <span className="archos-spatial-no-result">NO WORLD-MODEL MATCH</span>}
          </div>
        )}
      </div>

      <aside className="archos-spatial-inspector archos-surface">
        <div className="archos-eyebrow">ACTIVE ENTITY</div>
        <div className="archos-spatial-entity-title">{selectedLandmark?.name ?? 'World Model'}</div>
        <div className="archos-spatial-entity-meta">
          <span><Target size={11} /> {selectedLandmark?.category ?? 'REGION'}</span>
          <span><Radio size={11} /> LIVE</span>
        </div>
        {selectedLandmark && (
          <>
            <p>{selectedLandmark.description}</p>
            <div className="archos-spatial-metrics">
              <div><span>HEIGHT</span><b>{selectedLandmark.stats.heightM} M</b></div>
              <div><span>AQI</span><b>{selectedLandmark.stats.aqi}</b></div>
              <div><span>OCCUPANCY</span><b>{selectedLandmark.stats.occupancy}%</b></div>
              <div><span>ENERGY</span><b>{selectedLandmark.stats.energyRating}</b></div>
            </div>
          </>
        )}
        <div className="archos-spatial-integrity"><ShieldCheck size={12} /> GOVERNED / VERIFIED CONTEXT</div>
      </aside>

      <div className="archos-spatial-fabric-toggle">
        <button className={showFabric ? 'is-active' : ''} type="button" onClick={() => setShowFabric((value) => !value)}>
          <Network size={13} /> INTELLIGENCE FABRIC
        </button>
      </div>

      {showFabric && (
        <div className="archos-spatial-fabric archos-surface">
          <button className="archos-spatial-fabric-close" type="button" onClick={() => setShowFabric(false)} aria-label="Close intelligence fabric">
            <X size={13} />
          </button>
          <ArchosIntelligenceGraph title="LIVE INTELLIGENCE FABRIC" />
        </div>
      )}

      <footer className="archos-spatial-footer">
        <span>ARCHOS SPATIAL RUNTIME</span>
        <i />
        <span>WORLD MODEL</span>
        <i />
        <span>AGENT FABRIC</span>
        <i />
        <span>VERIFICATION</span>
        <i />
        <span>SIMULATION READY</span>
      </footer>

      <div className="archos-spatial-core-label">
        <Sparkles size={12} />
        <span>INTELLIGENCE FIELD</span>
      </div>
    </section>
  );
};

export default ArchOSUnifiedSpatialCanvas;
