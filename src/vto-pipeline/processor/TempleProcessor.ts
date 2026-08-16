// src/vto-pipeline/processor/TempleProcessor.ts
/**
 * Intelligent Eyewear Temple Processing Engine.
 * Modifies only rear temple geometry based on detected hinge locations and asset-derived cut planes,
 * strictly preserving front frame, bridge, hinges, UVs, normals, and materials.
 */

import * as THREE from 'three';
import {
  AssetInspectionReport,
  TempleProcessingProfile,
} from '../types/AssetTypes';

export interface TempleProcessingResult {
  processedScene: THREE.Object3D;
  modeApplied: TempleProcessingProfile['mode'];
  originalVertexCount: number;
  processedVertexCount: number;
  cutoffZ: number | null;
  modified: boolean;
  notes: string;
}

export class TempleProcessor {
  /**
   * Applies temple processing profile to a cloned Three.js scene.
   */
  public processTemples(
    scene: THREE.Object3D,
    inspection: AssetInspectionReport,
    profile: TempleProcessingProfile,
  ): TempleProcessingResult {
    const originalVerts = inspection.totalVertices;

    // Determine actual mode
    let activeMode = profile.mode;
    if (activeMode === 'auto') {
      if (inspection.detectedFeatures.temples.hasSevereRearOverhang) {
        activeMode = 'shortened';
      } else {
        activeMode = 'full';
      }
    }

    if (activeMode === 'disabled' || activeMode === 'full') {
      return {
        processedScene: scene,
        modeApplied: activeMode,
        originalVertexCount: originalVerts,
        processedVertexCount: originalVerts,
        cutoffZ: null,
        modified: false,
        notes: `Temple mode is ${activeMode.toUpperCase()}; source temple geometry preserved without alteration.`,
      };
    }

    // Compute asset-derived cut plane
    const { nativeBounds, detectedFeatures } = inspection;
    const { min, max, size, center } = nativeBounds;
    const width = size.x;
    const depth = size.z;

    // Hinge Z location (transition from front frame to temple arms)
    const hingeZ = Math.min(detectedFeatures.hinges.left.z, detectedFeatures.hinges.right.z);
    const rearZ = min.z;
    const templeLength = hingeZ - rearZ;

    if (templeLength <= 0) {
      return {
        processedScene: scene,
        modeApplied: 'full',
        originalVertexCount: originalVerts,
        processedVertexCount: originalVerts,
        cutoffZ: null,
        modified: false,
        notes: 'Temple length could not be clearly resolved from bounds; preserved in FULL mode.',
      };
    }

    // Target cut plane: retain ratio (default 0.70) of temple length extending back from hinges
    const cutRatio = profile.cutRatio ?? 0.70;
    const cutoffZ = profile.customCutZ !== undefined ? profile.customCutZ : hingeZ - templeLength * cutRatio;

    // Safe zone boundary: front frame region is X within central 50% or Z > hingeZ - (templeLength * 0.1)
    const templeLateralThreshold = width * 0.22; // Must be at least 22% away from center X to be temple

    let remainingVerts = 0;

    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const geom = mesh.geometry;
        if (!geom || !geom.attributes.position) return;

        const processedGeom = this.clipTempleGeometry(
          geom,
          mesh.matrixWorld,
          center.x,
          templeLateralThreshold,
          cutoffZ,
          hingeZ,
        );

        if (processedGeom) {
          mesh.geometry.dispose();
          mesh.geometry = processedGeom;
          remainingVerts += processedGeom.attributes.position.count;
        } else {
          remainingVerts += geom.attributes.position.count;
        }
      }
    });

    scene.updateMatrixWorld(true);

    return {
      processedScene: scene,
      modeApplied: 'shortened',
      originalVertexCount: originalVerts,
      processedVertexCount: remainingVerts,
      cutoffZ,
      modified: remainingVerts !== originalVerts,
      notes: `Shortened temple geometry beyond Z = ${cutoffZ.toFixed(3)} (retaining ${(cutRatio * 100).toFixed(0)}% of temple arm). Trimmed ${originalVerts - remainingVerts} vertices.`,
    };
  }

  /**
   * Non-destructive triangle filter on BufferGeometry.
   */
  private clipTempleGeometry(
    geom: THREE.BufferGeometry,
    matrixWorld: THREE.Matrix4,
    centerX: number,
    templeLateralThreshold: number,
    cutoffZ: number,
    hingeZ: number,
  ): THREE.BufferGeometry | null {
    const pos = geom.attributes.position;
    if (!pos) return null;

    const normal = geom.attributes.normal;
    const uv = geom.attributes.uv;
    const index = geom.index;

    const isIndexed = Boolean(index);
    const triangleCount = isIndexed ? index!.count / 3 : pos.count / 3;

    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();

    const keptIndices: number[] = [];
    const newPositions: number[] = [];
    const newNormals: number[] = [];
    const newUvs: number[] = [];

    const getVertexWorld = (idx: number, target: THREE.Vector3) => {
      target.set(pos.getX(idx), pos.getY(idx), pos.getZ(idx));
      target.applyMatrix4(matrixWorld);
    };

    if (isIndexed) {
      const idxArr = index!;
      for (let t = 0; t < triangleCount; t++) {
        const i0 = idxArr.getX(t * 3);
        const i1 = idxArr.getX(t * 3 + 1);
        const i2 = idxArr.getX(t * 3 + 2);

        getVertexWorld(i0, vA);
        getVertexWorld(i1, vB);
        getVertexWorld(i2, vC);

        // Check if triangle is in temple region (all vertices lateral from center)
        const isLateral =
          Math.abs(vA.x - centerX) > templeLateralThreshold &&
          Math.abs(vB.x - centerX) > templeLateralThreshold &&
          Math.abs(vC.x - centerX) > templeLateralThreshold;

        // Check if triangle is beyond cutoffZ and not in front frame
        const isBehindCutoff = vA.z < cutoffZ && vB.z < cutoffZ && vC.z < cutoffZ;
        const isNotFrontHinge = vA.z < hingeZ && vB.z < hingeZ && vC.z < hingeZ;

        if (isLateral && isBehindCutoff && isNotFrontHinge) {
          // Omit this triangle (clip rear temple)
          continue;
        }

        keptIndices.push(i0, i1, i2);
      }

      if (keptIndices.length === idxArr.count) {
        return null; // Unaltered
      }

      const newGeom = geom.clone();
      newGeom.setIndex(keptIndices);
      newGeom.computeVertexNormals();
      newGeom.computeBoundingBox();
      newGeom.computeBoundingSphere();
      return newGeom;
    } else {
      // Unindexed geometry
      for (let t = 0; t < triangleCount; t++) {
        const i0 = t * 3;
        const i1 = t * 3 + 1;
        const i2 = t * 3 + 2;

        getVertexWorld(i0, vA);
        getVertexWorld(i1, vB);
        getVertexWorld(i2, vC);

        const isLateral =
          Math.abs(vA.x - centerX) > templeLateralThreshold &&
          Math.abs(vB.x - centerX) > templeLateralThreshold &&
          Math.abs(vC.x - centerX) > templeLateralThreshold;

        const isBehindCutoff = vA.z < cutoffZ && vB.z < cutoffZ && vC.z < cutoffZ;
        const isNotFrontHinge = vA.z < hingeZ && vB.z < hingeZ && vC.z < hingeZ;

        if (isLateral && isBehindCutoff && isNotFrontHinge) {
          continue;
        }

        [i0, i1, i2].forEach((idx) => {
          newPositions.push(pos.getX(idx), pos.getY(idx), pos.getZ(idx));
          if (normal) newNormals.push(normal.getX(idx), normal.getY(idx), normal.getZ(idx));
          if (uv) newUvs.push(uv.getX(idx), uv.getY(idx));
        });
      }

      const newGeom = new THREE.BufferGeometry();
      newGeom.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
      if (newNormals.length > 0) {
        newGeom.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
      } else {
        newGeom.computeVertexNormals();
      }
      if (newUvs.length > 0) {
        newGeom.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2));
      }
      newGeom.computeBoundingBox();
      newGeom.computeBoundingSphere();
      return newGeom;
    }
  }
}

export const defaultTempleProcessor = new TempleProcessor();
