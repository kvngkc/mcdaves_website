// scripts/simulate_head_occlusion.js
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

function testOcclusion(filename) {
  return new Promise((resolve) => {
    const filePath = path.resolve(__dirname, '../public/models', filename);
    const data = fs.readFileSync(filePath);
    const loader = new GLTFLoader();

    loader.parse(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      '',
      (gltf) => {
        console.log(`\n===============================================================`);
        console.log(`HEAD OCCLUSION & ROTATION TEST: ${filename}`);
        console.log(`===============================================================`);

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

        // Compute bridge and scale to physical cm (12.2 cm width)
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        for (const v of allVerts) {
          if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
          if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z;
        }
        const nativeWidth = maxX - minX;
        const scale = 12.2 / nativeWidth; // scale to 12.2 cm width

        // Find bridge point (center X, max Z - 10%, mid Y)
        const frontCenter = allVerts.filter(v => Math.abs(v.x) < nativeWidth * 0.05 && v.z > maxZ - (maxZ-minZ)*0.15);
        const bridgeX = frontCenter.reduce((a,b)=>a+b.x,0)/frontCenter.length;
        const bridgeY = frontCenter.reduce((a,b)=>a+b.y,0)/frontCenter.length;
        const bridgeZ = frontCenter.reduce((a,b)=>a+b.z,0)/frontCenter.length;

        // Shift model so bridge is at origin (0, 0, 0) and scale to metric cm
        const metricVerts = allVerts.map(v => new THREE.Vector3(
          (v.x - bridgeX) * scale,
          (v.y - bridgeY) * scale,
          (v.z - bridgeZ) * scale
        ));

        // Separate Left and Right Temples (in metric space)
        // Left temple: X < -3 cm, Z < -2 cm
        // Right temple: X > +3 cm, Z < -2 cm
        const leftTemple = metricVerts.filter(v => v.x < -3.0 && v.z < -1.5);
        const rightTemple = metricVerts.filter(v => v.x > 3.0 && v.z < -1.5);

        console.log(`Metric dimensions (cm): Width=${(nativeWidth*scale).toFixed(1)} cm, Depth=${((maxZ-minZ)*scale).toFixed(1)} cm`);
        console.log(`Left temple points: ${leftTemple.length}, Right temple points: ${rightTemple.length}`);

        // Define a realistic canonical human head volume:
        // Head center in canonical space is around (0, 0, -4.5 cm relative to bridge)
        // Head ellipsoid radii: Rx = 7.5 cm (half-width 15 cm), Ry = 10.0 cm (height 20 cm), Rz = 9.0 cm (depth 18 cm)
        const headCenter = new THREE.Vector3(0, -1.0, -5.5);
        const headRadius = new THREE.Vector3(7.2, 9.5, 8.5);

        function isInsideHead(point) {
          const dx = (point.x - headCenter.x) / headRadius.x;
          const dy = (point.y - headCenter.y) / headRadius.y;
          const dz = (point.z - headCenter.z) / headRadius.z;
          return (dx*dx + dy*dy + dz*dz) <= 1.0;
        }

        // Test rotations at 0, 15, 30, 45, 60 degrees yaw
        const angles = [0, 15, 30, 45, 60];
        console.log(`\n--- ROTATION & HEAD OCCLUSION ANALYSIS ---`);
        for (const deg of angles) {
          const rad = (deg * Math.PI) / 180;
          const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rad);

          // Rotate head and glasses together around head center (or face center)
          // When head rotates by rad, in camera view:
          // Far temple (left temple for positive yaw) rotates back in depth
          let leftOccluded = 0;
          let rightOccluded = 0;

          for (const p of leftTemple) {
            // Check if line of sight from camera (at Z=+50cm) to p passes through head ellipsoid
            // Simple depth test: is p.z behind the front surface of the head?
            const pRot = p.clone().applyQuaternion(rot);
            const headRot = headCenter.clone().applyQuaternion(rot);
            // If point is inside head or behind head center in ray direction:
            if (isInsideHead(p)) leftOccluded++;
          }

          for (const p of rightTemple) {
            if (isInsideHead(p)) rightOccluded++;
          }

          console.log(`Yaw ${deg.toString().padStart(2)}°:`);
          console.log(`  Left Temple (Far Side):  ${((leftTemple.filter(p => p.z < -4.0).length / leftTemple.length)*100).toFixed(0)}% extends behind ear | Occluded by head: ${((leftOccluded/leftTemple.length)*100).toFixed(0)}%`);
          console.log(`  Right Temple (Near Side): ${((rightTemple.filter(p => p.z < -4.0).length / rightTemple.length)*100).toFixed(0)}% extends behind ear | Occluded by head: ${((rightOccluded/rightTemple.length)*100).toFixed(0)}%`);
        }

        resolve();
      }
    );
  });
}

async function run() {
  await testOcclusion('Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb');
  await testOcclusion('glasses.glb');
}

run();
