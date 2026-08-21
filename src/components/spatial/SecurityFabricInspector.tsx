import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileText,
  Hash,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ExternalLink,
  X
} from 'lucide-react';
import { securityFabric, KNOWN_IDENTITIES } from '../../services/security/securityFabric';
import {
  DataClassification,
  ImmutableAuditRecord,
  PendingApprovalGate,
  SecurityIdentity,
  ToolSecurityRequest
} from '../../services/security/types';
import { speechService } from '../../services/voice/speechService';

interface SecurityFabricInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityFabricInspector: React.FC<SecurityFabricInspectorProps> = ({
  isOpen,
  onClose
}) => {
  const [activeIdentity, setActiveIdentity] = useState<SecurityIdentity>(() => securityFabric.getActiveIdentity());
  const [auditChain, setAuditChain] = useState<ImmutableAuditRecord[]>(() => securityFabric.getAuditChain());
  const [pendingGates, setPendingGates] = useState<PendingApprovalGate[]>(() => securityFabric.getPendingGates());
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'POLICY_TESTER' | 'AUDIT_CHAIN' | 'GATES'>('IDENTITY');

  // Policy simulation tester state
  const [simTool, setSimTool] = useState<string>('execute_experience_transformation');
  const [simClassification, setSimClassification] = useState<DataClassification>('CONFIDENTIAL');
  const [simDomain, setSimDomain] = useState<string>('archos.bim.dubai');
  const [simAction, setSimAction] = useState<'READ' | 'WRITE' | 'EXECUTE' | 'ADMIN' | 'DESTRUCTIVE'>('EXECUTE');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    const unsub = securityFabric.subscribe(() => {
      setActiveIdentity(securityFabric.getActiveIdentity());
      setAuditChain(securityFabric.getAuditChain());
      setPendingGates(securityFabric.getPendingGates());
    });
    return () => unsub();
  }, []);

  const handleSwitchIdentity = (id: string) => {
    securityFabric.setActiveIdentity(id);
    speechService.speak(`Switched active security identity to ${id}`);
  };

  const handleRunPolicyTest = () => {
    const req: ToolSecurityRequest = {
      toolName: simTool,
      callerIdentity: activeIdentity.id,
      targetResource: `resource.${simDomain}.${simTool}`,
      resourceClassification: simClassification,
      domainScope: simDomain,
      actionType: simAction,
      reason: 'Manual policy verification drill from ULTRON Security Inspector'
    };

    const res = securityFabric.evaluateAndAuthorize(req);
    setTestResult(res);

    if (res.status === 'ALLOWED') {
      speechService.speak('Policy check passed. Autonomous execution granted under Zero-Trust constraints.');
    } else if (res.status === 'GATE_REQUIRED') {
      speechService.speak('High-risk action detected. Submitted to human approval gate.');
    } else {
      speechService.speak('Access denied by Zero-Trust policy engine. Insufficient clearance or invalid scope.');
    }
  };

  const handleApproveGate = (gateId: string) => {
    securityFabric.approvePendingGate(gateId, activeIdentity.id);
    speechService.speak('Human approval confirmed. Action authorized.');
  };

  const handleRejectGate = (gateId: string) => {
    securityFabric.rejectPendingGate(gateId, activeIdentity.id);
    speechService.speak('Human approval vetoed. Action aborted.');
  };

  if (!isOpen) return null;

  const pendingCount = pendingGates.filter((g) => g.status === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl font-mono-tech select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-[#070c16] border-2 border-[#00e5ff]/50 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-xs max-h-[90vh] overflow-hidden text-[#f5f4f0]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#00e5ff]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00e5ff]/20 border border-[#00e5ff] text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-wider text-white">
                  ZERO-TRUST SECURITY FABRIC
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40">
                  AUTHORITY SEPARATION
                </span>
              </div>
              <span className="text-[10px] text-[#8e8d88]">
                RBAC/ABAC Policy Enforcement · Scope Isolation · Risk Gating · Immutable Cryptographic Audit Chain
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-[#8e8d88] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-[11px]">
          {[
            { id: 'IDENTITY', label: 'ACTIVE IDENTITY & ROLES' },
            { id: 'POLICY_TESTER', label: 'POLICY GATE SIMULATOR' },
            { id: 'AUDIT_CHAIN', label: `IMMUTABLE AUDIT LOG (${auditChain.length})` },
            { id: 'GATES', label: `APPROVAL GATES ${pendingCount > 0 ? `(${pendingCount} PENDING)` : ''}` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]'
                  : 'bg-[#09101c] text-[#8e8d88] hover:text-white hover:border-[#00e5ff]/40 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Identity & Roles */}
        {activeTab === 'IDENTITY' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Active Identity Summary Card */}
            <div className="p-4 rounded-xl bg-[#09101c] border border-[#00e5ff]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#8e8d88]">ACTIVE PRINCIPAL IDENTITY</span>
                  <span className="text-sm font-bold text-white tracking-wide">{activeIdentity.id}</span>
                  <span className="text-[10px] text-[#00e5ff]">Tenant: {activeIdentity.tenant}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/40 font-bold">
                  CLEARANCE LVL {activeIdentity.clearanceLevel}
                </span>
                <span className="px-2.5 py-1 rounded bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/40 font-bold">
                  {activeIdentity.role}
                </span>
              </div>
            </div>

            {/* Switch Principal Roles */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#8e8d88] tracking-wider uppercase">
                SWITCH PRINCIPAL OR AGENT IDENTITY
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.values(KNOWN_IDENTITIES).map((id) => {
                  const isSelected = activeIdentity.id === id.id;
                  return (
                    <div
                      key={id.id}
                      onClick={() => handleSwitchIdentity(id.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#00e5ff]/15 border-[#00e5ff] text-white shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                          : 'bg-[#09101c] border-white/5 text-[#8e8d88] hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-white">{id.id}</span>
                        <span className="text-[9px] text-[#8e8d88]">
                          {id.role} · Clearance {id.clearanceLevel}
                        </span>
                        <span className="text-[8px] text-[#00e5ff] truncate max-w-[200px]">
                          Scopes: {id.allowedDomains.join(', ')}
                        </span>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-[#00e5ff]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#8e8d88]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Policy & Risk Simulator */}
        {activeTab === 'POLICY_TESTER' && (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            <div className="p-3.5 rounded-xl bg-[#09101c] border border-white/5 space-y-3">
              <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-[#00e5ff]" />
                <span>Zero-Trust Policy Interception Simulator</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[#8e8d88]">Requested Tool:</span>
                  <select
                    value={simTool}
                    onChange={(e) => setSimTool(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#05080e] border border-white/10 text-white font-mono"
                  >
                    <option value="execute_experience_transformation">execute_experience_transformation</option>
                    <option value="modify_dubai_masterplan">modify_dubai_masterplan</option>
                    <option value="deploy_defcon1_defense_grid">deploy_defcon1_defense_grid</option>
                    <option value="read_public_intelligence_feed">read_public_intelligence_feed</option>
                    <option value="override_sovereign_security_policy">override_sovereign_security_policy</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[#8e8d88]">Data Classification:</span>
                  <select
                    value={simClassification}
                    onChange={(e) => setSimClassification(e.target.value as DataClassification)}
                    className="w-full p-2 rounded-lg bg-[#05080e] border border-white/10 text-white font-mono"
                  >
                    <option value="PUBLIC">PUBLIC (Level 1)</option>
                    <option value="INTERNAL">INTERNAL (Level 3)</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL (Level 5)</option>
                    <option value="RESTRICTED">RESTRICTED (Level 7)</option>
                    <option value="HIGHLY_RESTRICTED">HIGHLY_RESTRICTED (Level 9)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[#8e8d88]">Domain Scope:</span>
                  <input
                    type="text"
                    value={simDomain}
                    onChange={(e) => setSimDomain(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#05080e] border border-white/10 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[#8e8d88]">Action Type:</span>
                  <select
                    value={simAction}
                    onChange={(e) => setSimAction(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-[#05080e] border border-white/10 text-white font-mono"
                  >
                    <option value="READ">READ (Low Risk)</option>
                    <option value="WRITE">WRITE (Medium Risk)</option>
                    <option value="EXECUTE">EXECUTE (Scoped Risk)</option>
                    <option value="ADMIN">ADMIN (High Risk - Approval Gate)</option>
                    <option value="DESTRUCTIVE">DESTRUCTIVE (Critical - Approval Gate)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunPolicyTest}
                className="w-full py-2.5 rounded-xl bg-[#00e5ff] hover:bg-[#00e5ff]/90 text-black font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
              >
                Evaluate Policy & Risk Gate
              </button>
            </div>

            {/* Test Result Display */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border space-y-2 ${
                  testResult.status === 'ALLOWED'
                    ? 'bg-[#091a18] border-[#10b981]/50 text-[#10b981]'
                    : testResult.status === 'GATE_REQUIRED'
                    ? 'bg-[#1a1409] border-[#f59e0b]/50 text-[#f59e0b]'
                    : 'bg-[#1a090f] border-[#ec4899]/50 text-[#ec4899]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    DECISION: {testResult.status}
                  </span>
                  <span className="px-2 py-0.5 rounded font-bold text-[9px] bg-black/40 border border-current">
                    RISK: {testResult.policy.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-[#f5f4f0] font-mono leading-relaxed">
                  {testResult.policy.reason}
                </p>
                <div className="text-[10px] text-[#8e8d88]">
                  Rule Triggered: <span className="font-bold text-white">{testResult.policy.policyRule}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Immutable Cryptographic Audit Log */}
        {activeTab === 'AUDIT_CHAIN' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px] scrollbar-thin scrollbar-thumb-[#00e5ff]/30">
            {auditChain.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                className="p-2.5 rounded-lg bg-[#09101c] border border-white/5 hover:border-[#00e5ff]/30 space-y-1 font-mono text-[10px]"
              >
                <div className="flex items-center justify-between text-[#8e8d88]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#00e5ff]">#{entry.sequence.toString().padStart(3, '0')}</span>
                    <span className="text-white font-semibold">{entry.what}</span>
                    <span
                      className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                        entry.policyResult === 'ALLOWED'
                          ? 'bg-[#10b981]/20 text-[#10b981]'
                          : entry.policyResult === 'GATED_APPROVED'
                          ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                          : 'bg-[#ec4899]/20 text-[#ec4899]'
                      }`}
                    >
                      {entry.policyResult}
                    </span>
                  </div>
                  <span>{entry.timestamp.substring(11, 23)}</span>
                </div>

                <div className="text-[#c4c3be]">
                  Actor: <span className="text-[#d4ff00]">{entry.who}</span> · Scope: {entry.where}
                </div>

                <div className="flex items-center justify-between text-[9px] text-[#8e8d88] pt-1 border-t border-white/5">
                  <span className="truncate max-w-[280px]">Hash: {entry.hash}</span>
                  <span className="truncate max-w-[200px]">Prev: {entry.prevHash}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Pending Approval Gates */}
        {activeTab === 'GATES' && (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px]">
            {pendingGates.length === 0 ? (
              <div className="py-12 text-center text-[#8e8d88] text-xs">
                No active human approval gates pending. System operating in nominal state.
              </div>
            ) : (
              pendingGates.slice().reverse().map((gate) => (
                <div
                  key={gate.id}
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    gate.status === 'PENDING'
                      ? 'bg-[#130d07] border-[#f59e0b]/40'
                      : gate.status === 'APPROVED'
                      ? 'bg-[#091a18] border-[#10b981]/30'
                      : 'bg-[#1a090f] border-[#ec4899]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{gate.request.toolName}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          gate.status === 'PENDING'
                            ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                            : gate.status === 'APPROVED'
                            ? 'bg-[#10b981]/20 text-[#10b981]'
                            : 'bg-[#ec4899]/20 text-[#ec4899]'
                        }`}
                      >
                        {gate.status}
                      </span>
                    </div>
                    <span className="text-[9px] text-[#8e8d88]">Risk: {gate.riskLevel}</span>
                  </div>

                  <p className="text-xs text-[#f5f4f0] font-mono leading-tight">
                    {gate.justification}
                  </p>

                  <div className="text-[10px] text-[#8e8d88]">
                    Caller: <span className="text-[#00e5ff]">{gate.request.callerIdentity}</span> · Resource: {gate.request.targetResource}
                  </div>

                  {gate.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleApproveGate(gate.id)}
                        className="flex-1 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#10b981]/90 text-black font-bold text-xs uppercase transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      >
                        Authorize & Execute
                      </button>
                      <button
                        onClick={() => handleRejectGate(gate.id)}
                        className="flex-1 py-1.5 rounded-lg bg-[#ec4899] hover:bg-[#ec4899]/90 text-white font-bold text-xs uppercase transition-all"
                      >
                        Veto / Deny
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-[#8e8d88]">
          <span>Enforcement: Autonomous Zero-Trust Gateway Active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#111622] hover:bg-[#1a2333] border border-white/10 text-white transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </motion.div>
    </div>
  );
};
