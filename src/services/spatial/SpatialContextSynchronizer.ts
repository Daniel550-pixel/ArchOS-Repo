// src/services/spatial/SpatialContextSynchronizer.ts
// Module 2: Synchronizes ULTRON Gestures, Raycasting & Spatial Target Selection with J.A.R.V.I.S. Cognitive Memory

import { commandBus } from '../commandBus';
import { worldModelGraphService } from '../archos/worldModelGraphService';
import { spatialRaycaster } from './SpatialRaycaster';
import { hapticFeedbackService } from './HapticFeedbackService';
import { ExperienceCommand } from '../../types';
import { CanonicalWorldModelEntity } from '../../types/archosWorldModel';

export interface ActiveSpatialContext {
  focusedEntityId: string | null;
  focusedEntity: CanonicalWorldModelEntity | null;
  hoveredEntityId: string | null;
  heldEntityId: string | null;
  lastGestureTimestamp: number;
  lastGestureAction: string | null;
  interactionCount: number;
  epistemologicalConfidence: number;
  contextPromptFragment: string;
}

type SpatialContextListener = (context: ActiveSpatialContext) => void;

export class SpatialContextSynchronizer {
  private activeContext: ActiveSpatialContext = {
    focusedEntityId: null,
    focusedEntity: null,
    hoveredEntityId: null,
    heldEntityId: null,
    lastGestureTimestamp: Date.now(),
    lastGestureAction: null,
    interactionCount: 0,
    epistemologicalConfidence: 1.0,
    contextPromptFragment: 'No spatial entity currently focused. UAE World Model at national overview baseline.'
  };

  private listeners: Set<SpatialContextListener> = new Set();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Listen to Unified Command Bus for all spatial and gesture interactions
    commandBus.subscribe((command: ExperienceCommand, source) => {
      this.handleCommand(command, source);
    });
  }

  public subscribe(listener: SpatialContextListener): () => void {
    this.listeners.add(listener);
    listener(this.activeContext);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getActiveContext(): ActiveSpatialContext {
    return { ...this.activeContext };
  }

  private handleCommand(command: ExperienceCommand, source: string): void {
    const now = Date.now();

    switch (command.type) {
      case 'HOVER': {
        const targetId = command.target || (command as any).payload?.target;
        if (targetId && targetId !== this.activeContext.hoveredEntityId) {
          this.activeContext.hoveredEntityId = targetId;
          this.activeContext.lastGestureAction = `HOVER(${targetId})`;
          this.activeContext.lastGestureTimestamp = now;
          this.notify();
        }
        break;
      }

      case 'HOVER_END': {
        if (this.activeContext.hoveredEntityId) {
          this.activeContext.hoveredEntityId = null;
          this.notify();
        }
        break;
      }

      case 'SELECT': {
        const targetId = command.target || (command as any).payload?.target;
        if (targetId) {
          this.setFocusedEntity(targetId, 'PRIMARY_SELECT');
        }
        break;
      }

      case 'SECONDARY_SELECT': {
        const targetId = command.target || (command as any).payload?.target;
        if (targetId) {
          this.setFocusedEntity(targetId, 'SECONDARY_SELECT_CONTEXT');
        }
        break;
      }

      case 'GRAB': {
        const targetId = command.target || (command as any).payload?.target;
        if (targetId) {
          this.activeContext.heldEntityId = targetId;
          this.activeContext.lastGestureAction = `GRAB(${targetId})`;
          this.activeContext.lastGestureTimestamp = now;
          this.activeContext.interactionCount++;
          this.notify();
        }
        break;
      }

      case 'RELEASE': {
        if (this.activeContext.heldEntityId) {
          const releasedId = this.activeContext.heldEntityId;
          this.activeContext.heldEntityId = null;
          this.activeContext.lastGestureAction = `RELEASE(${releasedId})`;
          this.activeContext.lastGestureTimestamp = now;
          this.activeContext.interactionCount++;
          this.notify();
        }
        break;
      }

      case 'SUMMON_MENU': {
        this.activeContext.lastGestureAction = 'SUMMON_EXECUTIVE_MENU';
        this.activeContext.lastGestureTimestamp = now;
        this.notify();
        break;
      }

      case 'DISMISS': {
        this.activeContext.lastGestureAction = 'DISMISS';
        this.activeContext.lastGestureTimestamp = now;
        this.notify();
        break;
      }

      case 'PAN': {
        this.activeContext.lastGestureAction = 'PAN_VIEWPORT';
        this.activeContext.lastGestureTimestamp = now;
        break;
      }

      case 'SCROLL': {
        this.activeContext.lastGestureAction = 'SCROLL_TIMELINE';
        this.activeContext.lastGestureTimestamp = now;
        break;
      }

      default:
        break;
    }
  }

  /**
   * Binds an entity into J.A.R.V.I.S. active semantic focus and formats prompt telemetry
   */
  public setFocusedEntity(entityId: string, triggerAction: string = 'DIRECT_FOCUS'): void {
    const worldEntities = worldModelGraphService.getEntities();
    const entity = worldEntities.find(e => e.id === entityId) || null;

    this.activeContext.focusedEntityId = entityId;
    this.activeContext.focusedEntity = entity;
    this.activeContext.lastGestureAction = `${triggerAction}(${entityId})`;
    this.activeContext.lastGestureTimestamp = Date.now();
    this.activeContext.interactionCount++;

    if (entity) {
      this.activeContext.epistemologicalConfidence = entity.currentState.vitalityScore / 100;
      this.activeContext.contextPromptFragment = 
        `[ACTIVE SPATIAL FOCUS: ${entity.name} (${entity.arabicName || ''})] ` +
        `Class: ${entity.entityClass} | Canonical Code: ${entity.canonicalCode} | ` +
        `Lifecycle: ${entity.lifecycleState} | Vitality Score: ${entity.currentState.vitalityScore}/100 | ` +
        `Emirate: ${entity.location.emirateName} (${entity.location.emirateId}) | Zone: ${entity.location.municipalityZone} | ` +
        `Total Height: ${entity.attributes.totalHeightMeters || 'N/A'}m | ` +
        `Active Load: ${entity.currentState.activeLoadKw} kW | ` +
        `Cooling Demand: ${entity.currentState.coolingDemandTons} Tons | ` +
        `Epistemological Status: ${entity.epistemologicalTag}`;
    } else {
      this.activeContext.contextPromptFragment = `[SPATIAL FOCUS: ${entityId}] Entity registered in spatial index.`;
    }

    this.notify();
  }

  public clearFocus(): void {
    this.activeContext.focusedEntityId = null;
    this.activeContext.focusedEntity = null;
    this.activeContext.contextPromptFragment = 'UAE World Model at national overview baseline.';
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.activeContext);
      } catch (err) {
        console.error('[SpatialContextSynchronizer] Listener error:', err);
      }
    });
  }
}

export const spatialContextSynchronizer = new SpatialContextSynchronizer();
