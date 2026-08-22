import React from 'react';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react';

export const Surface: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-white/10 bg-white/[0.035] ${className}`}>{children}</div>
);

export const MetricCard: React.FC<{ label: string; value: React.ReactNode; detail?: string; tone?: 'cyan' | 'lime' | 'gold' | 'danger' }> = ({ label, value, detail, tone = 'cyan' }) => {
  const tones = {
    cyan: 'text-[#00e5ff]',
    lime: 'text-[#d4ff00]',
    gold: 'text-[#ffd700]',
    danger: 'text-[#ef4444]',
  };
  return (
    <Surface className="p-3 text-center">
      <div className="text-[9px] tracking-[0.14em] text-zinc-500 font-mono-tech">{label}</div>
      <div className={`mt-1 text-2xl font-bold font-mono-tech ${tones[tone]}`}>{value}</div>
      {detail && <div className="mt-0.5 text-[8px] text-zinc-600 font-mono-tech">{detail}</div>}
    </Surface>
  );
};

export const StatusRow: React.FC<{ label: string; value: React.ReactNode; tone?: 'neutral' | 'cyan' | 'lime' | 'gold' | 'danger' }> = ({ label, value, tone = 'neutral' }) => {
  const tones = {
    neutral: 'text-zinc-200', cyan: 'text-[#00e5ff]', lime: 'text-[#d4ff00]', gold: 'text-[#ffd700]', danger: 'text-[#ef4444]',
  };
  return (
    <Surface className="flex items-center justify-between gap-4 px-3 py-2.5">
      <span className="text-[10px] text-zinc-500 font-mono-tech tracking-wide">{label}</span>
      <span className={`text-[10px] font-bold font-mono-tech text-right ${tones[tone]}`}>{value}</span>
    </Surface>
  );
};

export const RangeControl: React.FC<{ label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }> = ({ label, value, min, max, step = 1, suffix = '', onChange }) => (
  <Surface className="p-3">
    <div className="flex items-center justify-between gap-3 mb-2">
      <span className="text-[10px] text-zinc-500 font-mono-tech tracking-wide">{label}</span>
      <span className="text-xs text-[#00e5ff] font-bold font-mono-tech">{value}{suffix}</span>
    </div>
    <input
      aria-label={label}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full accent-[#00e5ff] cursor-pointer"
    />
  </Surface>
);

export const VerificationBadge: React.FC<{ status: 'PASS' | 'WARNING' | 'FAIL'; label?: string }> = ({ status, label = 'VERIFICATION' }) => {
  const config = {
    PASS: { className: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30', icon: CheckCircle2 },
    WARNING: { className: 'text-[#ffd700] bg-[#ffd700]/10 border-[#ffd700]/30', icon: Info },
    FAIL: { className: 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30', icon: CircleAlert },
  }[status];
  const Icon = config.icon;
  return (
    <div className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold font-mono-tech ${config.className}`}>
      <Icon className="w-3.5 h-3.5" /> {label}: {status}
    </div>
  );
};

export const SectionGrid: React.FC<React.PropsWithChildren<{ columns?: 1 | 2 | 3; className?: string }>> = ({ children, columns = 2, className = '' }) => (
  <div className={`grid gap-3 ${columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'} ${className}`}>
    {children}
  </div>
);
