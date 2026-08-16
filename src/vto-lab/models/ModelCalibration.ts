// src/vto-lab/models/ModelCalibration.ts
/**
 * Physical Scale & Calibration Calculator.
 * Converts standard optical frame notations (e.g. 52□18-140) into physical centimeters
 * and calculates the exact 3D scaling factor.
 */

import { CalibrationEntry } from '../calibration/calibrationRegistry';

/**
 * Parses standard optical boxing notation: [Lens Width]□[Bridge Width]-[Temple Length]
 * Total front frame width (mm) = Lens Width * 2 + Bridge Width
 */
export function parseOpticalFrameWidthMm(frameSize: string): number | null {
  if (!frameSize) return null;

  // Handle various square / box unicode characters or hyphens/spaces
  const clean = frameSize
    .replace(/[\u25A1\u2B1C\u2610\u25FB\u25FC\u25FD\u25FE\s]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const parts = clean.split('-').map(Number);
  if (
    parts.length < 2 ||
    parts.slice(0, 2).some((v) => !Number.isFinite(v) || v <= 0)
  ) {
    return null;
  }

  const lensWidth = parts[0];
  const bridgeWidth = parts[1];
  return lensWidth * 2 + bridgeWidth;
}

/**
 * Computes the Three.js metric scale factor for an eyewear GLB model.
 *
 * @param frameSize - Optical frame notation (e.g. "52□18-140")
 * @param nativeModelWidth - Measured outer bounding box width in GLB units
 * @param calibration - Asset calibration entry containing width multiplier
 * @returns Metric scale factor (in centimeters)
 */
export function calculateModelScale(
  frameSize: string,
  nativeModelWidth: number,
  calibration: CalibrationEntry,
): {
  scale: number;
  physicalWidthCm: number;
  physicalWidthMm: number;
} {
  const parsedMm = parseOpticalFrameWidthMm(frameSize) ?? 122; // default 122mm
  const physicalWidthCm = parsedMm / 10; // convert mm to cm

  if (nativeModelWidth <= 0) {
    return {
      scale: 1.0,
      physicalWidthCm,
      physicalWidthMm: parsedMm,
    };
  }

  const scale = (physicalWidthCm / nativeModelWidth) * calibration.widthMultiplier;

  return {
    scale,
    physicalWidthCm,
    physicalWidthMm: parsedMm,
  };
}
