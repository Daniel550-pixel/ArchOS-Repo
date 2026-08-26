import { memoryFabric, type MemoryKind, type MemoryRecord } from './memoryFabric';

export interface MemoryContextRequest {
  namespace?: string;
  subject?: string;
  traceId?: string;
  kinds?: readonly MemoryKind[];
  limit?: number;
  minConfidence?: number;
  includeRejected?: boolean;
}

export interface MemoryContextItem {
  id: string;
  kind: MemoryKind;
  subject: string;
  value: unknown;
  trust: MemoryRecord['trust'];
  confidence: number;
  provenance: MemoryRecord['provenance'];
  version: number;
}

export interface AssembledMemoryContext {
  items: readonly MemoryContextItem[];
  recordCount: number;
  verifiedCount: number;
  supportedCount: number;
  rejectedCount: number;
}

/** Provider-neutral context assembly for JARVIS and agent workers. */
export function assembleMemoryContext(request: MemoryContextRequest = {}): AssembledMemoryContext {
  const minConfidence = Math.max(0, Math.min(1, request.minConfidence ?? 0));
  const records = memoryFabric.query({
    namespace: request.namespace,
    subject: request.subject,
    traceId: request.traceId,
    limit: Math.min(Math.max(request.limit ?? 25, 1), 100),
    includeExpired: false,
  }).filter(record => {
    if (request.kinds?.length && !request.kinds.includes(record.kind)) return false;
    if (record.provenance.confidence < minConfidence) return false;
    if (!request.includeRejected && record.trust === 'REJECTED') return false;
    return true;
  });

  const items = records.map(record => ({
    id: record.id,
    kind: record.kind,
    subject: record.subject,
    value: record.value,
    trust: record.trust,
    confidence: record.provenance.confidence,
    provenance: record.provenance,
    version: record.version,
  }));

  return {
    items,
    recordCount: items.length,
    verifiedCount: items.filter(item => item.trust === 'VERIFIED').length,
    supportedCount: items.filter(item => item.trust === 'SUPPORTED').length,
    rejectedCount: items.filter(item => item.trust === 'REJECTED').length,
  };
}
