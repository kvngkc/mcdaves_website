// scripts/geometric_depth_analysis.js
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

function analyzeModel(filename, frameWidthMm, currentBridge) {
  return new Promise((resolve) => {
    const filePath = path.resolve(__dirname, '../public/models', filename);
    const data = fs.readFileSync(filePath);
    const loader = new GLTFLoader();

    loader.parse(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      '',
      (gltf) => {
        const scene = gltf.scene;
        scene.updateMatrixWorld(true);

        const allVerts = [];
        scene.traverse((node) => {
          if (node.isMesh && node.geometry) {
            const pos = node.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
              const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
              v.applyMatrix4(node.matrixWorld);
              allVerts.push(v);
            }
          }
        });

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        for (const v of allVerts) {
          if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
          if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z;
        }
        const nativeWidth = maxX - minX;
        const nativeHeight = maxY - minY;
        const nativeDepth = maxZ - minZ;
        const scale = (frameWidthMm / 10) / nativeWidth; // cm per model unit

        console.log(`\n========================================`);
        console.log(`MODEL: ${filename}`);
        console.log(`Frame Width: ${frameWidthMm} mm -> Target Width: ${(frameWidthMm/10).toFixed(2)} cm`);
        console.log(`Native Bounds: X[${minX.toFixed(3)}, ${maxX.toFixed(3)}] Y[${minY.toFixed(3)}, ${maxY.toFixed(3)}] Z[${minZ.toFixed(3)}, ${maxZ.toFixed(3)}]`);
        console.log(`Native Dimensions: ${nativeWidth.toFixed(4)} x ${nativeHeight.toFixed(4)} x ${nativeDepth.toFixed(4)}`);
        console.log(`Scale Factor: ${scale.toFixed(6)}`);

        // Test with CURRENT bridge registration
        console.log(`\n--- WITH CURRENT BRIDGE: (${currentBridge.x}, ${currentBridge.y}, ${currentBridge.z}) ---`);
        const currentMetricVerts = allVerts.map(v => new THREE.Vector3(
          (v.x - currentBridge.x) * scale,
          (v.y - currentBridge.y) * scale,
          (v.z - currentBridge.z) * scale
        ));

        const frontThreshold = minZ + nativeDepth * 0.7;
        const currentFront = currentMetricVerts.filter((v, idx) => allVerts[idx].z > frontThreshold);
        let minFrontZ = Infinity, maxFrontZ = -Infinity;
        let minCheekZ = Infinity;
        for (const v of currentFront) {
          if (v.z < minFrontZ) minFrontZ = v.z;
          if (v.z > maxFrontZ) maxFrontZ = v.z;
          if (v.y < -1.0 && v.z < minCheekZ) minCheekZ = v.z;
        }

        console.log(`Front Frame Z-span in Metric cm (rel to landmark 168 at Z=0):`);
        console.log(`  Frontmost lens surface Z: ${maxFrontZ.toFixed(2)} cm`);
        console.log(`  Rear of front frame rim Z: ${minFrontZ.toFixed(2)} cm`);
        console.log(`  Cheek / Lower rim area Z:  ${minCheekZ.toFixed(2)} cm`);
        console.log(`  --> INTERSECTION: Frame penetrates ${(Math.abs(minFrontZ)).toFixed(2)} cm BEHIND nose bridge landmark!`);

        // Analysis of Nose Bridge & Contact Pads
        const bridgeCenterVerts = allVerts.filter(v => 
          Math.abs(v.x - (minX+maxX)/2) < nativeWidth * 0.08 &&
          v.z > minZ + nativeDepth * 0.65
        );
        
        let minBridgeZ = Infinity, maxBridgeZ = -Infinity;
        let avgBridgeY = 0;
        for (const v of bridgeCenterVerts) {
          if (v.z < minBridgeZ) minBridgeZ = v.z;
          if (v.z > maxBridgeZ) maxBridgeZ = v.z;
          avgBridgeY += v.y;
        }
        avgBridgeY /= bridgeCenterVerts.length;

        console.log(`\n--- BRIDGE GEOMETRY ANALYSIS ---`);
        console.log(`Bridge center verts: ${bridgeCenterVerts.length}`);
        console.log(`Bridge Y center: ${avgBridgeY.toFixed(4)}`);
        console.log(`Bridge Frontmost Z: ${maxBridgeZ.toFixed(4)}`);
        console.log(`Bridge Rearmost (inner contact surface) Z: ${minBridgeZ.toFixed(4)}`);

        // Test with bridge contact point registration (with +0.4 cm forward offset for natural nose pad clearance)
        const targetForwardOffsetCm = 0.45; // +4.5 mm forward in front of sellion skin
        const calibratedBridgeZ = minBridgeZ - (targetForwardOffsetCm / scale);

        console.log(`\n--- OPTIMIZED CALIBRATION ---`);
        console.log(`Calibrated Bridge X: ${((minX+maxX)/2).toFixed(4)}`);
        console.log(`Calibrated Bridge Y: ${avgBridgeY.toFixed(4)}`);
        console.log(`Calibrated Bridge Z: ${calibratedBridgeZ.toFixed(4)} (inner contact Z: ${minBridgeZ.toFixed(4)})`);

        const testCalibVerts = allVerts.map(v => new THREE.Vector3(
          (v.x - (minX+maxX)/2) * scale,
          (v.y - avgBridgeY) * scale,
          (v.z - calibratedBridgeZ) * scale
        ));
        const testFront = testCalibVerts.filter((v, idx) => allVerts[idx].z > frontThreshold);
        let testMinFrontZ = Infinity, testMaxFrontZ = -Infinity;
        for (const v of testFront) {
          if (v.z < testMinFrontZ) testMinFrontZ = v.z;
          if (v.z > testMaxFrontZ) testMaxFrontZ = v.z;
        }
        console.log(`With Calibrated Bridge Z (${calibratedBridgeZ.toFixed(4)}):`);
        console.log(`  Frontmost lens surface Z: ${testMaxFrontZ.toFixed(2)} cm`);
        console.log(`  Rear of front frame rim Z: ${testMinFrontZ.toFixed(2)} cm (>= 0cm -> NO INTERSECTION!)`);

        resolve();
      }
    );
  });
}

async function run() {
  await analyzeModel(
    'Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    124,
    { x: 0.0, y: 0.0836, z: 0.8262 }
  );

  await analyzeModel(
    'glasses.glb',
    122,
    { x: 6.1627, y: 321.42, z: 263.06 }
  );
}

run();
