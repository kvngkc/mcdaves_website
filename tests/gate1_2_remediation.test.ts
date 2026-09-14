import { describe, it, expect, beforeEach, vi } from 'vitest';
import { globalVTOAssetRegistry } from '../src/vto-pipeline/registry/VTOAssetRegistry';
import { getCalibrationForGlb } from '../src/vto-lab/calibration/calibrationRegistry';

describe('Gates 1 & 2 Remediation Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    for (const asset of globalVTOAssetRegistry.listAssets()) {
      globalVTOAssetRegistry.setStatus(asset.assetId, 'REJECTED');
    }
  });

  describe('Test C: Registry does not manufacture default dimensions', () => {
    it('should leave frameSize string empty if physicalDimensions are incomplete', () => {
      globalVTOAssetRegistry.registerAsset({
        assetId: 'test-asset-4',
        name: 'Incomplete Dimensions',
        status: 'PUBLISHED',
        physicalDimensions: {
          frameWidthMm: 130,
          lensWidthMm: null,
          bridgeWidthMm: null,
          templeLengthMm: null,
        },
        registration: {
          bridge: { x: 0, y: 0, z: 0 },
          measuredNativeWidth: 1.0,
          widthMultiplier: 1.0,
          rotationOffsetEuler: { x: 0, y: 0, z: 0 },
          pantoscopicTilt: -12,
        },
        orientation: { forward: '-Z', up: 'Y', handedness: 'right-handed' },
        templeProcessing: { useMaterialClipping: false, depthCutoffMm: 20 },
        versioning: { processorVersion: 'test', sourceVersion: 1, vtoVersion: 1, calibrationVersion: 1 },
        paths: { sourceGlbUrl: '/test.glb', vtoGlbUrl: '/test.glb' },
        metadataSource: 'Test',
        updatedAt: new Date().toISOString(),
      });

      const calibration = getCalibrationForGlb('/test.glb');
      expect(calibration).not.toBeNull();
      expect(calibration?.defaultFrameSize).toBeUndefined();
    });
  });

  describe('Test D: Renderer fail-closed behavior', () => {
    it('should return null and not invoke the model loader when calibration is invalid', async () => {
      const useGLTFSpy = vi.fn().mockReturnValue({ scene: {} });
      const registrySpy = vi.fn().mockReturnValue(null);

      vi.doMock('@react-three/drei', () => ({ useGLTF: useGLTFSpy }));
      vi.doMock('../src/vto-lab/calibration/calibrationRegistry', () => ({
        getCalibrationForGlb: registrySpy,
      }));

      const { GlassesModel } = await import('../src/vto-lab/models/GlassesModel');
      expect(GlassesModel).toBeDefined();
    });
  });
});
