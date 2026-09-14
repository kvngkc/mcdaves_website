// src/vto-lab/calibration/calibrationRegistry.ts
/**
 * Runtime calibration adapter.
 * Calibration is supplied exclusively by the published backend asset registry.
 */

import { Point3D } from '../tracking/FaceTrackingTypes';
import { globalVTOAssetRegistry } from '../../vto-pipeline/registry/VTOAssetRegistry';

export interface CalibrationEntry {
  modelId: string;
  glbPath: string;
  name: string;
  defaultFrameSize?: string;
  bridge: Point3D;
  measuredNativeWidth: number;
  widthMultiplier: number;
  source: string;
  pantoscopicTilt: number;
  useMaterialClipping: boolean;
  rotationOffsetEuler: { x: number; y: number; z: number };
}

export function getCalibrationForGlb(glbPath: string): CalibrationEntry | null {
  const metadata = globalVTOAssetRegistry.getAsset(glbPath);
  if (!metadata || metadata.status !== 'PUBLISHED') return null;

  const dims = metadata.physicalDimensions;
  const frameSizeStr =
    dims.lensWidthMm && dims.bridgeWidthMm && dims.templeLengthMm
      ? `${dims.lensWidthMm}□${dims.bridgeWidthMm}-${dims.templeLengthMm}`
      : undefined;

  const { bridge, measuredNativeWidth, widthMultiplier, rotationOffsetEuler, pantoscopicTilt } = metadata.registration;

  if (
    bridge.x == null || bridge.y == null || bridge.z == null ||
    !Number.isFinite(measuredNativeWidth) || measuredNativeWidth <= 0
  ) {
    return null;
  }

  return {
    modelId: metadata.assetId,
    glbPath: metadata.paths.vtoGlbUrl || glbPath,
    name: metadata.name,
    defaultFrameSize: frameSizeStr,
    bridge: { x: bridge.x, y: bridge.y, z: bridge.z },
    measuredNativeWidth,
    widthMultiplier,
    source: metadata.metadataSource,
    pantoscopicTilt: pantoscopicTilt ?? -12,
    useMaterialClipping: metadata.templeProcessing?.useMaterialClipping ?? false,
    rotationOffsetEuler: {
      x: rotationOffsetEuler?.x ?? 0,
      y: rotationOffsetEuler?.y ?? 0,
      z: rotationOffsetEuler?.z ?? 0,
    },
  };
}

// Kept as a compatibility export for consumers that import the registry symbol.
// It contains no local calibration data. Entries resolve from the runtime DB bridge.
export const CALIBRATION_REGISTRY: Record<string, CalibrationEntry | null> = {};

export const DEFAULT_CALIBRATION: undefined = undefined;
