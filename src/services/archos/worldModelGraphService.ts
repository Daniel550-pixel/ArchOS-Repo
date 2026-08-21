import {
  CanonicalWorldModelEntity,
  EpistemologicalTag,
  EntityClass,
  LifecycleStage,
  WorldModelGraphStats
} from '../../types/archosWorldModel';
import {
  INITIAL_WORLD_MODEL_ENTITIES,
  INITIAL_WORLD_MODEL_GRAPH_STATS
} from '../../data/archosWorldModelData';

type Listener = (entities: CanonicalWorldModelEntity[], stats: WorldModelGraphStats) => void;

class WorldModelGraphService {
  private entities: CanonicalWorldModelEntity[] = [...INITIAL_WORLD_MODEL_ENTITIES];
  private stats: WorldModelGraphStats = { ...INITIAL_WORLD_MODEL_GRAPH_STATS };
  private listeners: Set<Listener> = new Set();

  public getEntities(): CanonicalWorldModelEntity[] {
    return [...this.entities];
  }

  public getStats(): WorldModelGraphStats {
    return { ...this.stats };
  }

  public getEntityById(id: string): CanonicalWorldModelEntity | undefined {
    return this.entities.find((e) => e.id === id);
  }

  public filterEntities(filters: {
    epistemologicalTag?: EpistemologicalTag | 'ALL';
    entityClass?: EntityClass | 'ALL';
    lifecycleStage?: LifecycleStage | 'ALL';
    searchQuery?: string;
  }): CanonicalWorldModelEntity[] {
    return this.entities.filter((entity) => {
      if (filters.epistemologicalTag && filters.epistemologicalTag !== 'ALL') {
        if (entity.epistemologicalTag !== filters.epistemologicalTag) return false;
      }
      if (filters.entityClass && filters.entityClass !== 'ALL') {
        if (entity.entityClass !== filters.entityClass) return false;
      }
      if (filters.lifecycleStage && filters.lifecycleStage !== 'ALL') {
        if (entity.lifecycleState !== filters.lifecycleStage) return false;
      }
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = entity.name.toLowerCase().includes(q);
        const matchesArabic = entity.arabicName.includes(q);
        const matchesCode = entity.canonicalCode.toLowerCase().includes(q);
        const matchesLocation = entity.location.municipalityZone.toLowerCase().includes(q);
        if (!matchesName && !matchesArabic && !matchesCode && !matchesLocation) return false;
      }
      return true;
    });
  }

  public updateEpistemologicalTag(
    entityId: string,
    newTag: EpistemologicalTag,
    rationale: string
  ): void {
    this.entities = this.entities.map((e) => {
      if (e.id === entityId) {
        return {
          ...e,
          epistemologicalTag: newTag,
          epistemologicalRationale: rationale
        };
      }
      return e;
    });
    this.recalculateStats();
    this.notify();
  }

  public injectGroundScanEntity(newEntity: CanonicalWorldModelEntity): void {
    const existingIndex = this.entities.findIndex((e) => e.id === newEntity.id);
    if (existingIndex >= 0) {
      this.entities[existingIndex] = newEntity;
    } else {
      this.entities.unshift(newEntity);
    }
    this.recalculateStats();
    this.notify();
  }

  private recalculateStats(): void {
    let obs = 0;
    let inf = 0;
    let pred = 0;
    let sim = 0;
    let sensors = 0;
    let rels = 0;

    for (const e of this.entities) {
      if (e.epistemologicalTag === 'OBSERVED') obs++;
      if (e.epistemologicalTag === 'INFERRED') inf++;
      if (e.epistemologicalTag === 'PREDICTED') pred++;
      if (e.epistemologicalTag === 'SIMULATED') sim++;
      sensors += e.observations.length;
      rels += e.relationships.length;
    }

    this.stats = {
      totalEntities: this.entities.length,
      totalRelationships: rels,
      observedEntitiesCount: obs,
      inferredEntitiesCount: inf,
      predictedEntitiesCount: pred,
      simulatedEntitiesCount: sim,
      liveSensorsConnected: sensors,
      merkleTreeRootHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`
    };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getEntities(), this.getStats());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const ents = this.getEntities();
    const st = this.getStats();
    this.listeners.forEach((l) => l(ents, st));
  }
}

export const worldModelGraphService = new WorldModelGraphService();
