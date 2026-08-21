import React from 'react';
import { motion } from 'framer-motion';

export const GlassPanel: React.FC<{
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  badge?: string;
  badgeColor?: 'green' | 'gold' | 'cyan' | 'red';
}> = ({ title, icon, children, className = '', badge, badgeColor = 'cyan' }) => {
  const badgeClasses = {
    cyan: 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/40',
    green: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
    gold: 'bg-[#ffd700]/20 text-[#ffd700] border-[#ffd700]/40',
    red: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  }[badgeColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel rounded-xl p-4 text-white ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between gap-2 mb-3 border-b border-cyan/20 pb-2 text-cyan">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-bold text-xs tracking-wider uppercase font-mono-tech">{title}</h3>
          </div>
          {badge && (
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${badgeClasses}`}>
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
};
