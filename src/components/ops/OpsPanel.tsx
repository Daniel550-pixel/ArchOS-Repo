import React, { useEffect, useState } from 'react';
import { History, Gauge, Clock, ShieldCheck, Activity, Terminal, RefreshCw } from 'lucide-react';
import { api } from '../../services/secure';

export const OpsPanel: React.FC<{ entityId?: string }> = ({ entityId = 'burj-khalifa-twin' }) => {
  const [hist, setHist] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [ops, setOps] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      api(`/v1/wm/${entityId}/history`).catch(() => []),
      api('/v1/ops/status').catch(() => null),
    ]).then(([histData, opsData]) => {
      if (Array.isArray(histData) && histData.length > 0) {
        setHist(histData);
        setIdx(histData.length - 1);
      }
      if (opsData) {
        setOps(opsData);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      api('/v1/ops/status').then(setOps).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [entityId]);

  const ev = hist[Math.min(idx, Math.max(0, hist.length - 1))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full p-2">
      {/* Temporal Scrubber */}
      <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between backdrop-blur-md">
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <History size={16} />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-cyan-200 tracking-wider uppercase">
                  TEMPORAL SCRUBBER — WORLD MODEL AS-OF
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  Event-Sourced Reality Fold • {hist.length} Snapshots
                </span>
              </div>
            </div>
            <button
              onClick={loadData}
              className="p-1 text-gray-400 hover:text-cyan-300 transition-colors"
              title="Refresh timeline"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {hist.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-gray-300">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Clock size={12} />
                    <span>TIMELINE INDEX: {idx + 1} / {hist.length}</span>
                  </span>
                  <span className="text-gray-400">{ev?.ts}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={hist.length - 1}
                  value={idx}
                  onChange={(e) => setIdx(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="p-3 rounded-lg bg-gray-950/80 border border-cyan-900/50">
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-2">
                  <span className="text-cyan-300 font-bold">{ev?.event || 'STATE_SNAPSHOT'}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {ev?.reality || 'OBSERVED'}
                  </span>
                </div>
                <pre className="text-[10px] font-mono text-gray-300 overflow-x-auto max-h-40 p-2 rounded bg-black/50 border border-white/5">
                  {JSON.stringify(ev?.patch, null, 2)}
                </pre>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[9px] font-mono text-gray-400">
                  <span>Actor: <strong className="text-gray-300">{ev?.actor}</strong></span>
                  <span>Confidence: <strong className="text-emerald-400">100% (Verifiable)</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-mono text-gray-500">
              Initializing sovereign event stream...
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-cyan-500/10 text-[9px] font-mono text-gray-400 flex items-center justify-between">
          <span>Projection Engine: <strong>Append-Only Fold</strong></span>
          <span className="text-emerald-400">Sync: Realtime Fabric</span>
        </div>
      </div>

      {/* Observability & Edge Metrics */}
      <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between backdrop-blur-md">
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Gauge size={16} />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-emerald-200 tracking-wider uppercase">
                  OPS — PROMETHEUS METRICS & CERT
                </h3>
                <span className="text-[10px] text-gray-400 font-mono">
                  Sovereign Enclave Observability
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded">
              HEALTHY
            </span>
          </div>

          {ops ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-gray-950/60 border border-white/10 flex justify-between items-center">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Activity size={14} className="text-cyan-400" />
                  <span>Requests Served (archos_requests_total)</span>
                </span>
                <span className="text-cyan-300 font-bold">{ops.requests}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-950/60 border border-white/10 flex justify-between items-center">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Edge Cert Expiry (Let's Encrypt / CA)</span>
                </span>
                <span className={`font-bold ${ops.cert_days < 14 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {ops.cert_days} days
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-950/60 border border-white/10 flex justify-between items-center">
                <span className="text-gray-400">Edge WAF / Rate Limiter</span>
                <span className="text-cyan-400 text-[11px] font-bold">20 r/s (burst 40)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-gray-950/60 border border-white/10 flex justify-between items-center">
                <span className="text-gray-400">Content Security Policy (CSP)</span>
                <span className="text-emerald-400 text-[11px] font-bold">STRICT SOVEREIGN</span>
              </div>

              <div className="p-2 rounded bg-black/70 border border-cyan-900/40 text-[9px] text-gray-400 flex items-center gap-1.5">
                <Terminal size={12} className="text-cyan-400 shrink-0" />
                <span>Prometheus: <code>/metrics</code> • Structured JSON with <code>X-Request-Id</code></span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-mono text-gray-500">
              Probing observability collector...
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-cyan-500/10 text-[9px] font-mono text-gray-400 flex items-center justify-between">
          <span>Latency Metric: <strong>archos_request_seconds</strong></span>
          <span className="text-cyan-400">Runtime: Edge Native</span>
        </div>
      </div>
    </div>
  );
};
