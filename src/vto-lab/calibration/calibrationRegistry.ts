// src/vto-lab/calibration/calibrationRegistry.ts
/**
 * Eyewear Calibration Registry Bridge.
 * Delegates to the dynamic VTOAssetRegistry while providing backwards compatibility.
 */

import { Point3D } from '../tracking/FaceTrackingTypes';
import { globalVTOAssetRegistry } from '../../vto-pipeline/registry/VTOAssetRegistry';

export interface CalibrationEntry {
  modelId: string;
  glbPath: string;
  name: string;
  defaultFrameSize?: string;
  /**
   * Exact physical bridge contact point in the model's native coordinate system.
   * Model is translated by -bridge once during initialization.
   */
  bridge: Point3D;
  /** Verified native outer width of the GLB before scaling. */
  measuredNativeWidth: number;
  /** Width correction factor if outer mesh includes wide decorative wings. */
  widthMultiplier: number;
  source: string;
  pantoscopicTilt: number;
  useMaterialClipping: boolean;
  rotationOffsetEuler: { x: number; y: number; z: number };
}

export function getCalibrationForGlb(glbPath: string): CalibrationEntry | null {
  const metadata = globalVTOAssetRegistry.getAsset(glbPath);
  if (!metadata) return null;
  const dims = metadata.physicalDimensions;
  
  // Do not fabricate a default 52□18-140 frame size. If it's missing, it should remain undefined.
  const frameSizeStr = dims.lensWidthMm && dims.bridgeWidthMm && dims.templeLengthMm 
    ? `${dims.lensWidthMm}□${dims.bridgeWidthMm}-${dims.templeLengthMm}` 
    : undefined;

  return {
    modelId: metadata.assetId,
    glbPath: metadata.paths.vtoGlbUrl || glbPath,
    name: metadata.name,
    defaultFrameSize: frameSizeStr,
    bridge: {
      x: metadata.registration.bridge.x,
      y: metadata.registration.bridge.y,
      z: metadata.registration.bridge.z,
    },
    measuredNativeWidth: metadata.registration.measuredNativeWidth,
    widthMultiplier: metadata.registration.widthMultiplier,
    source: metadata.metadataSource,
    pantoscopicTilt: metadata.registration.pantoscopicTilt ?? -12,
    useMaterialClipping: metadata.templeProcessing?.useMaterialClipping ?? false,
    rotationOffsetEuler: {
      x: metadata.registration.rotationOffsetEuler?.x ?? 0,
      y: metadata.registration.rotationOffsetEuler?.y ?? 0,
      z: metadata.registration.rotationOffsetEuler?.z ?? 0,
    },
  };
}

export const CALIBRATION_REGISTRY: Record<string, CalibrationEntry> = {
  get '/models/glasses.glb'() {
    return getCalibrationForGlb('/models/glasses.glb')!;
  },
  get '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb'() {
    return getCalibrationForGlb('/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb')!;
  },
};

// Exported for tests only, but no longer used internally
export const DEFAULT_CALIBRATION: any = undefined;
