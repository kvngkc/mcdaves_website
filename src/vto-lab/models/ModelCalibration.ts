// src/vto-lab/models/ModelCalibration.ts
/**
 * Physical Scale & Calibration Calculator.
 * Frame dimensions are supplied by the published DB calibration metadata.
 */

import { CalibrationEntry } from '../calibration/calibrationRegistry';

export function parseOpticalFrameWidthMm(frameSize: string): number | null {
  if (!frameSize) return null;
  const match = frameSize.match(/(\d+(?:\.\d+)?)\s*[□x×*]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  const lensWidth = Number(match[1]);
  const bridgeWidth = Number(match[2]);
  if (!Number.isFinite(lensWidth) || !Number.isFinite(bridgeWidth) || lensWidth <= 0 || bridgeWidth <= 0) return null;
  return lensWidth * 2 + bridgeWidth;
}

export function calculateModelScale(
  frameSize: string,
  nativeModelWidth: number,
  calibration: CalibrationEntry,
): { scale: number; physicalWidthCm: number; physicalWidthMm: number } {
  const parsedMm = parseOpticalFrameWidthMm(frameSize);
  const physicalWidthMm = parsedMm ?? calibration.physicalWidthMm ?? 0;
  const physicalWidthCm = physicalWidthMm / 10;

  if (!physicalWidthMm || nativeModelWidth <= 0) {
    return { scale: 1.0, physicalWidthCm, physicalWidthMm };
  }

  return {
    scale: (physicalWidthCm / nativeModelWidth) * calibration.widthMultiplier,
    physicalWidthCm,
    physicalWidthMm,
  };
}
