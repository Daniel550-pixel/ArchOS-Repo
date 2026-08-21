import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  ShieldCheck,
  Activity,
  Cpu,
  Database,
  Search,
  Eye,
  GitBranch,
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  Info,
  MapPin,
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  CanonicalWorldModelEntity,
  EpistemologicalTag,
  EntityClass,
  WorldModelGraphStats
} from '../../types/archosWorldModel';
import { worldModelGraphService } from '../../services/archos/worldModelGraphService';

interface EpistemologicalGraphInspectorProps {
  onSpeak?: (text: string) => void;
}

export const EpistemologicalGraphInspector: React.FC<EpistemologicalGraphInspectorProps> = ({
  onSpeak
}) => {
  const [entities, setEntities] = useState<CanonicalWorldModelEntity[]>([]);
  const [stats, setStats] = useState<WorldModelGraphStats>(worldModelGraphService.getStats());
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [epistemicFilter, setEpistemicFilter] = useState<EpistemologicalTag | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'14_ATTRIBUTES' | 'OBSERVATIONS' | 'RELATIONSHIPS' | 'PROVENANCE'>('14_ATTRIBUTES');

  useEffect(() => {
    const unsub = worldModelGraphService.subscribe((allEnts, st) => {
      setEntities(allEnts);
      setStats(st);
      if (!selectedEntityId && allEnts.length > 0) {
        setSelectedEntityId(allEnts[0].id);
      }
    });
    return () => unsub();
  }, [selectedEntityId]);

  const filteredEntities = worldModelGraphService.filterEntities({
    epistemologicalTag: epistemicFilter,
    searchQuery
  });

  const selectedEntity =
    entities.find((e) => e.id === selectedEntityId) || filteredEntities[0] || entities[0];

  const getEpistemicBadge = (tag: EpistemologicalTag) => {
    switch (tag) {
      case 'OBSERVED':
        return 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40';
      case 'INFERRED':
        return 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/40';
      case 'PREDICTED':
        return 'bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/40';
      case 'SIMULATED':
        return 'bg-[#d4ff00]/20 text-[#d4ff00] border-[#d4ff00]/40';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050811] text-[#f5f4f0] font-sans overflow-hidden">
      {/* Top Telemetry Header */}
      <div className="p-4 bg-[#09101c] border-b border-[#00e5ff]/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#00e5ff]" />
            <h2 className="text-base font-bold font-mono-tech tracking-wide text-white">
              WORLD MODEL 14-ATTRIBUTE CANONICAL GRAPH
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40">
              EPISTEMOLOGICAL INTEGRITY ENGINE
            </span>
          </div>
          <p className="text-xs text-[#8e8d88] font-mono-tech">
            Strict epistemic boundaries preventing synthetic hallucinations from entering ground-truth telemetry
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded bg-[#050811] border border-[#10b981]/30 text-center">
            <span className="text-[9px] text-[#8e8d88] font-mono-tech block">OBSERVED</span>
            <span className="text-xs font-bold font-mono-tech text-[#10b981]">{stats.observedEntitiesCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#050811] border border-[#00e5ff]/30 text-center">
            <span className="text-[9px] text-[#8e8d88] font-mono-tech block">INFERRED</span>
            <span className="text-xs font-bold font-mono-tech text-[#00e5ff]">{stats.inferredEntitiesCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#050811] border border-[#ec4899]/30 text-center">
            <span className="text-[9px] text-[#8e8d88] font-mono-tech block">PREDICTED</span>
            <span className="text-xs font-bold font-mono-tech text-[#ec4899]">{stats.predictedEntitiesCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#050811] border border-[#d4ff00]/30 text-center">
            <span className="text-[9px] text-[#8e8d88] font-mono-tech block">SIMULATED</span>
            <span className="text-xs font-bold font-mono-tech text-[#d4ff00]">{stats.simulatedEntitiesCount}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Entity List & 14-Attribute Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Entity Filter & Explorer */}
        <div className="w-80 border-r border-[#00e5ff]/20 bg-[#070c18] flex flex-col">
          {/* Search and Epistemic Filter */}
          <div className="p-3 border-b border-[#00e5ff]/15 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8e8d88] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search canonical URN / Makani..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#050811] border border-[#00e5ff]/20 text-xs font-mono-tech text-white focus:outline-none focus:border-[#00e5ff]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {(['ALL', 'OBSERVED', 'INFERRED', 'PREDICTED', 'SIMULATED'] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setEpistemicFilter(tag)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono-tech transition-all ${
                    epistemicFilter === tag
                      ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/50'
                      : 'bg-[#050811] text-[#8e8d88] border border-[#00e5ff]/10 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Entity List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredEntities.map((entity) => {
              const isSelected = entity.id === selectedEntity?.id;
              return (
                <button
                  key={entity.id}
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-[#00e5ff]/15 border-[#00e5ff]/60 shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                      : 'bg-[#09101c] border-[#00e5ff]/10 hover:border-[#00e5ff]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono-tech text-[#8e8d88] uppercase">
                      {entity.entityClass} · {entity.location.emirateName}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[8px] font-mono-tech font-bold border ${getEpistemicBadge(
                        entity.epistemologicalTag
                      )}`}
                    >
                      {entity.epistemologicalTag}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold font-mono-tech text-white truncate">
                    {entity.name}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] font-mono-tech text-[#8e8d88] mt-1">
                    <span>{entity.canonicalCode}</span>
                    <span className="text-[#10b981] font-bold">Vitality: {entity.currentState.vitalityScore}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: 14-Attribute Inspector */}
        {selectedEntity ? (
          <div className="flex-1 flex flex-col bg-[#050811] overflow-y-auto">
            {/* Entity Header Banner */}
            <div className="p-5 bg-[#09101c] border-b border-[#00e5ff]/20 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold border ${getEpistemicBadge(
                      selectedEntity.epistemologicalTag
                    )}`}
                  >
                    EPISTEMIC: {selectedEntity.epistemologicalTag}
                  </span>
                  <span className="text-xs font-mono-tech text-[#8e8d88]">
                    Lifecycle: <strong className="text-white">{selectedEntity.lifecycleState}</strong>
                  </span>
                  <span className="text-xs font-mono-tech text-[#8e8d88]">
                    Security: <strong className="text-[#00e5ff]">{selectedEntity.permissions.classification}</strong>
                  </span>
                </div>

                <h1 className="text-lg font-bold font-mono-tech text-white mt-1">
                  {selectedEntity.name}
                </h1>
                <p className="text-xs text-[#8e8d88] font-mono-tech">
                  {selectedEntity.arabicName} · URN: {selectedEntity.id}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onSpeak?.(
                      `Entity ${selectedEntity.name} is classified as ${selectedEntity.epistemologicalTag}. Vitality score is ${selectedEntity.currentState.vitalityScore} out of 100.`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] text-xs font-mono-tech font-bold border border-[#00e5ff]/40 transition-all flex items-center gap-1"
                >
                  <Activity className="w-3.5 h-3.5" /> VOICE AUDIT
                </button>
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="px-5 pt-3 border-b border-[#00e5ff]/15 flex gap-4 text-xs font-mono-tech">
              <button
                onClick={() => setActiveTab('14_ATTRIBUTES')}
                className={`pb-2 border-b-2 transition-all ${
                  activeTab === '14_ATTRIBUTES'
                    ? 'border-[#00e5ff] text-[#00e5ff] font-bold'
                    : 'border-transparent text-[#8e8d88] hover:text-white'
                }`}
              >
                14 CANONICAL ATTRIBUTES
              </button>
              <button
                onClick={() => setActiveTab('OBSERVATIONS')}
                className={`pb-2 border-b-2 transition-all ${
                  activeTab === 'OBSERVATIONS'
                    ? 'border-[#10b981] text-[#10b981] font-bold'
                    : 'border-transparent text-[#8e8d88] hover:text-white'
                }`}
              >
                LIVE SENSORS & OBSERVATIONS ({selectedEntity.observations.length})
              </button>
              <button
                onClick={() => setActiveTab('RELATIONSHIPS')}
                className={`pb-2 border-b-2 transition-all ${
                  activeTab === 'RELATIONSHIPS'
                    ? 'border-[#ec4899] text-[#ec4899] font-bold'
                    : 'border-transparent text-[#8e8d88] hover:text-white'
                }`}
              >
                GRAPH RELATIONSHIPS ({selectedEntity.relationships.length})
              </button>
              <button
                onClick={() => setActiveTab('PROVENANCE')}
                className={`pb-2 border-b-2 transition-all ${
                  activeTab === 'PROVENANCE'
                    ? 'border-[#d4ff00] text-[#d4ff00] font-bold'
                    : 'border-transparent text-[#8e8d88] hover:text-white'
                }`}
              >
                PROVENANCE & MERKLE HASH
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 space-y-5">
              {/* TAB 1: 14 CANONICAL ATTRIBUTES */}
              {activeTab === '14_ATTRIBUTES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Attribute 1: Identity & 2: Geometry */}
                  <div className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
                    <span className="text-[10px] font-mono-tech text-[#00e5ff] font-bold uppercase">
                      1. Identity & 2. Geometry (LOD {selectedEntity.geometry.lodLevel})
                    </span>
                    <div className="space-y-1 text-xs font-mono-tech text-[#cbd5e1]">
                      <div>Spatial Ref: <strong className="text-white">{selectedEntity.geometry.spatialReference} (UAE Grid)</strong></div>
                      <div>Type: <strong className="text-white">{selectedEntity.geometry.type}</strong></div>
                      <div>Height: <strong className="text-[#d4ff00]">{selectedEntity.geometry.heightMeters}m</strong> (Elev: {selectedEntity.geometry.elevationMslMeters}m MSL)</div>
                      <div>Bounding Radius: <strong className="text-white">{selectedEntity.geometry.boundingRadiusMeters}m</strong></div>
                    </div>
                  </div>

                  {/* Attribute 3: Location */}
                  <div className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
                    <span className="text-[10px] font-mono-tech text-[#00e5ff] font-bold uppercase">
                      3. Spatial Location & Cadastre
                    </span>
                    <div className="space-y-1 text-xs font-mono-tech text-[#cbd5e1]">
                      <div>Zone: <strong className="text-white">{selectedEntity.location.municipalityZone}</strong></div>
                      <div>Plot ID: <strong className="text-[#00e5ff]">{selectedEntity.location.plotId}</strong></div>
                      {selectedEntity.location.makaniNumber && (
                        <div>Makani Geo-Tag: <strong className="text-[#10b981]">{selectedEntity.location.makaniNumber}</strong></div>
                      )}
                      <div>Lat/Lng: <strong className="text-white">{selectedEntity.location.latitude}, {selectedEntity.location.longitude}</strong></div>
                    </div>
                  </div>

                  {/* Attribute 4: Domain Attributes */}
                  <div className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
                    <span className="text-[10px] font-mono-tech text-[#00e5ff] font-bold uppercase">
                      4. Domain Physical Attributes
                    </span>
                    <div className="space-y-1 text-xs font-mono-tech text-[#cbd5e1]">
                      {selectedEntity.attributes.grossFloorAreaSqm != null && (
                        <div>GFA: <strong className="text-white">{Number(selectedEntity.attributes.grossFloorAreaSqm ?? 0).toLocaleString()} m²</strong></div>
                      )}
                      {selectedEntity.attributes.assetValueAed && (
                        <div>Asset Value: <strong className="text-[#d4ff00]">{(selectedEntity.attributes.assetValueAed / 1000000).toFixed(0)}M AED</strong></div>
                      )}
                      {selectedEntity.attributes.pearlRatingEstidama && (
                        <div>Estidama / LEED: <strong className="text-[#10b981]">{selectedEntity.attributes.pearlRatingEstidama}</strong></div>
                      )}
                      {selectedEntity.attributes.structuralCoreMaterial && (
                        <div>Structure: <strong className="text-white">{selectedEntity.attributes.structuralCoreMaterial}</strong></div>
                      )}
                    </div>
                  </div>

                  {/* Attribute 6: Current State & 8: Predicted State */}
                  <div className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/20 space-y-2">
                    <span className="text-[10px] font-mono-tech text-[#00e5ff] font-bold uppercase">
                      6. Current State & 8. Predicted State
                    </span>
                    <div className="space-y-1 text-xs font-mono-tech text-[#cbd5e1]">
                      <div className="flex justify-between">
                        <span>Vitality Index:</span>
                        <span className="text-[#10b981] font-bold">{selectedEntity.currentState.vitalityScore} / 100 ({selectedEntity.currentState.operationalStatus})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Grid Load:</span>
                        <span className="text-white font-bold">{selectedEntity.currentState.activeLoadKw} kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>30-Day Vitality Forecast:</span>
                        <span className="text-[#00e5ff] font-bold">{selectedEntity.predictedState.projectedVitalityIn30Days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failure Probability:</span>
                        <span className="text-[#10b981] font-bold">{(selectedEntity.predictedState.projectedFailureRiskProbability * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Attribute 11: Confidence & 14: Epistemological Tag */}
                  <div className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/20 space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono-tech text-[#00e5ff] font-bold uppercase">
                        11. Bayesian Confidence & 14. Epistemological Grounding
                      </span>
                      <span className="text-xs font-mono-tech text-[#10b981] font-bold">
                        Confidence: {(selectedEntity.confidence.score * 100).toFixed(1)}% (Decay: {selectedEntity.confidence.decayFactor})
                      </span>
                    </div>
                    <p className="text-xs text-[#cbd5e1] font-mono-tech bg-[#050811] p-3 rounded-lg border border-[#00e5ff]/10">
                      <strong className="text-[#00e5ff]">Epistemological Rationale:</strong> {selectedEntity.epistemologicalRationale}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE SENSORS & OBSERVATIONS */}
              {activeTab === 'OBSERVATIONS' && (
                <div className="space-y-3">
                  {selectedEntity.observations.length === 0 ? (
                    <div className="p-6 text-center text-[#8e8d88] font-mono-tech text-xs bg-[#09101c] rounded-xl border border-[#00e5ff]/10">
                      No direct physical observation sensors bound to this hierarchical entity. Telemetry aggregated from child subsystems.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedEntity.observations.map((obs) => (
                        <div key={obs.sensorId} className="p-4 rounded-xl bg-[#09101c] border border-[#10b981]/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono-tech font-bold text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30">
                              {obs.sensorType}
                            </span>
                            <span className="text-xs font-mono-tech text-[#8e8d88]">
                              {obs.protocol} ({obs.samplingRateHz} Hz)
                            </span>
                          </div>
                          <h4 className="text-xs font-mono-tech font-bold text-white">{obs.sensorId}</h4>
                          <div className="text-lg font-mono-tech font-bold text-[#d4ff00]">
                            {obs.lastValue} <span className="text-xs text-[#8e8d88] font-normal">{obs.unit}</span>
                          </div>
                          <span className="text-[10px] text-[#8e8d88] font-mono-tech block">
                            Last Telemetry Sync: {new Date(obs.lastTimestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RELATIONSHIPS */}
              {activeTab === 'RELATIONSHIPS' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedEntity.relationships.map((rel, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#09101c] border border-[#ec4899]/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono-tech font-bold text-[#ec4899] bg-[#ec4899]/15 px-2 py-0.5 rounded border border-[#ec4899]/30">
                            {rel.relationType}
                          </span>
                          <span className="text-xs font-mono-tech text-[#8e8d88]">
                            Class: {rel.targetClass}
                          </span>
                        </div>
                        <h4 className="text-xs font-mono-tech font-bold text-white">{rel.targetName}</h4>
                        <div className="text-[11px] font-mono-tech text-[#8e8d88] truncate">
                          Target URN: {rel.targetId}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono-tech">
                          <span className="text-[#8e8d88]">Coupling Weight: <strong className="text-white">{rel.weight}</strong></span>
                          {rel.isCriticalPath && <span className="text-[#ef4444] font-bold">CRITICAL PATH</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PROVENANCE */}
              {activeTab === 'PROVENANCE' && (
                <div className="p-5 rounded-xl bg-[#09101c] border border-[#d4ff00]/30 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold font-mono-tech text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#d4ff00]" />
                      SOVEREIGN PROVENANCE & MERKLE TREE AUDIT TRAIL
                    </h3>
                    <p className="text-xs text-[#8e8d88] font-mono-tech">
                      Cryptographic attestation and tamper-evident history on the UAE Sovereign Node network
                    </p>
                  </div>

                  <div className="space-y-2 text-xs font-mono-tech text-[#cbd5e1]">
                    <div>Origin Source: <strong className="text-white">{selectedEntity.provenance.originSource}</strong></div>
                    <div>Attesting Org: <strong className="text-white">{selectedEntity.provenance.organization}</strong></div>
                    <div>Ingestion Method: <strong className="text-[#00e5ff]">{selectedEntity.provenance.method}</strong></div>
                    <div>Verified By: <strong className="text-[#10b981]">{selectedEntity.provenance.verifiedBy}</strong></div>
                    <div className="p-2.5 rounded bg-[#050811] border border-[#d4ff00]/20 break-all text-[10px]">
                      <span className="text-[#8e8d88] block">Digital Signature (SHA-256):</span>
                      <span className="text-[#d4ff00]">{selectedEntity.provenance.digitalSignatureSha256}</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#050811] border border-[#00e5ff]/20 break-all text-[10px]">
                      <span className="text-[#8e8d88] block">Temporal State Merkle Root Hash:</span>
                      <span className="text-[#00e5ff]">{selectedEntity.historicalState.temporalLogRootMerkleHash}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
