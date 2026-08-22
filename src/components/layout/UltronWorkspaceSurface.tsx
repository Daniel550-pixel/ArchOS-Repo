import React from 'react';
import { Activity, ArrowUpRight, Brain, Globe2, Layers3, Radio, ShieldCheck } from 'lucide-react';
import type { ActiveTab } from './HeaderBar';
import type { AIOSRuntimeState } from '../../aios/runtime';

type Props = { activeTab: ActiveTab; runtime: AIOSRuntimeState };

type SurfaceProps = { eyebrow: string; title: string; description: string; children: React.ReactNode };

const Surface: React.FC<SurfaceProps> = ({ eyebrow, title, description, children }) => (
  <section className="ultron-surface" aria-label={title}>
    <div className="ultron-surface-inner">
      <header className="ultron-surface-header">
        <div>
          <div className="ultron-eyebrow"><span />{eyebrow}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="ultron-live-state"><Activity /> LIVE STATE</div>
      </header>
      <div className="ultron-surface-content">{children}</div>
    </div>
  </section>
);

const CoreSurface: React.FC<{ runtime: AIOSRuntimeState }> = ({ runtime }) => {
  const state = runtime.systemState || 'IDLE';
  const view = runtime.activeView?.toUpperCase() || 'CORE';
  const command = runtime.lastCommand?.replaceAll('_', ' ') || 'Awaiting input';
  const source = runtime.lastCommandSource?.toUpperCase() || 'SYSTEM';

  return (
    <Surface eyebrow="AIOS / CORE" title="Cognitive center" description="The operating state of ULTRON, reduced to the information that matters now.">
      <div className="ultron-core-grid">
        <div className="ultron-core-field">
          <div className="ultron-core-orbit ultron-core-orbit-a" />
          <div className="ultron-core-orbit ultron-core-orbit-b" />
          <div className="ultron-core-node" />
          <div className="ultron-core-label">AIOS</div>
          <div className="ultron-core-state">{state}</div>
          <div className="ultron-core-meta">{view} · {source}</div>
        </div>
        <div className="ultron-state-list">
          <div><span>Runtime</span><strong>{state}</strong></div>
          <div><span>Context</span><strong>{view}</strong></div>
          <div><span>Last command</span><strong>{command}</strong></div>
          <div><span>Entity focus</span><strong>{runtime.activeEntityId || 'None'}</strong></div>
        </div>
      </div>
    </Surface>
  );
};

const WorldSurface: React.FC = () => (
  <Surface eyebrow="WORLD MODEL / UAE" title="Living world" description="One spatial canvas. Detail appears when an entity is selected; the world remains the primary object.">
    <div className="ultron-world-grid">
      <div className="ultron-world-canvas">
        <div className="ultron-map-grid" />
        <div className="ultron-uae-outline" aria-hidden="true" />
        {[
          ['Dubai', 62, 34],
          ['Abu Dhabi', 43, 58],
          ['Sharjah', 67, 28],
          ['Fujairah', 79, 49],
        ].map(([city, left, top]) => (
          <button key={city as string} className="ultron-city-node" style={{ left: `${left}%`, top: `${top}%` }} aria-label={`Focus ${city}`}>
            <span />
            <b>{city}</b>
          </button>
        ))}
        <div className="ultron-canvas-caption"><Globe2 /> UAE WORLD MODEL</div>
      </div>
      <aside className="ultron-context-rail">
        <div className="ultron-rail-title">World model</div>
        <div className="ultron-rail-value">UAE / LIVE</div>
        <div className="ultron-rail-lines">
          <div><span>Spatial state</span><b>CONNECTED</b></div>
          <div><span>Temporal state</span><b>LIVE</b></div>
          <div><span>Entity focus</span><b>NONE</b></div>
        </div>
        <button className="ultron-quiet-action">Open spatial model <ArrowUpRight /></button>
      </aside>
    </div>
  </Surface>
);

const IntelSurface: React.FC = () => (
  <Surface eyebrow="INTELLIGENCE / SIGNAL" title="Signal intelligence" description="Verified intelligence first. Empty states are intentional until the system has evidence worth surfacing.">
    <div className="ultron-intel-grid">
      <div className="ultron-signal-list">
        {[
          ['Mobility', 'Awaiting verified correlation'],
          ['Economy', 'Awaiting verified intelligence'],
          ['Development', 'Awaiting verified intelligence'],
        ].map(([label, detail]) => (
          <article key={label} className="ultron-signal-row">
            <Radio />
            <div><b>{label}</b><span>{detail}</span></div>
            <em>—</em>
          </article>
        ))}
      </div>
      <aside className="ultron-integrity">
        <ShieldCheck />
        <span>Assessment integrity</span>
        <strong>—</strong>
        <p>Confidence appears only when provenance and verification are available.</p>
      </aside>
    </div>
  </Surface>
);

const ExperienceSurface: React.FC = () => (
  <Surface eyebrow="EXPERIENCE / SPATIAL" title="Spatial workspace" description="The canvas is the interface. Controls stay quiet until interaction requires them.">
    <div className="ultron-experience-field">
      <div className="ultron-experience-core"><Layers3 /></div>
      <div className="ultron-experience-copy">
        <span>3D EXPERIENCE ENGINE</span>
        <strong>Ready</strong>
        <p>Gesture · vision · spatial selection</p>
      </div>
    </div>
  </Surface>
);

export const UltronWorkspaceSurface: React.FC<Props> = ({ activeTab, runtime }) => {
  if (activeTab === 'orb') return <CoreSurface runtime={runtime} />;
  if (activeTab === 'world') return <WorldSurface />;
  if (activeTab === 'intelligence') return <IntelSurface />;
  if (activeTab === 'experience') return <ExperienceSurface />;
  return null;
};
