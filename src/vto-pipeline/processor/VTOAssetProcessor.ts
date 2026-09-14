// src/vto-pipeline/processor/VTOAssetProcessor.ts
/**
 * Orchestrating VTO Asset Preprocessor.
 * Transforms raw eyewear GLB assets into calibrated, VTO-ready derived assets
 * without ever mutating the original source file.
 */

import * as THREE from 'three';
import { GLTFExporter, GLTFLoader } from 'three-stdlib';
import { mergeVertices } from 'three-stdlib/utils/BufferGeometryUtils';
import { AssetInspector } from '../inspector/AssetInspector';
import { AssetValidator } from '../validator/AssetValidator';
import { TempleProcessor } from './TempleProcessor';
import {
  AssetCalibrationMetadata,
  AssetInspectionReport,
  AssetValidationReport,
  BridgeRegistration,
  OpticalDimensions,
  TempleProcessingProfile,
} from '../types/AssetTypes';

export const VTO_OUTPUT_SIZE_LIMITS = {
  passBytes: 2 * 1024 * 1024,
  reviewBytes: 3 * 1024 * 1024,
} as const;

export type VTOOutputSizeStatus = 'PASS' | 'REVIEW_REQUIRED' | 'FAIL';

export function classifyVTOOutputSize(sizeBytes: number): VTOOutputSizeStatus {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) throw new Error(`Invalid VTO output size: ${sizeBytes}`);
  if (sizeBytes < VTO_OUTPUT_SIZE_LIMITS.passBytes) return 'PASS';
  if (sizeBytes <= VTO_OUTPUT_SIZE_LIMITS.reviewBytes) return 'REVIEW_REQUIRED';
  return 'FAIL';
}

export interface VTOProcessingOptions {
  assetId?: string;
  name?: string;
  /** Physical dimensions must come from authoritative product/variant data. */
  physicalDimensions?: Partial<OpticalDimensions>;
  customBridge?: Partial<BridgeRegistration>;
  templeProcessing?: Partial<TempleProcessingProfile>;
  sourceVersion?: number;
  vtoVersion?: number;
}

export interface VTOProcessingOutput {
  assetId: string;
  metadata: AssetCalibrationMetadata;
  inspectionReport: AssetInspectionReport;
  validationReport: AssetValidationReport;
  vtoScene: THREE.Group;
  vtoGlbBuffer?: ArrayBuffer;
}

function requirePhysicalDimensions(dimensions: Partial<OpticalDimensions> | undefined): OpticalDimensions {
  const required: Array<keyof OpticalDimensions> = ['frameWidthMm', 'lensWidthMm', 'bridgeWidthMm', 'templeLengthMm'];
  if (!dimensions || required.some((key) => dimensions[key] == null)) {
    throw new Error('Physical dimensions are required for VTO processing. Provide frame, lens, bridge, and temple dimensions from the authoritative product/variant record.');
  }
  const values = dimensions as OpticalDimensions;
  for (const key of required) {
    const value = values[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error('Physical dimensions must be finite positive millimetre values.');
  }
  return values;
}

/** Conservative geometry optimization. It only merges equivalent vertex attributes. */
function optimizeGeometry(scene: THREE.Object3D): { sourceVertices: number; outputVertices: number } {
  let sourceVertices = 0;
  let outputVertices = 0;
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.geometry) return;
    const position = object.geometry.getAttribute('position');
    if (!position) return;
    sourceVertices += position.count;
    const optimized = mergeVertices(object.geometry, 1e-4);
    optimized.computeBoundingBox();
    optimized.computeBoundingSphere();
    object.geometry = optimized;
    outputVertices += optimized.getAttribute('position')?.count ?? position.count;
  });
  return { sourceVertices, outputVertices };
}

export class VTOAssetProcessor {
  private inspector: AssetInspector;
  private validator: AssetValidator;
  private templeProcessor: TempleProcessor;
  private loader: GLTFLoader;

  constructor() {
    this.inspector = new AssetInspector();
    this.validator = new AssetValidator();
    this.templeProcessor = new TempleProcessor();
    this.loader = new GLTFLoader();
  }

  public async processGlbBuffer(sourceBuffer: ArrayBuffer, fileName: string, options: VTOProcessingOptions = {}, exportGlb = false): Promise<VTOProcessingOutput> {
    const assetId = options.assetId || fileName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const inspectionReport = await this.inspector.inspectBuffer(sourceBuffer, fileName, assetId);
    const validationReport = this.validator.validate(inspectionReport);
    if (validationReport.overallStatus === 'FAIL') throw new Error(`Asset validation failed: ${validationReport.checks.filter((c) => c.status === 'FAIL').map((c) => c.message).join('; ')}`);

    const sourceScene = await new Promise<THREE.Group>((resolve, reject) => {
      this.loader.parse(sourceBuffer, '', (gltf) => resolve(gltf.scene as THREE.Group), (err) => reject(new Error(`Failed to parse source GLB: ${err}`)));
    });
    return this.processScene(sourceScene, inspectionReport, validationReport, options, exportGlb);
  }

