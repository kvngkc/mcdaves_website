// scripts/forensic_glb_audit.js
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

function inspectModel(filename) {
  return new Promise((resolve) => {
    const filePath = path.resolve(__dirname, '../public/models', filename);
    const stats = fs.statSync(filePath);
    const data = fs.readFileSync(filePath);
    const loader = new GLTFLoader();

    loader.parse(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
      '',
      (gltf) => {
        console.log(`\n===============================================================`);
        console.log(`FORENSIC AUDIT: ${filename}`);
        console.log(`File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`===============================================================`);

        const scene = gltf.scene;
        scene.updateMatrixWorld(true);

        // 1. Hierarchy analysis
        console.log(`\n--- 1. SCENE HIERARCHY ---`);
        let meshCount = 0;
        let totalVertices = 0;
        let totalFaces = 0;

        function printNode(node, depth = 0) {
          const indent = '  '.repeat(depth);
          let extra = '';
          if (node.isMesh) {
            meshCount++;
            const pos = node.geometry.attributes.position;
            const idx = node.geometry.index;
            const vertCount = pos ? pos.count : 0;
            const faceCount = idx ? idx.count / 3 : vertCount / 3;
            totalVertices += vertCount;
            totalFaces += faceCount;
            const matName = Array.isArray(node.material)
              ? node.material.map((m) => m.name || m.type).join(', ')
              : (node.material ? (node.material.name || node.material.type) : 'None');
            extra = ` [Mesh: ${vertCount} verts, ${Math.round(faceCount)} faces, Mat: ${matName}]`;
          }
          console.log(`${indent}├─ ${node.name || '(unnamed)'} (${node.type})${extra}`);
          for (const child of node.children) {
            printNode(child, depth + 1);
          }
        }
        printNode(scene);
        console.log(`Total Meshes: ${meshCount}, Total Vertices: ${totalVertices}, Total Faces: ${Math.round(totalFaces)}`);

        // 2. Extract all world-space vertices
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

        // 3. Overall Bounding Box
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        for (const v of allVerts) {
          if (v.x < minX) minX = v.x;
          if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
          if (v.z < minZ) minZ = v.z;
          if (v.z > maxZ) maxZ = v.z;
        }

        const width = maxX - minX;
        const height = maxY - minY;
        const depth = maxZ - minZ;
        const center = new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);

        console.log(`\n--- 2. OVERALL BOUNDS & DIMENSIONS ---`);
        console.log(`X (Width):  [${minX.toFixed(4)}, ${maxX.toFixed(4)}] -> Dimension = ${width.toFixed(4)}`);
        console.log(`Y (Height): [${minY.toFixed(4)}, ${maxY.toFixed(4)}] -> Dimension = ${height.toFixed(4)}`);
        console.log(`Z (Depth):  [${minZ.toFixed(4)}, ${maxZ.toFixed(4)}] -> Dimension = ${depth.toFixed(4)}`);
        console.log(`Bounding Box Center: (${center.x.toFixed(4)}, ${center.y.toFixed(4)}, ${center.z.toFixed(4)})`);
        console.log(`Model Origin (0,0,0) relative to Center: dx=${(-center.x).toFixed(4)}, dy=${(-center.y).toFixed(4)}, dz=${(-center.z).toFixed(4)}`);

        // 4. Spatial Geometry Partitioning (Front Frame vs Temples vs Bridge)
        // Let's divide along Z axis into 10 slices from minZ (rear) to maxZ (front)
        console.log(`\n--- 3. Z-AXIS SLICE DISTRIBUTION (Rear to Front) ---`);
        const sliceCount = 10;
        const sliceSize = depth / sliceCount;
        for (let s = 0; s < sliceCount; s++) {
          const zStart = minZ + s * sliceSize;
          const zEnd = zStart + sliceSize;
          const sliceVerts = allVerts.filter((v) => v.z >= zStart && v.z <= zEnd);
          let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
          for (const v of sliceVerts) {
            if (v.x < sMinX) sMinX = v.x; if (v.x > sMaxX) sMaxX = v.x;
            if (v.y < sMinY) sMinY = v.y; if (v.y > sMaxY) sMaxY = v.y;
          }
          const label = s < 3 ? 'Rear Temples / Ear hooks' : (s < 7 ? 'Mid Temples' : (s === 9 ? 'Front Lenses / Rim' : 'Front Frame / Hinges'));
          console.log(`Slice ${s} [Z: ${zStart.toFixed(2)} to ${zEnd.toFixed(2)}]: ${sliceVerts.length.toString().padStart(6)} verts | X: [${sMinX.toFixed(2)}, ${sMaxX.toFixed(2)}] (span=${(sMaxX-sMinX).toFixed(2)}) | Y: [${sMinY.toFixed(2)}, ${sMaxY.toFixed(2)}] | ${label}`);
        }

        // 5. Front Frame Curvature Analysis (Top-down view of the front rim)
        // Examine vertices in the frontmost 15% of depth
        console.log(`\n--- 4. FRONT FRAME CURVATURE (Top View X vs Z) ---`);
        const frontVerts = allVerts.filter((v) => v.z > maxZ - depth * 0.15);
        // Find average Z at center (X near 0), mid-left (X near width/4), far-left (X near width/2)
        const centerFront = frontVerts.filter((v) => Math.abs(v.x - center.x) < width * 0.05);
        const quarterLeft = frontVerts.filter((v) => Math.abs(v.x - (center.x - width * 0.25)) < width * 0.05);
        const quarterRight = frontVerts.filter((v) => Math.abs(v.x - (center.x + width * 0.25)) < width * 0.05);
        const farLeft = frontVerts.filter((v) => v.x < minX + width * 0.1);
        const farRight = frontVerts.filter((v) => v.x > maxX - width * 0.1);

        const avgZ = (arr) => arr.length > 0 ? (arr.reduce((acc, v) => acc + v.z, 0) / arr.length).toFixed(3) : 'N/A';
        console.log(`Avg Z at Far Left (Hinge L):   ${avgZ(farLeft)}`);
        console.log(`Avg Z at Quarter Left:         ${avgZ(quarterLeft)}`);
        console.log(`Avg Z at Center (Bridge):       ${avgZ(centerFront)}`);
        console.log(`Avg Z at Quarter Right:        ${avgZ(quarterRight)}`);
        console.log(`Avg Z at Far Right (Hinge R):  ${avgZ(farRight)}`);

        // 6. Temple Forensics: Path, Direction, Curvature, Ear-Hooks
        console.log(`\n--- 5. TEMPLE GEOMETRY & PATH FORENSICS ---`);
        // Left temple: X < center.x - width * 0.25, Z < maxZ - depth * 0.2
        // Right temple: X > center.x + width * 0.25, Z < maxZ - depth * 0.2
        const leftTemple = allVerts.filter((v) => v.x < center.x - width * 0.25 && v.z < maxZ - depth * 0.15);
        const rightTemple = allVerts.filter((v) => v.x > center.x + width * 0.25 && v.z < maxZ - depth * 0.15);

        console.log(`Left Temple Vertices:  ${leftTemple.length}`);
        console.log(`Right Temple Vertices: ${rightTemple.length}`);

        // Track left temple centerline along Z axis
        console.log(`\nLeft Temple (Subject's Right / Negative X) Path Profile along Z (Front to Back):`);
        for (let zStep = 0; zStep < 6; zStep++) {
          const z1 = maxZ - depth * 0.15 - (zStep * (depth * 0.85 / 6));
          const z2 = z1 - (depth * 0.85 / 6);
          const segment = leftTemple.filter((v) => v.z <= z1 && v.z >= z2);
          if (segment.length > 0) {
            const avgX = segment.reduce((a, b) => a + b.x, 0) / segment.length;
            const avgY = segment.reduce((a, b) => a + b.y, 0) / segment.length;
            const avgZ = segment.reduce((a, b) => a + b.z, 0) / segment.length;
            console.log(`  Segment ${zStep} (Z: ${avgZ.toFixed(2)}): X=${avgX.toFixed(2)}, Y=${avgY.toFixed(2)} (pts: ${segment.length})`);
          }
        }

        console.log(`\nRight Temple (Subject's Left / Positive X) Path Profile along Z (Front to Back):`);
        for (let zStep = 0; zStep < 6; zStep++) {
          const z1 = maxZ - depth * 0.15 - (zStep * (depth * 0.85 / 6));
          const z2 = z1 - (depth * 0.85 / 6);
          const segment = rightTemple.filter((v) => v.z <= z1 && v.z >= z2);
          if (segment.length > 0) {
            const avgX = segment.reduce((a, b) => a + b.x, 0) / segment.length;
            const avgY = segment.reduce((a, b) => a + b.y, 0) / segment.length;
            const avgZ = segment.reduce((a, b) => a + b.z, 0) / segment.length;
            console.log(`  Segment ${zStep} (Z: ${avgZ.toFixed(2)}): X=${avgX.toFixed(2)}, Y=${avgY.toFixed(2)} (pts: ${segment.length})`);
          }
        }

        resolve();
      }
    );
  });
}

async function run() {
  await inspectModel('Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb');
  await inspectModel('glasses.glb');
}

run();
