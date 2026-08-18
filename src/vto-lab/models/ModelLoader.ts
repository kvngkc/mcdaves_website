// src/vto-lab/models/ModelLoader.ts
/**
 * GLB Asset Inspector & Preparation Utility.
 * Measures model bounds programmatically and centers the model around its bridge anchor.
 */

import { Box3, Group, Object3D, Vector3, Plane, Mesh } from 'three';
import { CalibrationEntry } from '../calibration/calibrationRegistry';
import { ModelMeasurement } from '../tracking/FaceTrackingTypes';

export interface PreparedGlassesAsset {
  root: Object3D;
  measurements: ModelMeasurement;
  clippingPlane?: Plane;
}

export function measureObjectBounds(obj: Object3D): ModelMeasurement {
  obj.updateMatrixWorld(true);
  const box = new Box3().setFromObject(obj);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);

  return {
    min: { x: box.min.x, y: box.min.y, z: box.min.z },
    max: { x: box.max.x, y: box.max.y, z: box.max.z },
    size: { x: size.x, y: size.y, z: size.z },
    center: { x: center.x, y: center.y, z: center.z },
    nativeWidth: size.x > 0 ? size.x : 1.0,
    nativeHeight: size.y > 0 ? size.y : 1.0,
    nativeDepth: size.z > 0 ? size.z : 1.0,
  };
}

/**
 * Clips long temple handles extending behind the head plane.
 * In metric space centered at the bridge (0, 0, 0), the front rims sit near Z = 0,
 * while temple arms extend back along -Z towards the ears.
 * A plane with normal (0, 0, 1) and constant `maxTempleDepth` keeps geometry where Z >= -maxTempleDepth.
 */
export function applyTempleClipping(root: Object3D, maxTempleDepth = 2.5): Plane {
  const plane = new Plane(new Vector3(0, 0, 1), maxTempleDepth);

  root.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((mat) => {
          const cloned = mat.clone();
          cloned.clippingPlanes = [plane];
          cloned.clipShadows = true;
          cloned.needsUpdate = true;
          return cloned;
        });
      } else if (mesh.material) {
        const cloned = mesh.material.clone();
        cloned.clippingPlanes = [plane];
        cloned.clipShadows = true;
        cloned.needsUpdate = true;
        mesh.material = cloned;
      }
    }
  });

  return plane;
}

export function prepareGlassesModel(
  scene: Group,
  calibration: CalibrationEntry,
  clipTemples = true,
  templeDepthCutoff = 2.5,
): PreparedGlassesAsset {
  const container = new Group();
  const clone = scene.clone(true);

  // Shift model by -bridge offset so container origin (0, 0, 0) becomes the physical bridge
  clone.position.set(
    -calibration.bridge.x,
    -calibration.bridge.y,
    -calibration.bridge.z,
  );
  container.add(clone);
  container.updateMatrixWorld(true);

  let clippingPlane: Plane | undefined;
  if (clipTemples) {
    clippingPlane = applyTempleClipping(clone, templeDepthCutoff);
  }

  const measurements = measureObjectBounds(clone);

  return {
    root: container,
    measurements,
    clippingPlane,
  };
}
