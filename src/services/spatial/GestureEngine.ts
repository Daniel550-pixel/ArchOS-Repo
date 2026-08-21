// src/services/spatial/GestureEngine.ts
// ULTRON Gesture Engine: Standardized Gesture-to-Command Pipeline & Feedback Orchestrator

import { commandBus } from '../commandBus';
import { spatialRaycaster } from './SpatialRaycaster';
import { gestureRecognizer } from './GestureRecognizer';
import { hapticFeedbackService } from './HapticFeedbackService';
import { UltronGestureEvent, Vector3D, ReticleVisualState } from './types';

export class GestureEngine {
  private hoveredEntityId: string | null = null;
  private heldEntityId: string | null = null;
  private lastPanTime: number = 0;
  private isEnabled: boolean = true;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // 1. Listen for classified gestures from GestureRecognizer
    gestureRecognizer.onGestureDetected((event: UltronGestureEvent) => {
      if (!this.isEnabled) return;
      this.processGesture(event);
    });

    // 2. Listen to Unified Command Bus for global gesture toggles
    commandBus.subscribe((command) => {
      if (command.type === 'ENABLE_GESTURES') {
        this.isEnabled = true;
      } else if (command.type === 'DISABLE_GESTURES') {
        this.isEnabled = false;
        this.resetState();
      } else if (command.type === 'TOGGLE_GESTURES') {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) this.resetState();
      }
    });
  }

  /**
   * Process incoming gesture events according to the ULTRON Gesture Dictionary
   */
  public processGesture(event: UltronGestureEvent): void {
    const { type, position, direction, delta } = event;

    // Continuous Screen & Reticle Position Tracking
    const screenX = position ? position.x : 0.5;
    const screenY = position ? position.y : 0.5;

    // Perform Spatial Raycasting on hover/point or general hand positioning
    let hit = null;
    if (position) {
      const ray = spatialRaycaster.screenToWorldRay(screenX, screenY);
      hit = spatialRaycaster.castRay(ray);
    }

    const currentHitId = hit ? hit.entityId : null;

    // 1. Hover / Point State Management
    if (type === 'HOVER' || type === 'IDLE') {
      if (currentHitId && currentHitId !== this.hoveredEntityId) {
        this.hoveredEntityId = currentHitId;
        
        // Trigger light haptic bump & snap visual reticle
        hapticFeedbackService.triggerFeedback('TICK');
        hapticFeedbackService.updateVisualState({
          reticleState: 'HOVER_TARGET',
          screenX,
          screenY,
          hoveredEntityId: currentHitId,
          heldEntityId: this.heldEntityId,
          targetScale: 1.15,
          glowIntensity: 0.8,
          highlightColor: '#00f0ff',
          hapticNoticeText: `HOVER: ${hit?.entityName}`
        });

        // Dispatch HOVER to Unified Command Bus
        commandBus.dispatch({
          type: 'HOVER',
          target: currentHitId,
          source: 'gesture',
          payload: {
            target: currentHitId,
            point: [hit!.point.x, hit!.point.y, hit!.point.z],
            distance: hit!.distance
          }
        }, 'gesture');

      } else if (!currentHitId && this.hoveredEntityId) {
        const prevTarget = this.hoveredEntityId;
        this.hoveredEntityId = null;

        hapticFeedbackService.updateVisualState({
          reticleState: 'IDLE_TRACKING',
          screenX,
          screenY,
          hoveredEntityId: null,
          heldEntityId: this.heldEntityId,
          targetScale: 1.0,
          glowIntensity: 0.2,
          highlightColor: '#00f0ff',
          hapticNoticeText: undefined
        });

        commandBus.dispatch({
          type: 'HOVER_END',
          source: 'gesture',
          payload: { previousTarget: prevTarget }
        }, 'gesture');
      } else {
        hapticFeedbackService.updateVisualState({
          reticleState: this.heldEntityId ? 'GRAB_DRAGGING' : 'IDLE_TRACKING',
          screenX,
          screenY,
          hoveredEntityId: this.hoveredEntityId,
          heldEntityId: this.heldEntityId
        });
      }
    }

    // 2. Primary Select (Pinch)
    if (type === 'PINCH') {
      if (this.hoveredEntityId) {
        this.heldEntityId = this.hoveredEntityId;

        // Feedback
        hapticFeedbackService.triggerFeedback('CLICK');
        hapticFeedbackService.updateVisualState({
          reticleState: 'PINCH_ACTIVE',
          screenX,
          screenY,
          hoveredEntityId: this.hoveredEntityId,
          heldEntityId: this.heldEntityId,
          targetScale: 0.9,
          glowIntensity: 1.0,
          highlightColor: '#10b981',
          hapticNoticeText: 'PRIMARY SELECT'
        });

        // Dispatch SELECT to Command Bus
        commandBus.dispatch({
          type: 'SELECT',
          target: this.hoveredEntityId,
          source: 'gesture',
          payload: { target: this.hoveredEntityId }
        }, 'gesture');
      } else {
        // Subtle click on empty space
        hapticFeedbackService.triggerFeedback('CLICK');
      }
    }

    // 3. Secondary Select (Double Pinch)
    if (type === 'DOUBLE_PINCH') {
      if (this.hoveredEntityId) {
        hapticFeedbackService.triggerFeedback('CONFIRM_DOUBLE');
        hapticFeedbackService.updateVisualState({
          reticleState: 'PINCH_ACTIVE',
          screenX,
          screenY,
          hoveredEntityId: this.hoveredEntityId,
          targetScale: 1.25,
          glowIntensity: 1.0,
          highlightColor: '#f59e0b',
          hapticNoticeText: 'SECONDARY SELECT'
        });

        commandBus.dispatch({
          type: 'SECONDARY_SELECT',
          target: this.hoveredEntityId,
          source: 'gesture',
          payload: { target: this.hoveredEntityId }
        }, 'gesture');
      }
    }

    // 4. Grab & Drag (Fist Close)
    if (type === 'FIST_CLOSE') {
      if (this.hoveredEntityId) {
        const entityNode = spatialRaycaster.getEntityNode(this.hoveredEntityId);
        if (entityNode && entityNode.isMovable) {
          this.heldEntityId = this.hoveredEntityId;
          hapticFeedbackService.triggerFeedback('RUMBLE_START');
          hapticFeedbackService.updateVisualState({
            reticleState: 'GRAB_DRAGGING',
            screenX,
            screenY,
            hoveredEntityId: this.hoveredEntityId,
            heldEntityId: this.heldEntityId,
            glowIntensity: 0.9,
            highlightColor: '#8b5cf6',
            hapticNoticeText: `GRABBED: ${entityNode.name}`
          });

          commandBus.dispatch({
            type: 'GRAB',
            target: this.hoveredEntityId,
            source: 'gesture',
            payload: { target: this.hoveredEntityId }
          }, 'gesture');
        } else {
          // Object not movable - trigger error feedback
          hapticFeedbackService.triggerFeedback('ERROR_BUZZ');
          hapticFeedbackService.updateVisualState({
            reticleState: 'ERROR_INVALID',
            screenX,
            screenY,
            highlightColor: '#ef4444',
            hapticNoticeText: 'OBJECT ANCHORED (IMMUTABLE)'
          });
        }
      }
    }

    // 5. Release (Fist Open)
    if (type === 'FIST_OPEN') {
      if (this.heldEntityId) {
        const releasedId = this.heldEntityId;
        this.heldEntityId = null;

        hapticFeedbackService.triggerFeedback('RUMBLE_STOP');
        hapticFeedbackService.triggerFeedback('THUD');
        hapticFeedbackService.updateVisualState({
          reticleState: 'HOVER_TARGET',
          screenX,
          screenY,
          hoveredEntityId: this.hoveredEntityId,
          heldEntityId: null,
          glowIntensity: 0.4,
          highlightColor: '#00f0ff',
          hapticNoticeText: 'RELEASED / SNAPPED'
        });

        commandBus.dispatch({
          type: 'RELEASE',
          target: releasedId,
          source: 'gesture',
          payload: { target: releasedId }
        }, 'gesture');
      }
    }

    // 6. Summon / Reset Menu (Open Palm Hold > 500ms)
    if (type === 'OPEN_PALM_HOLD') {
      hapticFeedbackService.triggerFeedback('CONFIRM_DOUBLE');
      hapticFeedbackService.updateVisualState({
        reticleState: 'SUMMON_HOLD',
        screenX,
        screenY,
        glowIntensity: 1.0,
        highlightColor: '#38bdf8',
        hapticNoticeText: 'SUMMON EXECUTIVE MENU'
      });

      commandBus.dispatch({
        type: 'SUMMON_MENU',
        source: 'gesture'
      }, 'gesture');
    }

    // 7. Dismiss / Flick
    if (type === 'FLICK') {
      hapticFeedbackService.triggerFeedback('SWIPE_BUZZ');
      hapticFeedbackService.updateVisualState({
        reticleState: 'DISMISS_FLICK',
        screenX,
        screenY,
        glowIntensity: 0.8,
        highlightColor: '#f43f5e',
        hapticNoticeText: 'DISMISS PANEL'
      });

      commandBus.dispatch({
        type: 'DISMISS',
        source: 'gesture',
        target: this.hoveredEntityId || undefined
      }, 'gesture');
    }

    // 8. Pan Navigation (Open Palm moving)
    if (type === 'PAN' && delta) {
      const now = performance.now();
      if (now - this.lastPanTime > 40) {
        this.lastPanTime = now;
        hapticFeedbackService.triggerFeedback('WHEEL');
      }

      commandBus.dispatch({
        type: 'PAN',
        delta,
        source: 'gesture',
        payload: { delta }
      }, 'gesture');
    }

    // 9. Scroll Navigation
    if (type === 'SCROLL' && delta) {
      const now = performance.now();
      if (now - this.lastPanTime > 50) {
        this.lastPanTime = now;
        hapticFeedbackService.triggerFeedback('WHEEL');
      }

      commandBus.dispatch({
        type: 'SCROLL',
        delta: delta.y,
        source: 'gesture',
        payload: { delta: delta.y }
      }, 'gesture');
    }
  }

  private resetState(): void {
    this.hoveredEntityId = null;
    this.heldEntityId = null;
    hapticFeedbackService.updateVisualState({
      reticleState: 'IDLE_TRACKING',
      hoveredEntityId: null,
      heldEntityId: null
    });
  }

  public getHoveredEntityId(): string | null {
    return this.hoveredEntityId;
  }

  public getHeldEntityId(): string | null {
    return this.heldEntityId;
  }
}

export const gestureEngine = new GestureEngine();
