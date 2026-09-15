import { describe, expect, it } from 'vitest';
import { calculateModelScale, parseOpticalFrameWidthMm } from './ModelCalibration';

const calibration = {
  assetId: 'test-asset',
  name: 'Test Frame',
  status: 'PUBLISHED',
  physicalDimensions: { frameWidthMm: 140, lensWidthMm: 52, bridgeWidthMm: 18, templeLengthMm: 140 },
  registration: { bridge: { x: 0, y: 0, z: 0 }, measuredNativeWidth: 2, widthMultiplier: 1, rotationOffsetEuler: { x: 0, y: 0, z: 0 }, pantoscopicTilt: -12 },
  orientation: { forward: '+Z', up: '+Y', handedness: 'right-handed' },
  templeProcessing: { mode: 'auto', strategy: 'preserve-visible-temple', cutRatio: 0.7, preserveFrontRims: true, preserveHinges: true, useMaterialClipping: false },
  versioning: { processorVersion: '1.0.0', sourceVersion: 1, vtoVersion: 1, calibrationVersion: 1 },
  paths: { sourceGlbUrl: 'source', vtoGlbUrl: 'vto', previewImages: [] },
  metadataSource: 'test',
  updatedAt: new Date().toISOString(),
} as any;

describe('ModelCalibration', () => {
  it('parses boxing notation only as display metadata', () => {
    expect(parseOpticalFrameWidthMm('52□18-140')).toBe(122);
    expect(parseOpticalFrameWidthMm('')).toBeNull();
  });

  it('uses authoritative physical frame width for VTO scale', () => {
    const result = calculateModelScale('52□18-140', 2, calibration);
    expect(result.physicalWidthMm).toBe(140);
    expect(result.scale).toBe(7);
  });

  it('refuses scaling when physical calibration is missing', () => {
    const result = calculateModelScale('52□18-140', 2, { ...calibration, physicalDimensions: { ...calibration.physicalDimensions, frameWidthMm: null } });
    expect(result.scale).toBe(0);
    expect(result.physicalWidthMm).toBe(0);
  });
});
