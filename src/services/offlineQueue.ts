/**
 * Offline mutation queue with idempotency keys and reconnect reconciliation
 */

interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  body: any;
  ts: number;
}

const QUEUE_KEY = 'archos_offline_mutations';

export function getOfflineQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineMutation(url: string, method: string, body: any) {
  const queue = getOfflineQueue();
  const id = `mut_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({ id, url, method, body, ts: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function flushOfflineQueue(): Promise<number> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  let flushed = 0;
  const remaining: QueuedMutation[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': item.id,
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      if (res.ok) {
        flushed++;
      } else {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return flushed;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineQueue().then((n) => {
      if (n > 0) {
        console.info(`[OfflineQueue] Reconciled and flushed ${n} offline mutations.`);
      }
    });
  });
}
