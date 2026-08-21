import { create } from 'zustand';
import type { WorldEntity, TelemetrySample } from '../shared/contracts';

interface S {
  tenant: string;
  authed: boolean;
  entities: WorldEntity[];
  telemetry: Record<string, number[]>;
  setAuthed: (b: boolean) => void;
  setTenant: (t: string) => void;
  ingest: (e: WorldEntity) => void;
  pushTelemetry: (t: TelemetrySample) => void;
}

export const useArchOS = create<S>((set) => ({
  tenant: 'uae-sovereign-01',
  authed: false,
  entities: [],
  telemetry: {},
  setAuthed: (b: boolean) => set({ authed: b }),
  setTenant: (t: string) => set({ tenant: t }),
  ingest: (e: WorldEntity) =>
    set((s) => ({
      entities: [e, ...s.entities.filter((existing) => existing.id !== e.id)],
    })),
  pushTelemetry: (t: TelemetrySample) =>
    set((s) => {
      const updated = { ...s.telemetry };
      for (const [k, v] of Object.entries(t)) {
        if (k === 'ts') continue;
        const arr = updated[k] ? [...updated[k], v] : [v];
        if (arr.length > 60) arr.shift();
        updated[k] = arr;
      }
      return { telemetry: updated };
    }),
}));

export * from '../shared/contracts';
