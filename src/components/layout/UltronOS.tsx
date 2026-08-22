import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  AudioLines,
  Brain,
  Command,
  Eye,
  Globe2,
  Layers3,
  LockKeyhole,
  Menu,
  Mic,
  Radio,
  Search,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { ActiveTab } from './HeaderBar';
import { aiosRuntime, type AIOSRuntimeState } from '../../aios/runtime';
import { useArchOSStore } from '../../store/archosStore';
import { SystemState, HandGestureState, CommandLogEntry } from '../../types';
import { speechService } from '../../services/voice/speechService';
import { UnifiedCommandPalette } from '../UnifiedCommandPalette';
import { CameraPreview } from '../CameraPreview';
import { MqttTlsSecurityModal } from '../live/MqttTlsSecurityModal';
import { mqttTlsSecurityService } from '../../services/mqttTlsSecurity';
import { ProductionReadinessBar } from '../runtime/ProductionReadinessBar';
import { OrbCoreView } from '../views/OrbCoreView';
import { WorldModelView } from '../views/WorldModelView';
import { IntelligenceEngineView } from '../views/IntelligenceEngineView';
import { RsiAgiMatrixView } from '../views/RsiAgiMatrixView';
import { DesignStudioView } from '../views/DesignStudioView';
import { ProveSandboxView } from '../prove/ProveSandboxView';
import { ExperienceView } from '../views/ExperienceView';
import { PulseVitalityView } from '../views/PulseVitalityView';
import { SkywayDroneDispatchView } from '../views/SkywayDroneDispatchView';
import { AtmosphericWeatherRadarView } from '../views/AtmosphericWeatherRadarView';
import { RealEstateValuationView } from '../views/RealEstateValuationView';
import { EmiratesConnectivityMatrixView } from '../views/EmiratesConnectivityMatrixView';
import { MarketplaceHubView } from '../views/MarketplaceHubView';
import { FinOpsDashboardView } from '../views/FinOpsDashboardView';
import { Live } from '../../panels';
import { IntelligenceFeedItem } from '../../intelligence/briefingData';

const primary: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'orb', label: 'Core', icon: Brain },
  { id: 'world', label: 'World', icon: Globe2 },
  { id: 'intelligence', label: 'Intel', icon: Activity },
  { id: 'experience', label: 'Spatial', icon: Layers3 },
];

const secondary: Array<{ id: ActiveTab; label: string }> = [
  { id: 'rsi_agi', label: 'RSI / AGI Matrix' },
  { id: 'design', label: 'Design Studio' },
  { id: 'prove', label: 'Prove Sandbox' },
  { id: 'pulse', label: 'Pulse & Carbon' },
  { id: 'skyway', label: 'Skyway Dispatch' },
  { id: 'weather', label: 'Weather Radar' },
  { id: 'valuation', label: 'Real Estate Valuation' },
  { id: 'connectivity', label: 'Connectivity Matrix' },
  { id: 'marketplace', label: 'Marketplace Hub' },
  { id: 'finops', label: 'FinOps & Router' },
  { id: 'live', label: 'Live Operations' },
];

type Props = {
  systemState: SystemState;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
  isListening: boolean;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
  isCameraActive: boolean;
  setIsCameraActive: React.Dispatch<React.SetStateAction<boolean>>;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  commandLogs: CommandLogEntry[];
  gestureState: HandGestureState;
  setGestureState: React.Dispatch<React.SetStateAction<HandGestureState>>;
  selectedIntelligenceItem: IntelligenceFeedItem;
  setSelectedIntelligenceItem: React.Dispatch<React.SetStateAction<IntelligenceFeedItem>>;
  isSpeaking: boolean;
  setIsSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  showMqttModal: boolean;
  setShowMqttModal: React.Dispatch<React.SetStateAction<boolean>>;
};

const labelFor = (tab: ActiveTab) => primary.find((item) => item.id === tab)?.label ?? secondary.find((item) => item.id === tab)?.label ?? tab;

