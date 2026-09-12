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
  defaultFrameSize: string;
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

export function getCalibrationForGlb(glbPath: string): CalibrationEntry {
  const metadata = globalVTOAssetRegistry.getAsset(glbPath);
  const dims = metadata.physicalDimensions;
  const frameSizeStr = `${dims.lensWidthMm || 52}□${dims.bridgeWidthMm || 18}-${dims.templeLengthMm || 140}`;

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
    return getCalibrationForGlb('/models/glasses.glb');
  },
  get '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb'() {
    return getCalibrationForGlb('/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb');
  },
};

export const DEFAULT_CALIBRATION: CalibrationEntry = {
  modelId: 'default',
  glbPath: '',
  name: 'Default Frame',
  defaultFrameSize: '52□18-140',
  bridge: { x: 0, y: 0, z: 0 },
  measuredNativeWidth: 1.0,
  widthMultiplier: 1.0,
  source: 'Fallback entry. Assumes model origin is centered at the nose bridge.',
  pantoscopicTilt: -12,
  useMaterialClipping: false,
  rotationOffsetEuler: { x: 0, y: 0, z: 0 },
};
