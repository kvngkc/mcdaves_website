// src/vto-lab/models/PosePrimitive.tsx
/**
 * Milestone 3 Gate: 3D Pose Primitive (Axes & Cube) attached to Landmark 168.
 * Supports both mutable detectionRef for zero-latency 60 FPS updates and direct faceMatrix prop.
 */

'use client';

import React, { useRef, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { getMetricBridgePose } from '../pose/CoordinateTransform';
import { PoseFilter } from '../pose/FacePose';
import { FaceDetectionResult } from '../tracking/FaceTrackingTypes';

export interface PosePrimitiveProps {
  detectionRef?: MutableRefObject<FaceDetectionResult | null>;
  faceMatrix?: Float32Array | null;
  mirrored?: boolean;
  showAxes?: boolean;
  showCube?: boolean;
  axesSize?: number; // cm
  cubeSize?: number; // cm
}

export function PosePrimitive({
  detectionRef,
  faceMatrix,
  mirrored = true,
  showAxes = true,
  showCube = true,
  axesSize = 5.0,
  cubeSize = 1.5,
}: PosePrimitiveProps) {
  const rootRef = useRef<Group>(null);
  const filterRef = useRef(new PoseFilter(45.0, 50.0, 40.0));

  useFrame((_, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const matrix = detectionRef?.current?.faceMatrix ?? faceMatrix ?? null;
    if (!matrix) {
      filterRef.current.reset();
      root.visible = false;
      return;
    }

    root.visible = true;
    const { position, quaternion } = getMetricBridgePose(matrix, mirrored);
    filterRef.current.setTarget(position, quaternion, 1.0);
    filterRef.current.update(delta);

    root.position.copy(filterRef.current.position);
    root.quaternion.copy(filterRef.current.quaternion);
    root.scale.setScalar(filterRef.current.scale);
  });

  return (
    <group ref={rootRef} name="PosePrimitiveRoot">
      {/* 3D Coordinate Axes: Red = +X (Right), Green = +Y (Up), Blue = +Z (Forward/Out of face) */}
      {showAxes && <axesHelper args={[axesSize]} />}

      {/* Small 3D Cube attached to the nose bridge */}
      {showCube && (
        <mesh position={[0, 0, 0]} renderOrder={999}>
          <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
          <meshStandardMaterial
            color="#ff0055"
            emissive="#550011"
            roughness={0.3}
            metalness={0.2}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Small bridge contact sphere */}
      <mesh position={[0, 0, 0]} renderOrder={1000}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ffb700" />
      </mesh>
    </group>
  );
}

export default PosePrimitive;
