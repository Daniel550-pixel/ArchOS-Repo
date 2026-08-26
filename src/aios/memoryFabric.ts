export type MemoryKind = 'episodic' | 'semantic' | 'procedural' | 'world' | 'evidence';
export type MemoryTrust = 'UNVERIFIED' | 'SUPPORTED' | 'VERIFIED' | 'REJECTED';

export interface MemoryProvenance {
  source: string;
  sourceType: 'agent' | 'user' | 'tool' | 'world-model' | 'system';
  observedAt: number;
  traceId?: string;
  evidenceIds?: readonly string[];
  confidence: number;
}

export interface MemoryRecord<T = unknown> {
  id: string;
  namespace: string;
  kind: MemoryKind;
  subject: string;
  value: T;
  provenance: MemoryProvenance;
  trust: MemoryTrust;
  createdAt: number;
  updatedAt: number;
  version: number;
  previousHash: string | null;
  contentHash: string;
  recordHash: string;
  expiresAt?: number;
}

export interface MemoryQuery {
  namespace?: string;
  kind?: MemoryKind;
  subject?: string;
  trust?: MemoryTrust;
  traceId?: string;
  limit?: number;
  includeExpired?: boolean;
}

export interface MemoryIntegrityReport {
  valid: boolean;
  checked: number;
  brokenLinks: number;
  invalidHashes: number;
  duplicateIds: number;
  expired: number;
}

const MAX_RECORDS = 5000;
const MAX_QUERY_LIMIT = 250;

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(',')}}`;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function boundedConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function recordMaterial(record: Pick<MemoryRecord, 'id' | 'namespace' | 'kind' | 'subject' | 'value' | 'provenance' | 'trust' | 'createdAt' | 'updatedAt' | 'version' | 'previousHash' | 'expiresAt'>): string {
  return canonicalize(record);
}

async function makeId(now: number, subject: string): Promise<string> {
  return `mem_${now.toString(36)}_${(await sha256(`${now}:${subject}:${Math.random()}`)).slice(0, 12)}`;
}

let records: MemoryRecord[] = [];

export const memoryFabric = {
  async write<T>(input: {
    namespace: string;
    kind: MemoryKind;
    subject: string;
    value: T;
    provenance: Omit<MemoryProvenance, 'confidence'> & { confidence?: number };
    trust?: MemoryTrust;
    expiresAt?: number;
    id?: string;
  }): Promise<MemoryRecord<T>> {
    const now = Date.now();
    const previous = records.at(-1);
    const id = input.id ?? await makeId(now, input.subject);
    if (records.some(record => record.id === id)) throw new Error(`Memory id already exists: ${id}`);

    const provenance: MemoryProvenance = {
      ...input.provenance,
      confidence: boundedConfidence(input.provenance.confidence ?? 0),
    };
    const latestVersion = records.filter(record => record.namespace === input.namespace && record.subject === input.subject).at(-1)?.version ?? 0;
    const base = {
      id,
      namespace: input.namespace,
      kind: input.kind,
      subject: input.subject,
      value: input.value,
      provenance,
      trust: input.trust ?? 'UNVERIFIED',
      createdAt: now,
      updatedAt: now,
      version: latestVersion + 1,
      previousHash: previous?.recordHash ?? null,
      expiresAt: input.expiresAt,
    } as const;
    const contentHash = await sha256(canonicalize({ value: base.value, provenance: base.provenance, trust: base.trust }));
    const recordHash = await sha256(`${base.previousHash ?? ''}|${recordMaterial(base)}|${contentHash}`);
    const record: MemoryRecord<T> = { ...base, contentHash, recordHash };
    records = [...records, record].slice(-MAX_RECORDS);
    return record;
  },

  query(query: MemoryQuery = {}): readonly MemoryRecord[] {
    const now = Date.now();
    const limit = Math.min(Math.max(query.limit ?? 50, 1), MAX_QUERY_LIMIT);
    return records.filter(record => {
      if (!query.includeExpired && record.expiresAt !== undefined && record.expiresAt <= now) return false;
      if (query.namespace && record.namespace !== query.namespace) return false;
      if (query.kind && record.kind !== query.kind) return false;
      if (query.subject && record.subject !== query.subject) return false;
      if (query.trust && record.trust !== query.trust) return false;
      if (query.traceId && record.provenance.traceId !== query.traceId) return false;
      return true;
    }).slice(-limit).reverse();
  },

  latest(namespace: string, subject: string): MemoryRecord | null {
    return records.filter(record => record.namespace === namespace && record.subject === subject).at(-1) ?? null;
  },

  async verify(): Promise<MemoryIntegrityReport> {
    let brokenLinks = 0;
    let invalidHashes = 0;
    let expired = 0;
    const seen = new Set<string>();
    let previousHash: string | null = null;
    const now = Date.now();

    for (const record of records) {
      if (seen.has(record.id)) continue;
      seen.add(record.id);
      if (record.previousHash !== previousHash) brokenLinks += 1;
      const expectedContent = await sha256(canonicalize({ value: record.value, provenance: record.provenance, trust: record.trust }));
      const expectedHash = await sha256(`${record.previousHash ?? ''}|${recordMaterial(record)}|${record.contentHash}`);
      if (expectedContent !== record.contentHash || expectedHash !== record.recordHash) invalidHashes += 1;
      if (record.expiresAt !== undefined && record.expiresAt <= now) expired += 1;
      previousHash = record.recordHash;
    }

    return {
      valid: brokenLinks === 0 && invalidHashes === 0 && new Set(records.map(record => record.id)).size === records.length,
      checked: records.length,
      brokenLinks,
      invalidHashes,
      duplicateIds: records.length - seen.size,
      expired,
    };
  },

  clear(): void {
    records = [];
  },

  size(): number {
    return records.length;
  },
};
