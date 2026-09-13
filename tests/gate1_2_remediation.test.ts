import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: {
    from: vi.fn(),
  },
}));

import { mapRowToVtoCalibration, mapVtoCalibrationToRow } from '@/lib/supabase/service';
import { validateVTOAssetCalibration } from '@/lib/commerce/types';
import { getCalibrationForGlb } from '@/vto-lab/calibration/calibrationRegistry';
import { globalVTOAssetRegistry } from '@/vto-pipeline/registry/VTOAssetRegistry';

describe('Gates 1 & 2 Remediation Tests', () => {
  describe('Test A & B: Server-derived evidence roundtrip and missing evidence handling', () => {
    it('should map valid rows to RawVTOAssetCalibration without inventing defaults', () => {
      const row = {
        id: '1',
        asset_id: 'asset-1',
        name: 'Test Frame',
        status: 'REVIEW_REQUIRED',
        frame_width_mm: null,
        lens_width_mm: null,
        bridge_width_mm: null,
        temple_length_mm: null,
        bridge_x: null,
        bridge_y: null,
        bridge_z: null,
        measured_native_width: null,
        width_multiplier: null,
        rotation_offset_euler: null,
        source_glb_url: '/source.glb',
        vto_glb_url: '/vto.glb',
        preview_images: [],
        metadata_source: 'Test',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      const rawCalib = mapRowToVtoCalibration(row);
      
      expect(rawCalib.frameWidthMm).toBeUndefined();
      expect(rawCalib.lensWidthMm).toBeUndefined();
      expect(rawCalib.bridge.x).toBeUndefined();
      expect(rawCalib.measuredNativeWidth).toBeUndefined();

      // Ensure it maps back to nulls for the DB
      const mappedRow = mapVtoCalibrationToRow(rawCalib);
      expect(mappedRow.frame_width_mm).toBeNull();
      expect(mappedRow.bridge_x).toBeNull();
    });

    it('should correctly promote RawVTOAssetCalibration to VTOAssetCalibration ONLY if fully specified', () => {
      const validRow = {
        id: '2',
        asset_id: 'asset-2',
        name: 'Valid Frame',
        status: 'PUBLISHED',
        frame_width_mm: 140,
        lens_width_mm: 52,
        bridge_width_mm: 18,
        temple_length_mm: 145,
        bridge_x: 0,
        bridge_y: 0.1,
        bridge_z: 0.05,
        measured_native_width: 140,
        width_multiplier: 1.0,
        rotation_offset_euler: {x:0, y:0, z:0},
        source_glb_url: '/source.glb',
        vto_glb_url: '/vto.glb',
        preview_images: [],
        metadata_source: 'Test',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      const rawCalib = mapRowToVtoCalibration(validRow);
      const validated = validateVTOAssetCalibration(rawCalib);
      expect(validated).not.toBeNull();
      expect(validated?.frameWidthMm).toBe(140);
    });

    it('should fail promotion if required fields are missing', () => {
      const invalidRow = {
        id: '3',
        asset_id: 'asset-3',
        name: 'Invalid Frame',
        status: 'REVIEW_REQUIRED',
        frame_width_mm: 140, // Has frame width
        lens_width_mm: 52,
        // missing bridge_width_mm
        temple_length_mm: 145,
        bridge_x: 0,
        bridge_y: 0.1,
        bridge_z: 0.05,
        measured_native_width: 140,
        width_multiplier: 1.0,
        source_glb_url: '/source.glb',
        vto_glb_url: '/vto.glb',
      };

      const rawCalib = mapRowToVtoCalibration(invalidRow);
      const validated = validateVTOAssetCalibration(rawCalib);
      expect(validated).toBeNull(); // Must fail
    });
  });

  describe('Test C: Registry does not manufacture default dimensions', () => {
    it('should leave frameSize string empty if physicalDimensions are incomplete', () => {
      // Mock the global registry for this test
      globalVTOAssetRegistry.registerAsset({
        assetId: 'test-asset-4',
        name: 'Incomplete Dimensions',
        physicalDimensions: {
          frameWidthMm: 130, // but missing lens/bridge/temple
          lensWidthMm: null,
          bridgeWidthMm: null,
          templeLengthMm: null
        },
        registration: {
          bridge: { x: 0, y: 0, z: 0 },
          measuredNativeWidth: 1.0,
          widthMultiplier: 1.0,
          rotationOffsetEuler: { x: 0, y: 0, z: 0 },
          pantoscopicTilt: -12
        },
        orientation: { forward: '-Z', up: 'Y', handedness: 'Right' },
        templeProcessing: { useMaterialClipping: false, depthCutoffMm: 20 },
        versioning: { revision: 1, isLatest: true },
        paths: { sourceGlbUrl: '/test.glb', vtoGlbUrl: '/test.glb' }
      } as any);

      const calibration = getCalibrationForGlb('/test.glb');
      expect(calibration).not.toBeNull();
      expect(calibration?.defaultFrameSize).toBeUndefined(); // NOT '52-18-140'
    });
  });

  describe('Test D: Renderer fail-closed behavior', () => {
    it('should return null and not invoke the model loader when calibration is invalid', async () => {
      // Mock useGLTF from drei to spy on its invocation
      const useGLTFSpy = vi.fn().mockReturnValue({ scene: {} });
      
      // Mock calibration registry to return null
      const registrySpy = vi.fn().mockReturnValue(null);
      
      // We need to isolate this require to inject our mocks
      vi.doMock('@react-three/drei', () => ({
        useGLTF: useGLTFSpy
      }));
      
      vi.doMock('@/vto-lab/calibration/calibrationRegistry', () => ({
        getCalibrationForGlb: registrySpy
      }));

      // Mock React hooks just enough to run the function body
      vi.doMock('react', async (importOriginal) => {
        const actual: any = await importOriginal();
        return {
          ...actual,
          useMemo: (fn: any) => fn(),
          useRef: (val: any) => ({ current: val }),
          useEffect: () => {},
          useState: (val: any) => [val, vi.fn()]
        };
      });

      vi.doMock('@react-three/fiber', () => ({
        useFrame: () => {}
      }));

      const { GlassesModel } = await import('@/vto-lab/models/GlassesModel');
      
      const props = {
        glbPath: '/invalid.glb',
        frameSize: ''
      };

      try {
        const result = GlassesModel(props as any);
        expect(result).toBeNull();
        expect(useGLTFSpy).not.toHaveBeenCalled();
      } finally {
        vi.resetModules();
      }
    });
  });

  describe('Test F: Incomplete evidence -> NOT PUBLISHED', () => {
    it('should reject PUBLISHED status if required calibration evidence is missing', () => {
      // If we attempt to validate an asset to become PUBLISHED, it must fail if missing evidence.
      const invalidRow = {
        id: '5',
        asset_id: 'asset-5',
        name: 'Invalid Frame for Publishing',
        status: 'PUBLISHED',
        frame_width_mm: 140,
        lens_width_mm: null, // MISSING
        bridge_width_mm: 18,
        temple_length_mm: 145,
        bridge_x: 0,
        bridge_y: 0,
        bridge_z: 0,
        measured_native_width: 140,
        width_multiplier: 1.0,
        rotation_offset_euler: {x:0, y:0, z:0},
        source_glb_url: '/s.glb',
        vto_glb_url: '/v.glb'
      };

      const rawCalib = mapRowToVtoCalibration(invalidRow);
      const validated = validateVTOAssetCalibration(rawCalib);
      expect(validated).toBeNull();
      // Therefore, it cannot be rendered or registered as PUBLISHED.
    });
  });
});
