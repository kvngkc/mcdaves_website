// src/vto-pipeline/inspector/AssetInspector.ts
/**
 * Universal 3D Eyewear Asset Inspector Engine.
 * Extracts geometric topology, hierarchy, bounding metrics, bridge/hinge/temple features,
 * and infers physical orientation without trusting arbitrary node names.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import {
  AssetInspectionReport,
  Box3D,
  CoordinateAxis,
  DetectedFeatureRegions,
  SceneNodeSummary,
  SpatialZSlice,
  Vector3D,
} from '../types/AssetTypes';

export interface RawGeometryVertex {
  position: THREE.Vector3;
  normal?: THREE.Vector3;
  meshName: string;
}

export class AssetInspector {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
  }

  /**
   * Inspects a GLB file from an ArrayBuffer or binary buffer.
   */
  public async inspectBuffer(
    buffer: ArrayBuffer,
    fileName = 'eyewear.glb',
    assetId = `asset-${Date.now()}`,
  ): Promise<AssetInspectionReport> {
    return new Promise((resolve, reject) => {
      this.loader.parse(
        buffer,
        '',
        (gltf) => {
          try {
            const report = this.inspectScene(gltf.scene, fileName, assetId, buffer.byteLength);
            resolve(report);
          } catch (err) {
            reject(err);
          }
        },
        (error) => reject(new Error(`Failed to parse GLTF/GLB: ${error}`)),
      );
    });
  }

  /**
   * Inspects a Three.js scene hierarchy.
   */
  public inspectScene(
    scene: THREE.Object3D,
    fileName: string,
    assetId: string,
    fileSizeBytes = 0,
  ): AssetInspectionReport {
    scene.updateMatrixWorld(true);

    // 1. Traverse hierarchy and collect metadata
    const materialSet = new Set<string>();
    let textureCount = 0;
    let totalVertices = 0;
    let totalFaces = 0;
    let meshCount = 0;
    let hasBonesOrSkin = false;
    let hasMorphTargets = false;

    const allVerts: RawGeometryVertex[] = [];

    function traverseNode(node: THREE.Object3D): SceneNodeSummary {
      const isMesh = (node as THREE.Mesh).isMesh === true;
      let nodeVerts = 0;
      let nodeFaces = 0;
      const nodeMats: string[] = [];

      if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
        hasBonesOrSkin = true;
      }

      if (isMesh) {
        meshCount++;
        const mesh = node as THREE.Mesh;
        const geom = mesh.geometry;

        if (geom.morphAttributes && Object.keys(geom.morphAttributes).length > 0) {
          hasMorphTargets = true;
        }

        if (geom && geom.attributes.position) {
          const pos = geom.attributes.position;
          nodeVerts = pos.count;
          nodeFaces = geom.index ? geom.index.count / 3 : pos.count / 3;
          totalVertices += nodeVerts;
          totalFaces += Math.round(nodeFaces);

          const normals = geom.attributes.normal;

          for (let i = 0; i < pos.count; i++) {
            const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
            v.applyMatrix4(mesh.matrixWorld);

            let n: THREE.Vector3 | undefined;
            if (normals) {
              n = new THREE.Vector3(normals.getX(i), normals.getY(i), normals.getZ(i));
              const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
              n.applyMatrix3(normalMatrix).normalize();
            }

            allVerts.push({
              position: v,
              normal: n,
              meshName: mesh.name || 'unnamed_mesh',
            });
          }
        }

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          if (mat) {
            const matName = mat.name || mat.type || 'StandardMaterial';
            nodeMats.push(matName);
            materialSet.add(matName);

            // Check for textures
            const standardMat = mat as unknown as Record<string, unknown>;
            ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach(
              (prop) => {
                if (standardMat[prop]) textureCount++;
              },
            );
          }
        });
      }

      const children = node.children.map(traverseNode);

      return {
        name: node.name || '(unnamed)',
        type: node.type,
        isMesh,
        vertexCount: nodeVerts > 0 ? nodeVerts : undefined,
        faceCount: nodeFaces > 0 ? Math.round(nodeFaces) : undefined,
        materialNames: nodeMats.length > 0 ? nodeMats : undefined,
        children: children.length > 0 ? children : undefined,
      };
    }

    const sceneHierarchy = traverseNode(scene);

    // 2. Compute Overall Bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const item of allVerts) {
      const v = item.position;
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
      if (v.z < minZ) minZ = v.z;
      if (v.z > maxZ) maxZ = v.z;
    }

    if (!Number.isFinite(minX)) {
      minX = maxX = minY = maxY = minZ = maxZ = 0;
    }

    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const nativeBounds: Box3D = {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
      size: { x: sizeX, y: sizeY, z: sizeZ },
      center: { x: centerX, y: centerY, z: centerZ },
    };

    // 3. Spatial Z-Partitioning & Slices
    const sliceCount = 10;
    const sliceDepth = sizeZ > 0 ? sizeZ / sliceCount : 1;
    const zSlices: SpatialZSlice[] = [];

    for (let s = 0; s < sliceCount; s++) {
      const zStart = minZ + s * sliceDepth;
      const zEnd = zStart + sliceDepth;
      const sliceItems = allVerts.filter(
        (v) => v.position.z >= zStart && (s === sliceCount - 1 ? v.position.z <= zEnd : v.position.z < zEnd),
      );

      let sMinX = Infinity, sMaxX = -Infinity;
      let sMinY = Infinity, sMaxY = -Infinity;
      for (const item of sliceItems) {
        const p = item.position;
        if (p.x < sMinX) sMinX = p.x;
        if (p.x > sMaxX) sMaxX = p.x;
        if (p.y < sMinY) sMinY = p.y;
        if (p.y > sMaxY) sMaxY = p.y;
      }

      let label: SpatialZSlice['label'] = 'Mid Temples';
      if (s < 3) label = 'Rear Temples';
      else if (s >= 3 && s < 7) label = 'Mid Temples';
      else if (s === 7 || s === 8) label = 'Front Hinges';
      else label = 'Front Frame / Lenses';

      zSlices.push({
        sliceIndex: s,
        zRange: [zStart, zEnd],
        vertexCount: sliceItems.length,
        xSpan: [Number.isFinite(sMinX) ? sMinX : 0, Number.isFinite(sMaxX) ? sMaxX : 0],
        ySpan: [Number.isFinite(sMinY) ? sMinY : 0, Number.isFinite(sMaxY) ? sMaxY : 0],
        label,
      });
    }

    // 4. Feature Extraction: Bridge, Hinges, Temples
    const detectedFeatures = this.extractFeatures(allVerts, nativeBounds);

    // 5. Inferred Orientation
    const inferredOrientation = this.inferOrientation(allVerts, nativeBounds, detectedFeatures);

    return {
      assetId,
      fileName,
      fileSizeBytes,
      meshCount,
      totalVertices,
      totalFaces,
      materialNames: Array.from(materialSet),
      textureCount,
      hasBonesOrSkin,
      hasMorphTargets,
      nativeBounds,
      inferredOrientation,
      detectedFeatures,
      sceneHierarchy,
      zSlices,
      inspectedAt: new Date().toISOString(),
    };
  }

  /**
   * Identifies the nose bridge, temple rails, hinges, and front frame geometrically.
   */
  private extractFeatures(verts: RawGeometryVertex[], bounds: Box3D): DetectedFeatureRegions {
    const { min, max, size, center } = bounds;
    const width = size.x;
    const depth = size.z;

    // A. Front Frame vs Rear: Front 30% of depth
    const frontVerts = verts.filter((v) => v.position.z >= max.z - depth * 0.35);

    // B. Bridge Detection: Center X (+- 8% width) in front frame
    const bridgeVerts = frontVerts.filter(
      (v) => Math.abs(v.position.x - center.x) <= width * 0.08,
    );

    let bridgeFrontZ = max.z;
    let bridgeInnerContactZ = max.z - depth * 0.15;
    let bridgeYCenter = center.y;
    let bridgeConfidence = 0.5;

    if (bridgeVerts.length > 0) {
      let bMinZ = Infinity, bMaxZ = -Infinity;
      let sumY = 0;
      for (const item of bridgeVerts) {
        const p = item.position;
        if (p.z < bMinZ) bMinZ = p.z;
        if (p.z > bMaxZ) bMaxZ = p.z;
        sumY += p.y;
      }
      bridgeFrontZ = bMaxZ;
      bridgeInnerContactZ = bMinZ;
      bridgeYCenter = sumY / bridgeVerts.length;
      bridgeConfidence = bridgeVerts.length > 50 ? 0.95 : 0.7;
    }

    const bridgeCenter: Vector3D = {
      x: center.x,
      y: bridgeYCenter,
      z: bridgeInnerContactZ,
    };

    // C. Hinge Detection: Outer 15% width at front frame
    const leftHingeVerts = frontVerts.filter((v) => v.position.x <= min.x + width * 0.12);
    const rightHingeVerts = frontVerts.filter((v) => v.position.x >= max.x - width * 0.12);

    const avgPos = (arr: RawGeometryVertex[], fallback: Vector3D): Vector3D => {
      if (arr.length === 0) return fallback;
      const sum = arr.reduce(
        (acc, item) => ({
          x: acc.x + item.position.x,
          y: acc.y + item.position.y,
          z: acc.z + item.position.z,
        }),
        { x: 0, y: 0, z: 0 },
      );
      return {
        x: sum.x / arr.length,
        y: sum.y / arr.length,
        z: sum.z / arr.length,
      };
    };

    const leftHinge = avgPos(leftHingeVerts, { x: min.x, y: center.y, z: bridgeFrontZ });
    const rightHinge = avgPos(rightHingeVerts, { x: max.x, y: center.y, z: bridgeFrontZ });

    // D. Temple Detection: Vertices rearward of hinges (Z < max.z - depth * 0.20)
    const leftTempleVerts = verts.filter(
      (v) => v.position.x <= center.x - width * 0.25 && v.position.z < max.z - depth * 0.2,
    );
    const rightTempleVerts = verts.filter(
      (v) => v.position.x >= center.x + width * 0.25 && v.position.z < max.z - depth * 0.2,
    );

    // Determine if temples have extreme rear overhang / excessive ear curve:
    // Standard eyewear depth / width ratio is ~ 0.85 to 1.15.
    // If temples extend rearward past 1.3x width or curl far downward into neck, flag overhang.
    const depthToWidthRatio = width > 0 ? depth / width : 1.0;
    const hasSevereRearOverhang = depthToWidthRatio > 0.95 || (leftTempleVerts.length > 5000 && min.z < center.z - width * 0.6);

    return {
      bridge: {
        center: bridgeCenter,
        innerContactZ: bridgeInnerContactZ,
        frontZ: bridgeFrontZ,
        confidence: bridgeConfidence,
      },
      hinges: {
        left: leftHinge,
        right: rightHinge,
        confidence: leftHingeVerts.length > 0 && rightHingeVerts.length > 0 ? 0.9 : 0.6,
      },
      temples: {
        leftExtent: [
          leftTempleVerts.reduce((m, v) => Math.min(m, v.position.z), min.z),
          leftTempleVerts.reduce((m, v) => Math.max(m, v.position.z), max.z),
        ],
        rightExtent: [
          rightTempleVerts.reduce((m, v) => Math.min(m, v.position.z), min.z),
          rightTempleVerts.reduce((m, v) => Math.max(m, v.position.z), max.z),
        ],
        hasSevereRearOverhang,
        recommendedCutoffRatio: hasSevereRearOverhang ? 0.70 : 1.0,
        confidence: leftTempleVerts.length > 0 ? 0.9 : 0.5,
      },
      frontFrame: {
        zSpan: [bridgeInnerContactZ, max.z],
        thickness: max.z - bridgeInnerContactZ,
      },
    };
  }

  /**
   * Infers coordinate orientation (+Z forward, +Y up, +X lateral).
   */
  private inferOrientation(
    verts: RawGeometryVertex[],
    bounds: Box3D,
    features: DetectedFeatureRegions,
  ): AssetInspectionReport['inferredOrientation'] {
    const { size } = bounds;

    // In standard eyewear:
    // Width (X) > Depth (Z) or Width ≈ Depth, and Height (Y) is significantly smaller than Width & Depth (Height ≈ 0.3–0.4x Width).
    let forward: CoordinateAxis = '+Z';
    let up: CoordinateAxis = '+Y';
    let lateral: CoordinateAxis = '+X';
    let confidence = 0.9;

    // Check if Y is actually the smallest dimension (height)
    if (size.y > size.x && size.y > size.z) {
      // Y is largest dimension -> Model might be oriented with Y as width or depth
      confidence = 0.5;
    }

    // Check if +Z has higher vertex density (front frame) compared to -Z (open temples)
    const frontVertCount = verts.filter((v) => v.position.z > bounds.center.z).length;
    const backVertCount = verts.length - frontVertCount;

    if (backVertCount > frontVertCount * 2.0 && features.temples.leftExtent[0] > bounds.center.z) {
      // -Z has the front frame -> inverted Z
      forward = '-Z';
      confidence = 0.6;
    }

    return {
      forward,
      up,
      lateral,
      confidence,
    };
  }
}

export const defaultAssetInspector = new AssetInspector();
