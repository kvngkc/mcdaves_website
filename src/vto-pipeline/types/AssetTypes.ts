// src/vto-pipeline/types/AssetTypes.ts
/**
 * Strict Schemas & Types for Scalable Eyewear GLB -> VTO Asset Pipeline.
 * Implements architectural separation between Source, VTO Derived, Calibration, and Product metadata.
 */

import { z } from 'zod';

export type AssetLifecycleStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'INSPECTED'
  | 'REVIEW_REQUIRED'
  | 'CALIBRATED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'PROCESSING_FAILED'
  | 'MANUAL_REVIEW_REQUIRED';

export type TempleProcessingMode = 'auto' | 'full' | 'shortened' | 'disabled';

export type CoordinateAxis = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Box3D {
  min: Vector3D;
  max: Vector3D;
  size: Vector3D;
  center: Vector3D;
}

export interface SceneNodeSummary {
  name: string;
  type: string;
  isMesh: boolean;
  vertexCount?: number;
  faceCount?: number;
  materialNames?: string[];
  children?: SceneNodeSummary[];
}

export interface SpatialZSlice {
  sliceIndex: number;
  zRange: [number, number];
  vertexCount: number;
  xSpan: [number, number];
  ySpan: [number, number];
  label: 'Rear Temples' | 'Mid Temples' | 'Front Hinges' | 'Front Frame / Lenses';
}

export interface DetectedFeatureRegions {
  bridge: {
    center: Vector3D;
    innerContactZ: number;
    frontZ: number;
    confidence: number;
  };
  hinges: {
    left: Vector3D;
    right: Vector3D;
    confidence: number;
  };
  temples: {
    leftExtent: [number, number]; // minZ to maxZ
    rightExtent: [number, number];
    hasSevereRearOverhang: boolean;
    recommendedCutoffRatio?: number;
    confidence: number;
  };
  frontFrame: {
    zSpan: [number, number];
    thickness: number;
  };
}

export interface AssetInspectionReport {
  assetId: string;
  fileName: string;
  fileSizeBytes: number;
  meshCount: number;
  totalVertices: number;
  totalFaces: number;
  materialNames: string[];
  textureCount: number;
  hasBonesOrSkin: boolean;
  hasMorphTargets: boolean;
  nativeBounds: Box3D;
  inferredOrientation: {
    forward: CoordinateAxis;
    up: CoordinateAxis;
    lateral: CoordinateAxis;
    confidence: number;
  };
  detectedFeatures: DetectedFeatureRegions;
  sceneHierarchy: SceneNodeSummary;
  zSlices: SpatialZSlice[];
  inspectedAt: string;
}

export interface ValidationCheckResult {
  category: 'Geometry' | 'Materials' | 'Textures' | 'Dimensions' | 'Transforms';
  name: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  details?: Record<string, unknown>;
}

export interface AssetValidationReport {
  assetId: string;
  overallStatus: 'PASS' | 'REVIEW_REQUIRED' | 'FAIL';
  checks: ValidationCheckResult[];
  summary: {
    passes: number;
    warnings: number;
    failures: number;
  };
  validatedAt: string;
}

export const OpticalDimensionsSchema = z.object({
  frameWidthMm: z.number().positive().default(124),
  lensWidthMm: z.number().positive().optional().default(52),
  bridgeWidthMm: z.number().positive().optional().default(18),
  templeLengthMm: z.number().positive().optional().default(140),
});

export const TempleProcessingProfileSchema = z.object({
  mode: z.enum(['auto', 'full', 'shortened', 'disabled']).default('auto'),
  strategy: z.string().default('preserve-visible-temple'),
  cutRatio: z.number().min(0.2).max(1.0).default(0.70), // Keep 70% of temple from hinges
  customCutZ: z.number().optional(),
  preserveFrontRims: z.boolean().default(true),
  preserveHinges: z.boolean().default(true),
});

export const BridgeRegistrationSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  z: z.number().default(0),
});

export const AssetCalibrationMetadataSchema = z.object({
  assetId: z.string(),
  name: z.string(),
  status: z.enum([
    'UPLOADED',
    'PROCESSING',
    'INSPECTED',
    'REVIEW_REQUIRED',
    'CALIBRATED',
    'APPROVED',
    'PUBLISHED',
    'PROCESSING_FAILED',
    'MANUAL_REVIEW_REQUIRED',
  ]).default('INSPECTED'),

  // Physical specs
  physicalDimensions: OpticalDimensionsSchema,

  // Exact 3D model registration
  registration: z.object({
    bridge: BridgeRegistrationSchema,
    measuredNativeWidth: z.number().positive(),
    widthMultiplier: z.number().positive().default(1.0),
    rotationOffsetEuler: z.object({
      x: z.number().default(0),
      y: z.number().default(0),
      z: z.number().default(0),
    }).default({ x: 0, y: 0, z: 0 }),
  }),

  // Orientation conventions
  orientation: z.object({
    forward: z.string().default('+Z'),
    up: z.string().default('+Y'),
    handedness: z.enum(['right-handed', 'left-handed']).default('right-handed'),
  }).default({
    forward: '+Z',
    up: '+Y',
    handedness: 'right-handed',
  }),

  // Temple processing
  templeProcessing: TempleProcessingProfileSchema,

  // Versioning & Audit trail
  versioning: z.object({
    processorVersion: z.string().default('1.0.0'),
    sourceVersion: z.number().int().positive().default(1),
    vtoVersion: z.number().int().positive().default(1),
    calibrationVersion: z.number().int().positive().default(1),
  }).default({
    processorVersion: '1.0.0',
    sourceVersion: 1,
    vtoVersion: 1,
    calibrationVersion: 1,
  }),

  // URIs for clean separation
  paths: z.object({
    sourceGlbUrl: z.string(),
    vtoGlbUrl: z.string(),
    previewImages: z.array(z.string()).default([]),
  }),

  metadataSource: z.string().default('McDaves VTO Automated Asset Ingestion Engine'),
  updatedAt: z.string(),
});

export type OpticalDimensions = z.infer<typeof OpticalDimensionsSchema>;
export type TempleProcessingProfile = z.infer<typeof TempleProcessingProfileSchema>;
export type BridgeRegistration = z.infer<typeof BridgeRegistrationSchema>;
export type AssetCalibrationMetadata = z.infer<typeof AssetCalibrationMetadataSchema>;
