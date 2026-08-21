import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Radio,
  X,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { TelemetryAlert, TelemetryAlertType, AlertSeverity } from '../../types';
import { telemetryAlertService } from '../../services/telemetry/telemetryAlertService';

interface TelemetryAlertToastProps {
  onNavigate?: (tab: 'orb' | 'world' | 'intelligence' | 'experience', entityId?: string) => void;
}

const TYPE_CONFIG: Record<
  TelemetryAlertType,
  {
    icon: React.ComponentType<{ className?: string }>;
    typeLabel: string;
    borderColor: string;
    glowColor: string;
    accentColor: string;
    badgeBg: string;
  }
> = {
  ECONOMIC_SPIKE: {
    icon: TrendingUp,
    typeLabel: 'ECONOMIC SPIKE',
    borderColor: 'border-[#00e5ff]/50',
    glowColor: 'rgba(0, 229, 255, 0.25)',
    accentColor: '#00e5ff',
    badgeBg: 'bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/40'
  },
  RISK_THRESHOLD: {
    icon: ShieldAlert,
    typeLabel: 'RISK THRESHOLD',
    borderColor: 'border-[#d4ff00]/50',
    glowColor: 'rgba(212, 255, 0, 0.25)',
    accentColor: '#d4ff00',
    badgeBg: 'bg-[#d4ff00]/15 text-[#d4ff00] border-[#d4ff00]/40'
  },
  INFRASTRUCTURE_MILESTONE: {
    icon: CheckCircle2,
    typeLabel: 'INFRASTRUCTURE MILESTONE',
    borderColor: 'border-[#10b981]/50',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    accentColor: '#10b981',
    badgeBg: 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
  },
  SPATIAL_ANOMALY: {
    icon: Radio,
    typeLabel: 'SPATIAL ANOMALY',
    borderColor: 'border-[#ec4899]/50',
    glowColor: 'rgba(236, 72, 153, 0.25)',
    accentColor: '#ec4899',
    badgeBg: 'bg-[#ec4899]/15 text-[#ec4899] border-[#ec4899]/40'
  }
};

const SingleToastCard: React.FC<{
  alert: TelemetryAlert;
  onDismiss: (id: string) => void;
  onNavigate?: (tab: 'orb' | 'world' | 'intelligence' | 'experience', entityId?: string) => void;
}> = ({ alert, onDismiss, onNavigate }) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = TYPE_CONFIG[alert.type] || TYPE_CONFIG.ECONOMIC_SPIKE;
  const Icon = config.icon;

  const handleAction = () => {
    if (alert.actionTarget && onNavigate) {
      onNavigate(alert.actionTarget.tab, alert.actionTarget.entityId);
    }
    onDismiss(alert.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92, y: -10 }}
      animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
      exit={{ opacity: 0, x: 80, scale: 0.88, transition: { duration: 0.22 } }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 28
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`pointer-events-auto relative w-full rounded-xl bg-[#070c16]/95 border ${config.borderColor} backdrop-blur-xl shadow-2xl overflow-hidden font-mono-tech p-3.5 select-none transition-shadow duration-300`}
      style={{
        boxShadow: isHovered
          ? `0 0 24px ${config.glowColor}, 0 12px 30px rgba(0,0,0,0.8)`
          : `0 0 12px ${config.glowColor}, 0 8px 20px rgba(0,0,0,0.6)`
      }}
    >
      {/* Top Ambient Glow Edge Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${config.accentColor}, transparent)`
        }}
      />

      {/* Header Row: Type Tag, Metric Chip & Close Button */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-5 h-5 rounded flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${config.accentColor}15`,
              borderColor: `${config.accentColor}40`,
              color: config.accentColor
            }}
          >
            <Icon className="w-3 h-3" />
          </div>
          <span
            className="text-[10px] font-bold tracking-wider uppercase truncate"
            style={{ color: config.accentColor }}
          >
            {config.typeLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Highlight Metric Badge */}
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wider ${config.badgeBg}`}>
            {alert.metric}
          </span>

          {/* Dismiss Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(alert.id);
            }}
            className="p-1 rounded text-[#8e8d88] hover:text-[#f5f4f0] hover:bg-white/10 transition-colors"
            title="Dismiss Alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Alert Title */}
      <h4 className="text-xs font-semibold text-[#f5f4f0] leading-snug mb-1">
        {alert.title}
      </h4>

      {/* Summary Narrative */}
      <p className="text-[11px] text-[#8e8d88] leading-relaxed line-clamp-2 mb-2 font-sans">
        {alert.summary}
      </p>

      {/* Footer Details: Location, Confidence, & Quick Action */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
        <span className="text-[#8e8d88] truncate max-w-[170px]">
          {alert.location}
        </span>

        {alert.actionTarget && (
          <button
            onClick={handleAction}
            className="flex items-center gap-1 text-[#00e5ff] hover:text-[#d4ff00] font-semibold transition-colors group"
          >
            <span>INSPECT</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Micro Countdown Progress Indicator at Bottom */}
      {alert.autoDismissMs && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ backgroundColor: config.accentColor }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: isHovered ? undefined : 0 }}
          transition={{
            duration: (alert.autoDismissMs || 7000) / 1000,
            ease: 'linear'
          }}
        />
      )}
    </motion.div>
  );
};

export const TelemetryAlertToast: React.FC<TelemetryAlertToastProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState<TelemetryAlert[]>([]);

  useEffect(() => {
    const unsub = telemetryAlertService.subscribe((list) => {
      setAlerts(list);
    });
    return () => unsub();
  }, []);

  const handleDismiss = (id: string) => {
    telemetryAlertService.dismissAlert(id);
  };

  return (
    <div
      id="telemetry-alerts-container"
      className="fixed top-16 right-5 z-50 flex flex-col gap-2.5 w-84 sm:w-96 max-w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <SingleToastCard
            key={alert.id}
            alert={alert}
            onDismiss={handleDismiss}
            onNavigate={onNavigate}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
