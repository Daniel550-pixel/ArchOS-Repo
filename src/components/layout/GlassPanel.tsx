import React from 'react';
import { motion } from 'motion/react';

interface GlassPanelProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: 'cyan' | 'gold' | 'green' | 'purple' | 'red';
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  title,
  icon,
  badge,
  badgeColor = 'cyan',
  actions,
  className = '',
  children
}) => {
  const badgeStyles = {
    cyan: 'bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/40',
    gold: 'bg-[#d4ff00]/15 text-[#d4ff00] border-[#d4ff00]/40',
    green: 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40',
    purple: 'bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/40',
    red: 'bg-[#f43f5e]/15 text-[#f43f5e] border-[#f43f5e]/40'
  };

  return (
    <div
      className={`relative rounded-2xl bg-[#040814]/85 border border-[#00e5ff]/20 backdrop-blur-xl flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] group hover:border-[#00e5ff]/40 transition-all duration-300 ${className}`}
    >
      {/* Subtle top edge specular highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00e5ff]/40 to-transparent pointer-events-none" />

      {/* Header bar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <div className="p-1.5 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] shrink-0 flex items-center justify-center">
              {icon}
            </div>
          )}
          <span className="text-xs font-mono-tech font-bold tracking-wider text-white uppercase truncate">
            {title}
          </span>
          {badge && (
            <span
              className={`text-[9px] font-mono-tech px-2 py-0.5 rounded-full border font-bold uppercase shrink-0 ${badgeStyles[badgeColor]}`}
            >
              {badge}
            </span>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Panel Body */}
      <div className="relative p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {children}
      </div>

      {/* Corner targeting accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00e5ff]/40 pointer-events-none" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00e5ff]/40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00e5ff]/40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00e5ff]/40 pointer-events-none" />
    </div>
  );
};
