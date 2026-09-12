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

// Z is pushed back to 4.436 (from 5.236) to account for origin vs sellion gap
export const CANONICAL_NOSE_BRIDGE = new Vector3(0.0, 3.271027, 4.436015);
const _m = new Matrix4();
const _rawPos = new Vector3();
const _rawQuat = new Quaternion();
const _rawScale = new Vector3();
const _bridgeInCamera = new Vector3();
const _euler = new Euler();
const _mirroredEuler = new Euler();

const _outPosition = new Vector3();
const _outQuaternion = new Quaternion();

// Cached return object to prevent allocation per frame
const _poseResult = {
  position: _outPosition,
  quaternion: _outQuaternion,
  scale: _rawScale,
  euler: _mirroredEuler,
};

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
  _m.fromArray(faceMatrix);
  _m.decompose(_rawPos, _rawQuat, _rawScale);

  // Compute the transformed bridge landmark (landmark 168) in camera space:
  _bridgeInCamera.copy(CANONICAL_NOSE_BRIDGE).applyMatrix4(_m);

  _euler.setFromQuaternion(_rawQuat, 'YXZ');

  _outPosition.set(
    mirrored ? -_bridgeInCamera.x : _bridgeInCamera.x,
    _bridgeInCamera.y,
    _bridgeInCamera.z,
  );

  // Reflect rotation across Y-Z plane for selfie mirror presentation:
  // Pitch (nodding up/down) is preserved
  // Yaw (turning left/right) is negated
  // Roll (head tilt) is negated
  _mirroredEuler.set(
    _euler.x,
    mirrored ? -_euler.y : _euler.y,
    mirrored ? -_euler.z : _euler.z,
    'YXZ',
  );

  _outQuaternion.setFromEuler(_mirroredEuler);

  return _poseResult;
}
