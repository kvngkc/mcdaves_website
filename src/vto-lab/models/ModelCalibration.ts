// src/vto-lab/models/ModelCalibration.ts
/**
 * Physical Scale & Calibration Calculator.
 * Uses authoritative physical frame width from the published calibration record.
 * Frame-size notation is display metadata only and is never used as a fallback truth source.
 */

import { CalibrationEntry } from '../calibration/calibrationRegistry';

/**
 * Parses standard optical boxing notation: [Lens Width]□[Bridge Width]-[Temple Length].
 * This helper is retained for display/diagnostic compatibility only.
 */
export function parseOpticalFrameWidthMm(frameSize: string): number | null {
  if (!frameSize) return null;

  const clean = frameSize
    .replace(/[\u25A1\u2B1C\u2610\u25FB\u25FC\u25FD\u25FE\s]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const parts = clean.split('-').map(Number);
  if (parts.length < 2 || parts.slice(0, 2).some((v) => !Number.isFinite(v) || v <= 0)) return null;

  return parts[0] * 2 + parts[1];
}

export function calculateModelScale(
  frameSize: string,
  nativeModelWidth: number,
  calibration: CalibrationEntry,
): {
  scale: number;
  physicalWidthCm: number;
  physicalWidthMm: number;
} {
  void frameSize;
  const physicalWidthMm = calibration.physicalDimensions.frameWidthMm;
  if (!physicalWidthMm || physicalWidthMm <= 0 || nativeModelWidth <= 0) {
    return { scale: 0, physicalWidthCm: 0, physicalWidthMm: 0 };
  }

  const physicalWidthCm = physicalWidthMm / 10;
  const scale = (physicalWidthCm / nativeModelWidth) * calibration.widthMultiplier;

  return { scale, physicalWidthCm, physicalWidthMm };
}
