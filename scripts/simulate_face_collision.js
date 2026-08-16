// scripts/simulate_face_collision.js
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

// MediaPipe canonical face model key landmark coordinates in cm (relative to head mass center):
// Landmark 168 (nose bridge / sellion): (0, 3.27, 5.24)
// Landmark 6 (mid nose bridge): (0, 2.50, 5.75)
// Landmark 1 (nose tip): (0, 0.50, 6.70)
// Landmark 117 (left cheek): (-3.5, 0.0, 4.2)
// Landmark 346 (right cheek): (3.5, 0.0, 4.2)
// Landmark 33 (left outer eye corner): (-3.8, 2.9, 4.1)
// Landmark 263 (right outer eye corner): (3.8, 2.9, 4.1)
// Landmark 10 (top forehead): (0, 7.5, 3.8)

function testFit(filename, frameWidthMm, testBridges) {
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
        const nativeDepth = maxZ - minZ;
        const scale = (frameWidthMm / 10) / nativeWidth;

        console.log(`\n======================================================`);
        console.log(`TESTING FIT & CLEARANCE: ${filename}`);
        console.log(`Native Width: ${nativeWidth.toFixed(4)}, Scale: ${scale.toFixed(6)}`);
        console.log(`======================================================`);

        for (const [label, bridge] of Object.entries(testBridges)) {
          console.log(`\n--- Test Config: ${label} (Bridge: x=${bridge.x}, y=${bridge.y}, z=${bridge.z}) ---`);
          
          // In local face-anchored metric space (cm):
          // Origin (0, 0, 0) is Landmark 168 (Sellion).
          // Face surface near eyes/cheeks is at Z <= 0 relative to Landmark 168:
          // Cheek plane is at Y ≈ -2.0 to -3.5 cm, Z ≈ -1.0 to -1.5 cm.
          // Brow plane is at Y ≈ +1.5 to +2.5 cm, Z ≈ -0.5 to -1.0 cm.
          // Front frame vertices should remain strictly IN FRONT of the face surface (Z > -0.2 cm for nose bridge, Z > -0.8 cm for cheeks).
          
          const metricVerts = allVerts.map(v => new THREE.Vector3(
            (v.x - bridge.x) * scale,
            (v.y - bridge.y) * scale,
            (v.z - bridge.z) * scale
          ));

          const frontRims = metricVerts.filter((v, idx) => allVerts[idx].z > minZ + nativeDepth * 0.7);
          const cheeks = frontRims.filter(v => v.y < -1.0 && Math.abs(v.x) > 2.0);
          const brows = frontRims.filter(v => v.y > 1.2);
          const centerBridge = frontRims.filter(v => Math.abs(v.x) < 1.0 && Math.abs(v.y) < 1.0);

          const minZCheek = cheeks.reduce((m, v) => Math.min(m, v.z), Infinity);
          const minZCenter = centerBridge.reduce((m, v) => Math.min(m, v.z), Infinity);
          const maxZCenter = centerBridge.reduce((m, v) => Math.max(m, v.z), -Infinity);
          const minZAllFront = frontRims.reduce((m, v) => Math.min(m, v.z), Infinity);
          const maxZAllFront = frontRims.reduce((m, v) => Math.max(m, v.z), -Infinity);

          console.log(`  Bridge Front Z:  ${maxZCenter.toFixed(2)} cm (Frame front at nose bridge)`);
          console.log(`  Bridge Rear Z:   ${minZCenter.toFixed(2)} cm (Nose pad contact area, target ~ +0.1 to +0.3 cm)`);
          console.log(`  Cheek Rim Min Z: ${minZCheek.toFixed(2)} cm (Target > -0.5 cm to clear cheeks)`);
          console.log(`  Overall Front Z: [${minZAllFront.toFixed(2)}, ${maxZAllFront.toFixed(2)}] cm`);

          let status = 'PERFECT FIT';
          if (minZCheek < -1.0) status = 'CRITICAL: Severe Cheek Intersection';
          else if (minZCenter < -0.2) status = 'WARNING: Bridge Penetrates Nose';
          else if (maxZCenter > 3.5) status = 'WARNING: Floating too far from face';
          console.log(`  Fit Status: ${status}`);
        }

        resolve();
      }
    );
  });
}

async function run() {
  await testFit(
    'Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    124,
    {
      'Old (Original Buggy)': { x: 0.0, y: 0.0836, z: 0.8262 },
      'Inner Contact Surface': { x: 0.0, y: 0.0836, z: 0.6511 },
      'Physically Calibrated (+4mm vertex clearance)': { x: 0.0, y: 0.0836, z: 0.58 },
      'Physically Calibrated (+6mm vertex clearance)': { x: 0.0, y: 0.0836, z: 0.54 },
      'Physically Calibrated (+8mm vertex clearance)': { x: 0.0, y: 0.0836, z: 0.50 },
    }
  );

  await testFit(
    'glasses.glb',
    122,
    {
      'Old (Original Buggy)': { x: 6.1627, y: 321.42, z: 263.06 },
      'Inner Contact Surface': { x: 6.1627, y: 319.708, z: 133.64 },
      'Physically Calibrated (+4mm vertex clearance)': { x: 6.1627, y: 319.708, z: 115.0 },
      'Physically Calibrated (+6mm vertex clearance)': { x: 6.1627, y: 319.708, z: 105.0 },
    }
  );
}

run();