  public async processScene(sourceScene: THREE.Object3D, inspection: AssetInspectionReport, validation: AssetValidationReport, options: VTOProcessingOptions = {}, exportGlb = false): Promise<VTOProcessingOutput> {
    const assetId = inspection.assetId;
    const name = options.name || inspection.fileName.replace(/\.[^/.]+$/, '');
    const vtoSceneClone = sourceScene.clone(true);
    vtoSceneClone.updateMatrixWorld(true);
    const physicalDimensions = requirePhysicalDimensions(options.physicalDimensions);

    const nativeWidth = inspection.nativeBounds.size.x > 0 ? inspection.nativeBounds.size.x : 1.0;
    const scaleFactor = (physicalDimensions.frameWidthMm / 10) / nativeWidth;
    const detectedBridge = inspection.detectedFeatures.bridge;
    const bridgeRegistration: BridgeRegistration = {
      x: options.customBridge?.x ?? detectedBridge.center.x,
      y: options.customBridge?.y ?? detectedBridge.center.y,
      z: options.customBridge?.z ?? detectedBridge.innerContactZ,
    };

    const templeProfile: TempleProcessingProfile = {
      mode: options.templeProcessing?.mode ?? (inspection.detectedFeatures.temples.hasSevereRearOverhang ? 'auto' : 'full'),
      strategy: options.templeProcessing?.strategy ?? 'preserve-visible-temple',
      cutRatio: options.templeProcessing?.cutRatio ?? 0.70,
      customCutZ: options.templeProcessing?.customCutZ,
      preserveFrontRims: true,
      preserveHinges: true,
    };

    const templeResult = this.templeProcessor.processTemples(vtoSceneClone, inspection, templeProfile);
    const vtoRoot = new THREE.Group();
    vtoRoot.name = `VTO_Asset_${assetId}`;
    templeResult.processedScene.position.set(-bridgeRegistration.x, -bridgeRegistration.y, -bridgeRegistration.z);
    vtoRoot.add(templeResult.processedScene);
    vtoRoot.scale.setScalar(scaleFactor);
    vtoRoot.updateMatrixWorld(true);

    const geometryOptimization = optimizeGeometry(vtoRoot);
    vtoRoot.updateMatrixWorld(true);

    const metadata: AssetCalibrationMetadata = {
      assetId,
      name,
      status: validation.overallStatus === 'PASS' ? 'CALIBRATED' : 'REVIEW_REQUIRED',
      physicalDimensions,
      registration: {
        bridge: bridgeRegistration,
        measuredNativeWidth: nativeWidth,
        widthMultiplier: 1.0,
        rotationOffsetEuler: { x: 0, y: 0, z: 0 },
      },
      orientation: { forward: inspection.inferredOrientation.forward, up: inspection.inferredOrientation.up, handedness: 'right-handed' },
      templeProcessing: templeProfile,
      versioning: { processorVersion: '1.2.0', sourceVersion: options.sourceVersion ?? 1, vtoVersion: options.vtoVersion ?? 1, calibrationVersion: 1 },
      paths: {
        sourceGlbUrl: `/assets/eyewear/${assetId}/source/${inspection.fileName}`,
        vtoGlbUrl: `/assets/eyewear/${assetId}/vto/optimized.glb`,
        previewImages: [],
      },
      metadataSource: `McDaves VTO Automated Asset Pipeline (Temple mode: ${templeResult.modeApplied}; geometry vertices ${geometryOptimization.sourceVertices}→${geometryOptimization.outputVertices})`,
      updatedAt: new Date().toISOString(),
    };

    let vtoGlbBuffer: ArrayBuffer | undefined;
    if (exportGlb) vtoGlbBuffer = await this.exportToGlb(vtoRoot);
    return { assetId, metadata, inspectionReport: inspection, validationReport: validation, vtoScene: vtoRoot, vtoGlbBuffer };
  }

  public async exportToGlb(scene: THREE.Object3D): Promise<ArrayBuffer> {
    const exporter = new GLTFExporter();
    return new Promise((resolve, reject) => {
      exporter.parse(scene, (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else new Blob([JSON.stringify(result)], { type: 'application/json' }).arrayBuffer().then(resolve).catch(reject);
      }, (error) => reject(new Error(`Failed to export GLB: ${error}`)), { binary: true });
    });
  }
}

export const defaultVTOAssetProcessor = new VTOAssetProcessor();
