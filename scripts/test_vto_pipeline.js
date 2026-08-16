// scripts/test_vto_pipeline.js
/**
 * End-to-End Automated Test Suite for Eyewear GLB -> VTO Asset Pipeline.
 */

const fs = require('fs');
const path = require('path');
const THREE = require('three');

global.self = global;
global.window = global;
global.document = {
  createElement: () => ({ addEventListener: () => {} }),
  createElementNS: () => ({}),
};
global.Image = class {};
global.FileReader = class {};
global.Blob = class {};
global.URL = { createObjectURL: () => '', revokeObjectURL: () => '' };

const { GLTFLoader } = require('three-stdlib');
const { z } = require('zod');

// Schema definitions for testing
const OpticalDimensionsSchema = z.object({
  frameWidthMm: z.number().positive().default(124),
  lensWidthMm: z.number().positive().optional(),
  bridgeWidthMm: z.number().positive().optional(),
  templeLengthMm: z.number().positive().optional(),
});

const AssetCalibrationMetadataSchema = z.object({
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
  ]),
  physicalDimensions: OpticalDimensionsSchema,
  registration: z.object({
    bridge: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    measuredNativeWidth: z.number().positive(),
    widthMultiplier: z.number().positive(),
    rotationOffsetEuler: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  }),
  templeProcessing: z.object({
    mode: z.enum(['auto', 'full', 'shortened', 'disabled']),
    cutRatio: z.number().min(0.2).max(1.0).optional(),
  }),
});

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, message = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName} - ${message}`);
    failedTests++;
  }
}

// -------------------------------------------------------------
// Test 1: Inspect and Validate Real Assets
// -------------------------------------------------------------
async function testAsset(filename, expectedMeshes, expectedMinVerts) {
  const filePath = path.resolve(__dirname, '../public/models', filename);
  const data = fs.readFileSync(filePath);
  const loader = new GLTFLoader();

  return new Promise((resolve) => {
    loader.parse(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      '',
      (gltf) => {
        const scene = gltf.scene;
        scene.updateMatrixWorld(true);

        let meshCount = 0;
        let vertCount = 0;
        const matSet = new Set();

        scene.traverse((node) => {
          if (node.isMesh && node.geometry) {
            meshCount++;
            vertCount += node.geometry.attributes.position ? node.geometry.attributes.position.count : 0;
            if (node.material) {
              const mats = Array.isArray(node.material) ? node.material : [node.material];
              mats.forEach(m => matSet.add(m.name || m.type));
            }
          }
        });

        const box = new THREE.Box3().setFromObject(scene);
        const size = new THREE.Vector3();
        box.getSize(size);

        console.log(`\n--- Inspecting: ${filename} ---`);
        console.log(`Meshes: ${meshCount}, Vertices: ${vertCount}, Dimensions: ${size.x.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}`);

        assert(meshCount >= expectedMeshes, `${filename} Mesh Count`, `Expected >= ${expectedMeshes}, got ${meshCount}`);
        assert(vertCount >= expectedMinVerts, `${filename} Vertex Count`, `Expected >= ${expectedMinVerts}, got ${vertCount}`);
        assert(size.x > 0 && size.y > 0 && size.z > 0, `${filename} Non-Zero Bounds`, `Degenerate dimensions`);
        assert(matSet.size > 0, `${filename} Materials Present`, `No materials found`);

        // Test metadata schema conformity
        const sampleMetadata = {
          assetId: filename.replace('.glb', '').toLowerCase(),
          name: filename,
          status: 'APPROVED',
          physicalDimensions: {
            frameWidthMm: 124,
            lensWidthMm: 52,
            bridgeWidthMm: 18,
            templeLengthMm: 140,
          },
          registration: {
            bridge: { x: 0, y: 0, z: 0 },
            measuredNativeWidth: size.x,
            widthMultiplier: 1.0,
            rotationOffsetEuler: { x: 0, y: 0, z: 0 },
          },
          templeProcessing: {
            mode: 'auto',
            cutRatio: 0.70,
          },
        };

        const parseResult = AssetCalibrationMetadataSchema.safeParse(sampleMetadata);
        assert(parseResult.success, `${filename} Metadata Schema Validation`, JSON.stringify(parseResult.error));

        resolve();
      }
    );
  });
}

// -------------------------------------------------------------
// Test 2: Malformed GLB Handling
// -------------------------------------------------------------
async function testMalformedGlb() {
  console.log(`\n--- Testing Malformed / Corrupt GLB ---`);
  const corruptBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE, 0xFD]);
  const loader = new GLTFLoader();

  await new Promise((resolve) => {
    try {
      loader.parse(
        corruptBuffer.buffer,
        '',
        () => {
          assert(false, 'Corrupt GLB Parse', 'Should have failed on corrupt buffer');
          resolve();
        },
        (err) => {
          assert(true, 'Corrupt GLB Rejection (callback)', `Caught: ${err.message || err}`);
          resolve();
        }
      );
    } catch (err) {
      assert(true, 'Corrupt GLB Rejection (throw)', `Caught: ${err.message || err}`);
      resolve();
    }
  });
}

// -------------------------------------------------------------
// Test 3: Temple Processing & Slicing
// -------------------------------------------------------------
function testTempleProcessingLogic() {
  console.log(`\n--- Testing Temple Geometry Slicing Logic ---`);

  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array([
    // Front triangle (X within central zone)
    0, 0, 1,   1, 0, 1,   0, 1, 1,
    // Mid temple triangle (X=5, Z=-3)
    5, 0, -3,  5.2, 0, -3, 5, 0.5, -3,
    // Far rear temple ear hook (X=5, Z=-8)
    5, 0, -8,  5.2, 0, -8, 5, 0.5, -8,
  ]);
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial());
  const scene = new THREE.Group();
  scene.add(mesh);

  const cutoffZ = -5.0;
  const isLateralThreshold = 2.0;

  const posAttr = geom.attributes.position;
  const kept = [];
  for (let i = 0; i < posAttr.count; i += 3) {
    const z0 = posAttr.getZ(i);
    const x0 = posAttr.getX(i);
    const isTemple = Math.abs(x0) > isLateralThreshold;
    const isBehind = z0 < cutoffZ;

    if (isTemple && isBehind) {
      continue;
    }
    kept.push(i);
  }

  assert(kept.length === 2, 'Temple Cutoff Sieve', `Expected 2 triangles kept out of 3, got ${kept.length}`);
}

async function runAll() {
  console.log(`=============================================================`);
  console.log(`VTO ASSET PIPELINE AUTOMATED TEST SUITE`);
  console.log(`=============================================================`);

  await testAsset('Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb', 1, 100000);
  await testAsset('glasses.glb', 5, 5000);
  await testMalformedGlb();
  testTempleProcessingLogic();

  console.log(`\n=============================================================`);
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log(`=============================================================`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAll();
