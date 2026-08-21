// src/services/spatial/types.ts
// Spatial Raycasting, BVH Bounding Volume Hierarchy, and ULTRON Gesture Types

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Ray3D {
  origin: Vector3D;
  direction: Vector3D; // Normalized unit vector
}

export interface BoundingBox3D {
  min: Vector3D;
  max: Vector3D;
  center?: Vector3D;
  radius?: number;
}

export interface SpatialEntityNode {
  id: string;
  name: string;
  arabicName?: string;
  entityClass: string;
  bounds: BoundingBox3D;
  worldPosition: Vector3D;
  isMovable: boolean;
  isSelectable: boolean;
  parentEntityId?: string;
  metadata?: Record<string, any>;
}

export interface RaycastHit {
  entityId: string;
  entityName: string;
  entityClass: string;
  distance: number;
  point: Vector3D;
  normal: Vector3D;
  isMovable: boolean;
  isSelectable: boolean;
  node: SpatialEntityNode;
}

export interface BVHNode {
  bounds: BoundingBox3D;
  left?: BVHNode;
  right?: BVHNode;
  entities: SpatialEntityNode[];
  isLeaf: boolean;
}

// ULTRON Gesture Interaction Enums & Types
export type UltronGestureType =
  | 'IDLE'
  | 'HOVER'
  | 'PINCH'
  | 'DOUBLE_PINCH'
  | 'FIST_CLOSE'
  | 'FIST_OPEN'
  | 'OPEN_PALM_HOLD'
  | 'FLICK'
  | 'PAN'
  | 'SCROLL';

export interface UltronGestureEvent {
  type: UltronGestureType;
  timestamp: number;
  targetEntityId?: string;
  heldEntityId?: string;
  position?: Vector3D;
  direction?: Vector3D;
  delta?: { x: number; y: number };
  confidence: number;
  source: 'gesture' | 'mouse' | 'touch' | 'spatial_controller';
  rawLandmarkData?: any;
}

// Feedback System Types
export type HapticFeedbackPattern =
  | 'TICK'           // Subtle tick for hover
  | 'CLICK'          // Sharp pinch/select click
  | 'RUMBLE_START'   // Low rumble when object is grabbed
  | 'RUMBLE_STOP'
  | 'THUD'           // Release / snap into place
  | 'WHEEL'          // Continuous rolling tick for pan/scroll
  | 'CONFIRM_DOUBLE' // Summon / reset double-tap
  | 'SWIPE_BUZZ'     // Dismiss / flick
  | 'ERROR_BUZZ';    // Red / blocked / out-of-bounds error

export type ReticleVisualState =
  | 'IDLE_TRACKING'
  | 'HOVER_TARGET'
  | 'PINCH_ACTIVE'
  | 'GRAB_DRAGGING'
  | 'SUMMON_HOLD'
  | 'DISMISS_FLICK'
  | 'BIOMETRIC_SCAN'
  | 'BIOMETRIC_LOCKED'
  | 'BIOMETRIC_VERIFIED'
  | 'BIOMETRIC_DENIED'
  | 'ERROR_INVALID';

export interface BiometricTelemetryState {
  isActive: boolean;
  faceDetected: boolean;
  confidence: number;
  livenessScore: number;
  irisAlignmentPct: number;
  stepMessage: string;
  targetModule: string;
  subjectName?: string;
  faceBox?: { x: number; y: number; width: number; height: number };
}

export interface VisualFeedbackState {
  reticleState: ReticleVisualState;
  screenX: number; // 0..1 normalized or px
  screenY: number;
  hoveredEntityId: string | null;
  heldEntityId: string | null;
  targetScale: number;
  glowIntensity: number;
  highlightColor: string; // Cyan, Amber, Emerald, Rose
  hapticNoticeText?: string;
  biometricTelemetry?: BiometricTelemetryState;
}
