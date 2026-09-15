import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VTOAssetProcessor } from '../src/vto-pipeline/processor/VTOAssetProcessor';

describe('VTO processor contract', () => {
  it('does not apply an output-size gate to processing', async () => {
    const processor = new VTOAssetProcessor();
    const source = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 2), new THREE.MeshBasicMaterial());
    source.add(mesh);

    const inspection = {
      assetId: 'test-asset',
      fileName: 'test.glb',
      nativeBounds: {
        min: { x: -5, y: -2, z: -1 },
        max: { x: 5, y: 2, z: 1 },
        size: { x: 10, y: 4, z: 2 },
        center: { x: 0, y: 0, z: 0 },
      },
      detectedFeatures: {
        bridge: { center: { x: 0, y: 0, z: 0 }, innerContactZ: 0, frontZ: 0, confidence: 1 },
        hinges: { left: { x: -4, y: 0, z: 0 }, right: { x: 4, y: 0, z: 0 }, confidence: 1 },
        temples: {
          leftExtent: [-5, 0],
          rightExtent: [0, 5],
          hasSevereRearOverhang: false,
          confidence: 1,
        },
        frontFrame: { zSpan: [-1, 1], thickness: 2 },
      },
      inferredOrientation: { forward: '+Z', up: '+Y', lateral: '+X', confidence: 1 },
    } as any;
    const validation = { assetId: 'test-asset', overallStatus: 'PASS', checks: [], summary: { passes: 0, warnings: 0, failures: 0 } } as any;

    const output = await processor.processScene(source, inspection, validation, {
      physicalDimensions: {
        frameWidthMm: 140,
        lensWidthMm: 52,
        bridgeWidthMm: 18,
        templeLengthMm: 140,
      },
    });

    expect(output.vtoScene.scale.x).toBeCloseTo(1.4, 6);
  });

  it('rejects processing without authoritative physical dimensions', async () => {
    const processor = new VTOAssetProcessor();
    const source = new THREE.Group();
    const inspection = {
      assetId: 'test-asset',
      fileName: 'test.glb',
      nativeBounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 4, z: 2 }, size: { x: 10, y: 4, z: 2 }, center: { x: 5, y: 2, z: 1 } },
      detectedFeatures: {
        bridge: { center: { x: 5, y: 2, z: 1 }, innerContactZ: 1, frontZ: 1.2, confidence: 1 },
        hinges: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 }, confidence: 1 },
        temples: { leftExtent: [0, 1], rightExtent: [0, 1], hasSevereRearOverhang: false, confidence: 1 },
        frontFrame: { zSpan: [0, 1], thickness: 1 },
      },
      inferredOrientation: { forward: '+Z', up: '+Y', lateral: '+X', confidence: 1 },
    } as any;
    const validation = { assetId: 'test-asset', overallStatus: 'PASS', checks: [], summary: { passes: 0, warnings: 0, failures: 0 } } as any;

    await expect(processor.processScene(source, inspection, validation)).rejects.toThrow(/Physical dimensions are required/);
  });
});
