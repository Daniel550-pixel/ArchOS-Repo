import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../layout/GlassPanel';
import { Users, Activity, Zap, Network, Sparkles, CheckCircle2, Play } from 'lucide-react';
import { agentSwarm, SwarmAgent, SwarmProblemSolution } from '../../services/agi/agentSwarm';
import { speechService } from '../../services/voice/speechService';

export const AgentSwarm: React.FC = () => {
  const [agents, setAgents] = useState<SwarmAgent[]>(agentSwarm.getAgents());
  const [collaborationLinks, setCollaborationLinks] = useState<Array<{ from: string; to: string; strength: number }>>([
    { from: 'Perception', to: 'Reasoning', strength: 0.92 },
    { from: 'Reasoning', to: 'Learning', strength: 0.85 },
    { from: 'Planning', to: 'Execution', strength: 0.96 },
    { from: 'Execution', to: 'Verification', strength: 0.99 },
  ]);

  const [problemInput, setProblemInput] = useState('Dynamic Cross-Emirate Clean Energy Grid Balancing during unexpected 4.2GW surge');
  const [solution, setSolution] = useState<SwarmProblemSolution | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  useEffect(() => {
    const unsub = agentSwarm.subscribe((list) => setAgents(list));
    return () => unsub();
  }, []);

  const handleSolveSwarm = async () => {
    if (!problemInput.trim()) return;
    setIsSolving(true);
    try {
      const res = await agentSwarm.solveComplexProblem(problemInput, 'Strategic Infrastructure');
      setSolution(res);
      speechService.speak(`Autonomous swarm consensus achieved. Synthesized solution across ${res.subtasks.length} specialized agents in ${res.execution_time_ms} milliseconds.`);
    } finally {
      setIsSolving(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'executing' || status === 'analyzing') return 'text-[#10b981] border-[#10b981]/40 bg-[#10b981]/15';
    if (status === 'collaborating') return 'text-[#00e5ff] border-[#00e5ff]/40 bg-[#00e5ff]/15';
    if (status === 'verifying') return 'text-[#d4ff00] border-[#d4ff00]/40 bg-[#d4ff00]/15';
    return 'text-zinc-400 border-white/10 bg-white/5';
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full w-full font-mono-tech select-none">
      {/* Agent Network Nodes Column */}
      <div className="col-span-12 lg:col-span-7 flex flex-col h-full">
        <GlassPanel
          title="AUTONOMOUS AGENT SWARM (6 NODES)"
          icon={<Users size={16} />}
          badge="SELF-ORGANIZING"
          badgeColor="cyan"
          className="h-full"
        >
          <div className="space-y-3 overflow-y-auto max-h-[calc(100%-1rem)] pr-1">
            {agents.map((agent, idx) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#00e5ff]/30 transition-all flex flex-col gap-2 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 bottom-0 w-1"
                  style={{ backgroundColor: agent.avatarColor }}
                />

                <div className="flex items-center justify-between pl-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border"
                      style={{
                        backgroundColor: `${agent.avatarColor}15`,
                        borderColor: `${agent.avatarColor}40`,
                        color: agent.avatarColor
                      }}
                    >
                      <Zap size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white leading-tight">{agent.name}</h5>
                      <span className="text-[10px] text-zinc-400">{agent.role}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>

                <div className="pl-2 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-400">Current Task:</span>
                    <span className="text-[#00e5ff] font-bold truncate max-w-[240px]">{agent.current_task}</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] mt-1">
                    <span className="text-zinc-400">Workload:</span>
                    <span className="text-white font-bold">{(agent.workload * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{
                        width: `${agent.workload * 100}%`,
                        backgroundColor: agent.avatarColor
                      }}
                      animate={{ width: `${agent.workload * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  <div className="flex justify-between text-[9px] text-zinc-400 pt-1 border-t border-white/10 mt-1">
                    <span>Capabilities: <strong className="text-zinc-300">{agent.capabilities.join(', ')}</strong></span>
                    <span>Tasks: <strong className="text-[#d4ff00]">{agent.tasksCompleted}</strong></span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Collaboration Network & Swarm Problem Solver Column */}
      <div className="col-span-12 lg:col-span-5 flex flex-col h-full gap-4">
        {/* Swarm Intelligence Score & Active Links */}
        <GlassPanel
          title="SWARM COLLABORATION NETWORK"
          icon={<Network size={16} />}
          badge="96.5% EFFICIENCY"
          badgeColor="gold"
          className="flex-1"
        >
          <div className="space-y-3 overflow-y-auto max-h-[calc(100%-1rem)] pr-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-center">
                <div className="text-[10px] text-zinc-400">Collaborative Links</div>
                <div className="text-xl text-[#00e5ff] font-bold">{collaborationLinks.length}</div>
                <div className="text-[9px] text-[#10b981] mt-0.5">Zero deadlocks</div>
              </div>

              <div className="p-3 rounded-xl bg-[#d4ff00]/10 border border-[#d4ff00]/30 text-center">
                <div className="text-[10px] text-zinc-400">Emergent Synergy</div>
                <div className="text-xl text-[#d4ff00] font-bold">96.5%</div>
                <div className="text-[9px] text-[#10b981] mt-0.5">3.2x faster convergence</div>
              </div>
            </div>

            <div className="space-y-1.5">
              {collaborationLinks.map((link, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-white/5 border border-white/10 text-xs flex flex-col gap-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-300">{link.from} → {link.to}</span>
                    <span className="text-[#00e5ff] font-bold">{(link.strength * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00e5ff]" style={{ width: `${link.strength * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Swarm Deployment Trigger */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 mt-2">
              <label className="text-[10px] text-zinc-400">Pose Complex Challenge to Swarm:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={problemInput}
                  onChange={(e) => setProblemInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4ff00]"
                  placeholder="Enter challenge..."
                />
                <button
                  onClick={handleSolveSwarm}
                  disabled={isSolving}
                  className="px-3.5 py-1.5 rounded-lg bg-[#d4ff00] hover:bg-[#b8e600] text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_#d4ff00] transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Users className={`w-3 h-3 ${isSolving ? 'animate-spin' : ''}`} />
                  <span>{isSolving ? 'SOLVING...' : 'ENGAGE'}</span>
                </button>
              </div>
            </div>

            {solution && (
              <div className="p-3 rounded-xl bg-[#d4ff00]/10 border border-[#d4ff00]/30 flex flex-col gap-1.5 text-xs text-zinc-200">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#d4ff00] font-bold uppercase">Swarm Consensus ({solution.execution_time_ms}ms):</span>
                  <span className="text-[#10b981] font-bold">{solution.verification_verdict}</span>
                </div>
                <p className="text-[11px] text-white leading-snug">{solution.solution}</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};