export const UltronOS: React.FC<Props> = (props) => {
  const {
    systemState, setSystemState, isListening, setIsListening, isCameraActive, setIsCameraActive,
    isCommandPaletteOpen, setIsCommandPaletteOpen, commandLogs, gestureState, setGestureState,
    selectedIntelligenceItem, setSelectedIntelligenceItem, isSpeaking, setIsSpeaking,
    showMqttModal, setShowMqttModal,
  } = props;
  const [activeTab, setActiveTab] = useState<ActiveTab>('orb');
  const [runtime, setRuntime] = useState<AIOSRuntimeState>(() => aiosRuntime.getState());
  const [commandOpen, setCommandOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotAnswer, setCopilotAnswer] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const { setVoiceStatus, setListeningStatus } = useArchOSStore();

  useEffect(() => aiosRuntime.subscribe(setRuntime), []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === 'Escape') {
        setCommandOpen(false);
        setMoreOpen(false);
        setCopilotOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const select = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMoreOpen(false);
    aiosRuntime.setContext(tab, runtime.activeEntityId ?? undefined, 'workspace');
    window.dispatchEvent(new CustomEvent('archos:navigate', { detail: { tab } }));
  };

  const toggleListening = () => {
    const next = !isListening;
    setIsListening(next);
    setListeningStatus(next);
    setSystemState(next ? 'LISTENING' : 'IDLE');
    if (next) speechService.speak('Voice interface active.');
  };

  const toggleCamera = () => {
    const next = !isCameraActive;
    setIsCameraActive(next);
    setGestureState((state) => ({ ...state, isCameraActive: next }));
  };

  const toggleSpeech = (text: string) => {
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
      setVoiceStatus('IDLE');
      return;
    }
    setIsSpeaking(true);
    setVoiceStatus('SPEAKING', text);
    speechService.speak(text);
  };

  const askCopilot = async () => {
    const query = copilotQuery.trim();
    if (!query || copilotLoading) return;
    setCopilotLoading(true);
    setCopilotAnswer('');
    try {
      const response = await fetch('/api/v1/jarvis/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const payload = await response.json().catch(() => ({}));
      setCopilotAnswer(response.ok ? (payload.answer || 'No answer returned.') : 'The intelligence endpoint is unavailable.');
    } catch {
      setCopilotAnswer('The intelligence endpoint is unavailable.');
    } finally {
      setCopilotLoading(false);
      setCopilotQuery('');
    }
  };

  const activeLabel = labelFor(activeTab);
  const state = runtime.systemState || systemState;
  const context = runtime.activeView ? runtime.activeView.toUpperCase() : activeLabel.toUpperCase();
  const entity = runtime.activeEntityId || 'GLOBAL';

  const renderView = useMemo(() => {
    switch (activeTab) {
      case 'orb': return <OrbCoreView systemState={systemState} onSelectCity={(cityId) => { speechService.speak(`Navigating to ${cityId}.`); select('world'); }} onSelectIntelligenceItem={(item) => { setSelectedIntelligenceItem(item); select('intelligence'); }} onOrbClick={toggleListening} gestureState={gestureState} onToggleCamera={toggleCamera} />;
      case 'world': return <WorldModelView onSelectDistrict={(districtId) => speechService.speak(`Inspecting ${districtId}.`)} onOpenExperience={() => select('experience')} />;
      case 'intelligence': return <IntelligenceEngineView selectedItem={selectedIntelligenceItem} onSelectItem={setSelectedIntelligenceItem} isSpeaking={isSpeaking} onToggleSpeech={toggleSpeech} />;
      case 'rsi_agi': return <RsiAgiMatrixView />;
      case 'design': return <DesignStudioView onNavigateToProve={() => select('prove')} onNavigateToBuild={() => select('experience')} />;
      case 'prove': return <ProveSandboxView />;
      case 'experience': return <ExperienceView onBackToWorldModel={() => select('world')} onNavigateToProve={() => select('prove')} onNavigateToBuild={() => select('experience')} />;
      case 'pulse': return <PulseVitalityView />;
      case 'skyway': return <SkywayDroneDispatchView />;
      case 'weather': return <AtmosphericWeatherRadarView />;
      case 'valuation': return <RealEstateValuationView />;
      case 'connectivity': return <EmiratesConnectivityMatrixView />;
      case 'marketplace': return <MarketplaceHubView />;
      case 'finops': return <FinOpsDashboardView />;
      case 'live': return <div className="ultron-legacy-content"><Live /></div>;
      default: return null;
    }
  }, [activeTab, systemState, gestureState, selectedIntelligenceItem, isSpeaking, runtime.activeEntityId]);

  return (
    <div className="ultron-os">
      <div className="ultron-os-ambient" aria-hidden="true" />
      <ProductionReadinessBar />

      <header className="ultron-os-header">
        <button className="ultron-os-brand" onClick={() => select('orb')} aria-label="ULTRON Core">
          <span className="ultron-os-mark"><span /></span>
          <span><strong>ULTRON</strong><small>ARCHOS INTELLIGENCE OS</small></span>
        </button>

        <nav className="ultron-os-nav" aria-label="Primary navigation">
          {primary.map(({ id, label, icon: Icon }) => (
            <button key={id} className={activeTab === id ? 'is-active' : ''} onClick={() => select(id)}>
              <Icon /><span>{label}</span>
            </button>
          ))}
          <button className={moreOpen ? 'is-active' : ''} onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen}>
            <Menu /><span>More</span>
          </button>
        </nav>

        <div className="ultron-os-state">
          <span className={`ultron-state-pulse ${state !== 'IDLE' ? 'is-live' : ''}`} />
          <span>{state}</span>
          <span className="ultron-state-context">{context}</span>
        </div>
      </header>

      <main className="ultron-os-main">
        <section className="ultron-os-canvas" aria-label={`${activeLabel} workspace`}>
          <div className="ultron-os-canvas-meta">
            <span>{activeLabel.toUpperCase()}</span>
            <span>{entity}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} className="ultron-os-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
              {renderView}
            </motion.div>
          </AnimatePresence>
        </section>

        <aside className={`ultron-os-copilot ${copilotOpen ? 'is-open' : ''}`} aria-hidden={!copilotOpen}>
          <div className="ultron-copilot-head">
            <div><span className="ultron-eyebrow">J.A.R.V.I.S.</span><strong>Intelligence</strong></div>
            <button onClick={() => setCopilotOpen(false)} aria-label="Close copilot"><X /></button>
          </div>
          <div className="ultron-copilot-body">
            <div className="ultron-copilot-state"><Brain /><span>{copilotLoading ? 'PROCESSING' : 'READY'}</span></div>
            {copilotAnswer ? <p>{copilotAnswer}</p> : <p>Ask for a grounded assessment, system state, or intelligence query.</p>}
          </div>
          <div className="ultron-copilot-input">
            <input value={copilotQuery} onChange={(event) => setCopilotQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && askCopilot()} placeholder="Ask J.A.R.V.I.S." aria-label="Ask J.A.R.V.I.S." />
            <button onClick={askCopilot} disabled={copilotLoading || !copilotQuery.trim()} aria-label="Send"><Send /></button>
          </div>
        </aside>
      </main>

      <footer className="ultron-os-footer">
        <div className="ultron-os-footer-left">
          <span><Activity /> {state}</span>
          <span><ShieldCheck /> GOVERNED</span>
          <span><LockKeyhole /> SOVEREIGN</span>
        </div>
        <div className="ultron-os-command">
          <button onClick={() => setCommandOpen(true)}><Search /><span>Ask ULTRON anything</span><kbd>⌘K</kbd></button>
        </div>
        <div className="ultron-os-footer-right">
          <button className={isListening ? 'is-active' : ''} onClick={toggleListening} title="Voice"><Mic /></button>
          <button className={isCameraActive ? 'is-active' : ''} onClick={toggleCamera} title="Vision"><Eye /></button>
          <button className={copilotOpen ? 'is-active' : ''} onClick={() => setCopilotOpen((open) => !open)} title="J.A.R.V.I.S. intelligence"><AudioLines /></button>
          <button onClick={() => setShowMqttModal(true)} title="Network security"><Radio /></button>
        </div>
      </footer>

      <AnimatePresence>
        {moreOpen && (
          <motion.div className="ultron-os-menu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <div className="ultron-os-menu-head"><span>WORKSPACES</span><button onClick={() => setMoreOpen(false)}><X /></button></div>
            <div className="ultron-os-menu-grid">
              {secondary.map(({ id, label }) => <button key={id} className={activeTab === id ? 'is-active' : ''} onClick={() => select(id)}>{label}</button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UnifiedCommandPalette commandLogs={commandLogs} isOpen={commandOpen || isCommandPaletteOpen} onClose={() => { setCommandOpen(false); setIsCommandPaletteOpen(false); }} />

      {isCameraActive && (
        <CameraPreview gestureState={gestureState} videoElementRef={videoElementRef} onStartCamera={() => setGestureState((g) => ({ ...g, isCameraActive: true }))} onStopCamera={() => { setIsCameraActive(false); setGestureState((g) => ({ ...g, isCameraActive: false })); }} onToggleDebugSkeleton={() => {}} isExperienceOpen={activeTab === 'experience'} />
      )}

      {showMqttModal && (
        <MqttTlsSecurityModal config={mqttTlsSecurityService.getConfig()} tlsInfo={mqttTlsSecurityService.getTlsInfo()} onUpdateConfig={(newConfig) => mqttTlsSecurityService.updateConfig(newConfig)} onClose={() => setShowMqttModal(false)} />
      )}
    </div>
  );
};
