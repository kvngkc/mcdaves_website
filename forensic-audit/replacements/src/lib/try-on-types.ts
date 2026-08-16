// src/lib/try-on-types.ts
/**
 * Core domain types for the McDaves Virtual Try-On engine.
 *
 * Coordinate conventions:
 * - MediaPipe landmarks: normalized image coordinates, X right, Y down, Z relative depth.
 * - MediaPipe face transform: metric 3D camera space, right-handed, camera at origin looking -Z.
 * - Three.js VTO scene: same metric camera space, Y up, camera at origin looking -Z.
 */

import { Product } from '@/lib/types';

export type TryOnState =
  | 'idle'
  | 'requesting_permission'
  | 'loading_model'
  | 'detecting_face'
  | 'tracking'
  | 'face_lost'
  | 'photo_fallback'
  | 'carousel_fallback';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface HeadPose {
  pitch: number;
  yaw: number;
  roll: number;
  translation: Point3D;
}

export interface NormalizedLandmarks {
  noseBridge: Point3D;
  leftPupil: Point3D;
  rightPupil: Point3D;
  leftTemple: Point3D;
  rightTemple: Point3D;
  ipdPixels: number;
  pose: HeadPose;
  confidence: number;
}

export interface Glasses2DTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface GlassesTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface Glasses3DTransform {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  scale: number;
}

export interface FaceDetectionResult {
  /** MediaPipe facial transformation matrix, column-major 4x4 matrix data. */
  faceMatrix: Float32Array | null;
  /** Landmark data in source-video pixel coordinates. */
  landmarks: NormalizedLandmarks;
  /** Source video dimensions used for the landmark pixel conversion. */
  videoWidth: number;
  videoHeight: number;
  /** MediaPipe face presence / tracking confidence when available. */
  confidence: number;
}

export interface UseCameraReturn {
  stream: MediaStream | null;
  error: Error | null;
  isInitializing: boolean;
  startCamera: () => Promise<MediaStream>;
  stopCamera: () => void;
}

export type TryOnErrorType =
  | 'CAMERA_PERMISSION_DENIED'
  | 'MODEL_LOAD_FAILED'
  | 'FACE_DETECTION_FAILED'
  | 'FACE_LOST_TIMEOUT'
  | 'RENDER_LOOP_CRASH'
  | 'OVERLAY_IMAGE_FAILED';

export interface TryOnErrorReport {
  type: TryOnErrorType;
  timestamp: number;
  sessionId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType?: string;
  userAgent: string;
}

export interface TryOnShellProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  initialTier?: 'auto' | 'photo' | 'carousel';
}

export interface PermissionGateProps {
  onGrant: (stream: MediaStream) => void;
  onDeny: (error: Error) => void;
  onSelectPhotoFallback: () => void;
  onRequestCamera?: () => Promise<MediaStream>;
}

export interface CameraFeedProps {
  stream: MediaStream | null;
  onVideoReady: (videoElement: HTMLVideoElement) => void;
  onStreamError: (error: Error) => void;
  mirrored?: boolean;
}

export interface AlignmentGuideProps {
  state: TryOnState;
  confidence: number;
  onSwitchToPhoto: () => void;
}

export interface PhotoFallbackProps {
  product: Product;
  onCaptureSnapshot: (dataUrl: string) => void;
  onClose: () => void;
}
