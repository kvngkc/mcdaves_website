import { describe, expect, it } from 'vitest';
import { calculateModelScale, parseOpticalFrameWidthMm } from './ModelCalibration';

const calibration = {
  assetId: 'test-asset',
  name: 'Test Frame',
  status: 'PUBLISHED',
  physicalDimensions: { frameWidthMm: 140, lensWidthMm: 52, bridgeWidthMm: 18, templeLengthMm: 140 },
  registration: { bridge: { x: 0, y: 0, z: 0 }, measuredNativeWidth: 2, widthMultiplier: 1, rotationOffsetEuler: { x: 0, y: 0, z: 0 }, pantoscopicTilt: -12 },
  widthMultiplier: 1,
  measuredNativeWidth: 2,
  bridge: { x: 0, y: 0, z: 0 },
  glbPath: 'vto',
  modelId: 'test-asset',
  defaultFrameSize: '52□18-140',
  source: 'test',
  pantoscopicTilt: -12,
  useMaterialClipping: false,
  rotationOffsetEuler: { x: 0, y: 0, z: 0 },
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
