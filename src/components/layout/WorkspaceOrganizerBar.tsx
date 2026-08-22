import React from 'react';
import { Sparkles, Globe, Brain, Zap, Box, FlaskConical, HardHat, Layers, Activity, Plane, CloudSun, Building2, Compass, ShoppingBag, Coins, Command, Radio } from 'lucide-react';
import { ActiveTab } from './HeaderBar';

export type WorkspaceCategory = 'GOVERNANCE' | 'GEOSPATIAL' | 'LIFECYCLE' | 'OPERATIONS' | 'COMMERCE';

interface WorkspaceOrganizerBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenCommandPalette: () => void;
}

type Workspace = { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string; size?: number }>; category: WorkspaceCategory };

const WORKSPACES: Workspace[] = [
  { id: 'orb', label: 'Orb Core', icon: Sparkles, category: 'GOVERNANCE' },
  { id: 'intelligence', label: 'Intelligence', icon: Brain, category: 'GOVERNANCE' },
  { id: 'rsi_agi', label: 'RSI / AGI', icon: Zap, category: 'GOVERNANCE' },
  { id: 'world', label: 'World Model', icon: Globe, category: 'GEOSPATIAL' },
  { id: 'design', label: 'Design', icon: Box, category: 'LIFECYCLE' },
  { id: 'prove', label: 'Prove', icon: FlaskConical, category: 'LIFECYCLE' },
  { id: 'build', label: 'Build', icon: HardHat, category: 'LIFECYCLE' },
  { id: 'experience', label: 'Operate', icon: Layers, category: 'LIFECYCLE' },
  { id: 'pulse', label: 'Pulse', icon: Activity, category: 'OPERATIONS' },
  { id: 'live', label: 'Live', icon: Radio, category: 'OPERATIONS' },
  { id: 'skyway', label: 'Skyways', icon: Plane, category: 'OPERATIONS' },
  { id: 'weather', label: 'Weather', icon: CloudSun, category: 'OPERATIONS' },
  { id: 'valuation', label: 'Valuation', icon: Building2, category: 'COMMERCE' },
  { id: 'connectivity', label: 'Mesh', icon: Compass, category: 'COMMERCE' },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, category: 'COMMERCE' },
  { id: 'finops', label: 'FinOps', icon: Coins, category: 'COMMERCE' },
];

const CATEGORY_LABELS: Record<WorkspaceCategory, string> = {
  GOVERNANCE: 'Governance',
  GEOSPATIAL: 'Geospatial',
  LIFECYCLE: 'Lifecycle',
  OPERATIONS: 'Operations',
  COMMERCE: 'Commerce',
};

const CATEGORY_DEFAULTS: Record<WorkspaceCategory, ActiveTab> = {
  GOVERNANCE: 'orb',
  GEOSPATIAL: 'world',
  LIFECYCLE: 'design',
  OPERATIONS: 'pulse',
  COMMERCE: 'finops',
};

export const WorkspaceOrganizerBar: React.FC<WorkspaceOrganizerBarProps> = ({ activeTab, onTabChange, onOpenCommandPalette }) => {
  const active = WORKSPACES.find((item) => item.id === activeTab) ?? WORKSPACES[0];
  const categoryItems = WORKSPACES.filter((item) => item.category === active.category);
  const ActiveIcon = active.icon;

  return (
    <div className="archos-workspace-bar" aria-label="Workspace navigation">
      <div className="archos-workspace-context">
        <ActiveIcon className="archos-workspace-active-icon" size={13} />
        <span className="archos-workspace-active">{active.label}</span>
      </div>

      <nav className="archos-workspace-categories" aria-label="Workspace categories">
        {(Object.keys(CATEGORY_LABELS) as WorkspaceCategory[]).map((category) => {
          const selected = category === active.category;
          return (
            <button
              key={category}
              type="button"
              aria-current={selected ? 'page' : undefined}
              onClick={() => onTabChange(selected ? activeTab : CATEGORY_DEFAULTS[category])}
              className={`archos-workspace-category-button ${selected ? 'is-active' : ''}`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </nav>

      <nav className="archos-workspace-items" aria-label={`${CATEGORY_LABELS[active.category]} workspaces`}>
        {categoryItems.map((item) => {
          const Icon = item.icon;
          const selected = item.id === activeTab;
          return (
            <button key={item.id} type="button" aria-current={selected ? 'page' : undefined} onClick={() => onTabChange(item.id)} className={`archos-workspace-item ${selected ? 'is-active' : ''}`}>
              <Icon size={12} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button type="button" onClick={onOpenCommandPalette} className="archos-workspace-command" title="Open command palette">
        <Command size={12} />
        <span>Command</span>
        <kbd>⌘K</kbd>
      </button>
    </div>
  );
};
