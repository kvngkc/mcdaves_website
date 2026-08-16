// src/vto-pipeline/registry/defaultAssets.ts
/**
 * Production Eyewear Asset Calibration Catalog.
 * Exact physical bridge contact registration and natural corneal vertex clearance.
 */

import { AssetCalibrationMetadata } from '../types/AssetTypes';

export const DEFAULT_VTO_ASSETS: Record<string, AssetCalibrationMetadata> = {
  'meshy-purple-cat-eye': {
    assetId: 'meshy-purple-cat-eye',
    name: 'Meshy Cat-Eye Purple Frame',
    status: 'APPROVED',
    physicalDimensions: {
      frameWidthMm: 124,
      lensWidthMm: 54,
      bridgeWidthMm: 16,
      templeLengthMm: 140,
    },
    registration: {
      bridge: {
        x: 0.0,
        y: 0.0836,
        z: 0.79, // Calibrated contact registration (~9.5mm front vertex clearance)
      },
      measuredNativeWidth: 2.0,
      widthMultiplier: 1.0,
      rotationOffsetEuler: { x: 0, y: 0, z: 0 },
    },
    orientation: {
      forward: '+Z',
      up: '+Y',
      handedness: 'right-handed',
    },
    templeProcessing: {
      mode: 'auto',
      strategy: 'preserve-visible-temple',
      cutRatio: 0.70,
      preserveFrontRims: true,
      preserveHinges: true,
    },
    versioning: {
      processorVersion: '1.0.0',
      sourceVersion: 1,
      vtoVersion: 2,
      calibrationVersion: 3,
    },
    paths: {
      sourceGlbUrl: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
      vtoGlbUrl: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
      previewImages: [],
    },
    metadataSource: 'Forensic vertex calibration with tuned nasal rest point.',
    updatedAt: new Date().toISOString(),
  },

  'classic-havana-glasses': {
    assetId: 'classic-havana-glasses',
    name: 'Classic Havana Acetate Frame',
    status: 'APPROVED',
    physicalDimensions: {
      frameWidthMm: 122,
      lensWidthMm: 52,
      bridgeWidthMm: 18,
      templeLengthMm: 140,
    },
    registration: {
      bridge: {
        x: 6.1627,
        y: 319.708,
        z: 240.0, // Calibrated contact registration (~9.3mm front vertex clearance)
      },
      measuredNativeWidth: 564.995,
      widthMultiplier: 1.0,
      rotationOffsetEuler: { x: 0, y: 0, z: 0 },
    },
    orientation: {
      forward: '+Z',
      up: '+Y',
      handedness: 'right-handed',
    },
    templeProcessing: {
      mode: 'full',
      strategy: 'preserve-visible-temple',
      cutRatio: 1.0,
      preserveFrontRims: true,
      preserveHinges: true,
    },
    versioning: {
      processorVersion: '1.0.0',
      sourceVersion: 1,
      vtoVersion: 2,
      calibrationVersion: 3,
    },
    paths: {
      sourceGlbUrl: '/models/glasses.glb',
      vtoGlbUrl: '/models/glasses.glb',
      previewImages: [],
    },
    metadataSource: 'Forensic vertex calibration with tuned nasal rest point.',
    updatedAt: new Date().toISOString(),
  },
};

export const FALLBACK_VTO_METADATA: AssetCalibrationMetadata = {
  assetId: 'fallback-asset',
  name: 'Standard Eyewear Frame',
  status: 'CALIBRATED',
  physicalDimensions: {
    frameWidthMm: 122,
    lensWidthMm: 52,
    bridgeWidthMm: 18,
    templeLengthMm: 140,
  },
  registration: {
    bridge: { x: 0, y: 0, z: 0 },
    measuredNativeWidth: 1.0,
    widthMultiplier: 1.0,
    rotationOffsetEuler: { x: 0, y: 0, z: 0 },
  },
  orientation: {
    forward: '+Z',
    up: '+Y',
    handedness: 'right-handed',
  },
  templeProcessing: {
    mode: 'auto',
    strategy: 'preserve-visible-temple',
    cutRatio: 0.70,
    preserveFrontRims: true,
    preserveHinges: true,
  },
  versioning: {
    processorVersion: '1.0.0',
    sourceVersion: 1,
    vtoVersion: 1,
    calibrationVersion: 1,
  },
  paths: {
    sourceGlbUrl: '',
    vtoGlbUrl: '',
    previewImages: [],
  },
  metadataSource: 'Generic fallback asset profile. Assumes model origin is centered at the bridge.',
  updatedAt: new Date().toISOString(),
};
