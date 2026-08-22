// ULTRON Gesture Engine: Gesture-to-Command Pipeline & Spatial Manipulation

import { commandBus } from '../commandBus';
import { spatialRaycaster } from './SpatialRaycaster';
import { gestureRecognizer } from './GestureRecognizer';
import { hapticFeedbackService } from './HapticFeedbackService';
import { gestureSpatialController } from './GestureSpatialController';
import type { UltronGestureEvent } from './types';

export class GestureEngine {
  private hoveredEntityId: string | null = null;
  private heldEntityId: string | null = null;
  private lastPanTime = 0;
  private isEnabled = true;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    gestureRecognizer.onGestureDetected((event: UltronGestureEvent) => {
      if (!this.isEnabled) return;
      gestureSpatialController.process(event);
      this.processGesture(event);
    });

    commandBus.subscribe((command) => {
      if (command.type === 'ENABLE_GESTURES') this.isEnabled = true;
      if (command.type === 'DISABLE_GESTURES') {
        this.isEnabled = false;
        this.resetState();
      }
      if (command.type === 'TOGGLE_GESTURES') {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) this.resetState();
      }
    });
  }

  public processGesture(event: UltronGestureEvent): void {
    const { type, position, delta } = event;
    const screenX = position?.x ?? 0.5;
    const screenY = position?.y ?? 0.5;
    let hit = null;

    if (position) {
      const ray = spatialRaycaster.screenToWorldRay(screenX, screenY);
      hit = spatialRaycaster.castRay(ray);
    }

    const currentHitId = hit?.entityId ?? null;

    if (type === 'HOVER' || type === 'IDLE') {
      if (currentHitId && currentHitId !== this.hoveredEntityId) {
        this.hoveredEntityId = currentHitId;
        hapticFeedbackService.triggerFeedback('TICK');
        hapticFeedbackService.updateVisualState({
          reticleState: 'HOVER_TARGET', screenX, screenY,
          hoveredEntityId: currentHitId, heldEntityId: this.heldEntityId,
          targetScale: 1.15, glowIntensity: 0.8, highlightColor: '#00f0ff',
          hapticNoticeText: `HOVER: ${hit?.entityName}`
        });
        commandBus.dispatch({
          type: 'HOVER', target: currentHitId, source: 'gesture',
          payload: { target: currentHitId, point: hit ? [hit.point.x, hit.point.y, hit.point.z] : undefined, distance: hit?.distance }
        }, 'gesture');
      } else if (!currentHitId && this.hoveredEntityId) {
        const previousTarget = this.hoveredEntityId;
        this.hoveredEntityId = null;
        hapticFeedbackService.updateVisualState({
          reticleState: 'IDLE_TRACKING', screenX, screenY,
          hoveredEntityId: null, heldEntityId: this.heldEntityId,
          targetScale: 1, glowIntensity: 0.2, highlightColor: '#00f0ff'
        });
        commandBus.dispatch({ type: 'HOVER_END', source: 'gesture', payload: { previousTarget } }, 'gesture');
      } else {
        hapticFeedbackService.updateVisualState({
          reticleState: this.heldEntityId ? 'GRAB_DRAGGING' : 'IDLE_TRACKING',
          screenX, screenY, hoveredEntityId: this.hoveredEntityId, heldEntityId: this.heldEntityId
        });
      }
    }

    if (type === 'PINCH' && this.hoveredEntityId) {
      this.heldEntityId = this.hoveredEntityId;
      hapticFeedbackService.triggerFeedback('CLICK');
      hapticFeedbackService.updateVisualState({
        reticleState: 'PINCH_ACTIVE', screenX, screenY,
        hoveredEntityId: this.hoveredEntityId, heldEntityId: this.heldEntityId,
        targetScale: 0.9, glowIntensity: 1, highlightColor: '#10b981', hapticNoticeText: 'PRIMARY SELECT'
      });
      commandBus.dispatch({ type: 'SELECT', target: this.hoveredEntityId, source: 'gesture', payload: { target: this.hoveredEntityId } }, 'gesture');
    }

    if (type === 'DOUBLE_PINCH' && this.hoveredEntityId) {
      hapticFeedbackService.triggerFeedback('CONFIRM_DOUBLE');
      commandBus.dispatch({ type: 'SECONDARY_SELECT', target: this.hoveredEntityId, source: 'gesture', payload: { target: this.hoveredEntityId } }, 'gesture');
    }

    if (type === 'FIST_CLOSE' && this.hoveredEntityId) {
      const node = spatialRaycaster.getEntityNode(this.hoveredEntityId);
      if (node?.isMovable) {
        this.heldEntityId = this.hoveredEntityId;
        hapticFeedbackService.triggerFeedback('RUMBLE_START');
        hapticFeedbackService.updateVisualState({
          reticleState: 'GRAB_DRAGGING', screenX, screenY,
          hoveredEntityId: this.hoveredEntityId, heldEntityId: this.heldEntityId,
          glowIntensity: 0.9, highlightColor: '#8b5cf6', hapticNoticeText: `GRABBED: ${node.name}`
        });
        commandBus.dispatch({ type: 'GRAB', target: this.hoveredEntityId, source: 'gesture', payload: { target: this.hoveredEntityId } }, 'gesture');
      } else {
        hapticFeedbackService.triggerFeedback('ERROR_BUZZ');
      }
    }

    if (type === 'FIST_OPEN' && this.heldEntityId) {
      const releasedId = this.heldEntityId;
      this.heldEntityId = null;
      hapticFeedbackService.triggerFeedback('RUMBLE_STOP');
      hapticFeedbackService.triggerFeedback('THUD');
      commandBus.dispatch({ type: 'RELEASE', target: releasedId, source: 'gesture', payload: { target: releasedId } }, 'gesture');
    }

    if (type === 'OPEN_PALM_HOLD') {
      hapticFeedbackService.triggerFeedback('CONFIRM_DOUBLE');
      hapticFeedbackService.updateVisualState({
        reticleState: 'SUMMON_HOLD', screenX, screenY, glowIntensity: 1,
        highlightColor: '#38bdf8', hapticNoticeText: 'SUMMON EXECUTIVE MENU'
      });
      commandBus.dispatch({ type: 'SUMMON_MENU', source: 'gesture' }, 'gesture');
    }

    if (type === 'FLICK') {
      hapticFeedbackService.triggerFeedback('SWIPE_BUZZ');
      commandBus.dispatch({ type: 'DISMISS', source: 'gesture', target: this.hoveredEntityId || undefined }, 'gesture');
    }

    if (type === 'PAN' && delta) {
      const now = performance.now();
      if (now - this.lastPanTime > 40) {
        this.lastPanTime = now;
        hapticFeedbackService.triggerFeedback('WHEEL');
      }
      commandBus.dispatch({ type: 'PAN', delta, source: 'gesture', payload: { delta } }, 'gesture');
    }

    if (type === 'SCROLL' && delta) {
      const now = performance.now();
      if (now - this.lastPanTime > 50) {
        this.lastPanTime = now;
        hapticFeedbackService.triggerFeedback('WHEEL');
      }
      commandBus.dispatch({ type: 'SCROLL', delta: delta.y, source: 'gesture', payload: { delta: delta.y } }, 'gesture');
    }
  }

  private resetState(): void {
    this.hoveredEntityId = null;
    this.heldEntityId = null;
    gestureSpatialController.reset();
    hapticFeedbackService.updateVisualState({ reticleState: 'IDLE_TRACKING', hoveredEntityId: null, heldEntityId: null });
  }

  public getHoveredEntityId(): string | null { return this.hoveredEntityId; }
  public getHeldEntityId(): string | null { return this.heldEntityId; }
}

export const gestureEngine = new GestureEngine();
