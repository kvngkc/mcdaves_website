// scripts/test_occluder_clearance.js
const THREE = require('three');

// Let's test the Head Occluder geometry bounds relative to Landmark 168 (origin 0,0,0)
function testOccluderBounds(craniumCenter, craniumRadius, jawCenter, jawRadii) {
  console.log('Testing occluder bounds...');

  // Cranium frontmost point
  const craniumFrontZ = craniumCenter.z + craniumRadius;
  console.log(`Cranium Front Z: ${craniumFrontZ.toFixed(2)} cm (Must be <= -1.5 cm)`);

  // Jaw frontmost point
  const jawFrontZ = jawCenter.z + jawRadii.topRadius;
  console.log(`Jaw Front Z: ${jawFrontZ.toFixed(2)} cm (Must be <= -1.5 cm)`);

  const safe = craniumFrontZ <= -1.5 && jawFrontZ <= -1.5;
  console.log(`Occluder Safe for Front Frame: ${safe ? 'YES (No clipping)' : 'NO (WILL CUT FRAME)'}`);
  return safe;
}

console.log('--- OLD BUGGY OCCLUDER ---');
testOccluderBounds(
  new THREE.Vector3(0, -1.2, -5.8),
  7.2,
  new THREE.Vector3(0, -1.2 - 2.5, -5.8 + 2.0),
  { topRadius: 6.2, bottomRadius: 5.0, height: 7.5 }
);

console.log('\n--- NEW CALIBRATED OCCLUDER ---');
// Position cranium at Z = -7.5, radius = 5.8 (front at -1.7 cm)
// Position jaw at Z = -6.5, topRadius = 4.8, bottomRadius = 4.0 (front at -1.7 cm)
testOccluderBounds(
  new THREE.Vector3(0, -1.5, -7.5),
  5.8,
  new THREE.Vector3(0, -3.5, -6.5),
  { topRadius: 4.8, bottomRadius: 4.0, height: 7.0 }
);
