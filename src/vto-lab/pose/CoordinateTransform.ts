// src/vto-lab/pose/CoordinateTransform.ts
/**
 * Metric Coordinate Transformation pipeline.
 *
 * MediaPipe Canonical Face Model (Centimeters):
 * - Origin: Center of head mass
 * - +X: Subject's Left (our right looking at face)
 * - +Y: Forehead Up
 * - +Z: Nose Tip Forward (toward camera)
 *
 * MediaPipe Metric Camera Space (Centimeters):
 * - Origin: Virtual Perspective Camera at (0, 0, 0)
 * - +X: Camera Right
 * - +Y: Camera Up
 * - -Z: Forward into the scene (Camera looks down -Z)
 * - Face translation Z is negative (e.g. -45cm to -65cm)
 *
 * Three.js World Space (Centimeters):
 * - Camera placed at (0, 0, 0) looking down -Z
 * - 1 Three.js unit = 1 centimeter
 *
 * Canonical Landmark 168 (Nose Bridge / Sellion):
 * - Coordinates: (0.0, 3.271027, 5.236015) cm
 */

import { Matrix4, Quaternion, Vector3, Euler } from 'three';

export const CANONICAL_NOSE_BRIDGE = new Vector3(0.0, 3.271027, 5.236015);

/**
 * Calculates the metric camera-space nose bridge position and rotation quaternion.
 * When `mirrored = true` (selfie mode), reflects X position, yaw, and roll so that
 * turning in the selfie mirror preserves 3D depth and correctly wraps the temples.
 */
export function getMetricBridgePose(
  faceMatrix: Float32Array,
  mirrored = true,
): {
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
  euler: Euler;
} {
  const m = new Matrix4().fromArray(faceMatrix);
  const rawPos = new Vector3();
  const rawQuat = new Quaternion();
  const rawScale = new Vector3();
  m.decompose(rawPos, rawQuat, rawScale);

  // Compute the transformed bridge landmark (landmark 168) in camera space:
  const bridgeInCamera = CANONICAL_NOSE_BRIDGE.clone().applyMatrix4(m);

  const euler = new Euler().setFromQuaternion(rawQuat, 'YXZ');

  const position = new Vector3(
    mirrored ? -bridgeInCamera.x : bridgeInCamera.x,
    bridgeInCamera.y,
    bridgeInCamera.z,
  );

  // Reflect rotation across Y-Z plane for selfie mirror presentation:
  // Pitch (nodding up/down) is preserved
  // Yaw (turning left/right) is negated
  // Roll (head tilt) is negated
  const mirroredEuler = new Euler(
    euler.x,
    mirrored ? -euler.y : euler.y,
    mirrored ? -euler.z : euler.z,
    'YXZ',
  );

  const quaternion = new Quaternion().setFromEuler(mirroredEuler);

  return {
    position,
    quaternion,
    scale: rawScale,
    euler: mirroredEuler,
  };
}
