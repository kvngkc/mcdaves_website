// src/vto-lab/index.ts
/**
 * Isolated VTO runtime module exports.
 *
 * Storefront owns consumption only. Authoring, calibration, approval,
 * publication, and asset management live in the admin repository.
 */

export * from './tracking/FaceTrackingTypes';
export * from './camera/CameraController';
export * from './tracking/FaceLandmarker';
export * from './pose/FacePose';
export * from './pose/CoordinateTransform';
export * from './models/ModelLoader';
export * from './models/ModelCalibration';
export * from './calibration/calibrationRegistry';
