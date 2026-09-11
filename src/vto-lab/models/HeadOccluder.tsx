// src/vto-lab/models/HeadOccluder.tsx
/**
 * Real-Time 3D Head & Ear Depth Occluder for VTO Lab.
 *
 * Writes the rear cranium and ear volume into the WebGL depth buffer with colorWrite=false.
 * Specifically tuned so its front surface stays strictly behind Z = -1.7 cm (behind the face plane),
 * occluding the rear temple arms during yaw head rotations (15°–60°) WITHOUT clipping any part
 * of the front frame, lenses, or cheeks.
 */

'use client';

import React, { useRef, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { getMetricBridgePose } from '../pose/CoordinateTransform';
import { PoseFilter } from '../pose/FacePose';
import { FaceDetectionResult } from '../tracking/FaceTrackingTypes';

export interface HeadOccluderProps {
  detectionRef?: MutableRefObject<FaceDetectionResult | null>;
  faceMatrix?: Float32Array | null;
  mirrored?: boolean;
  debugVisible?: boolean; // Set to true to visualize the occluder geometry for diagnostics
}

export function HeadOccluder({
  detectionRef,
  faceMatrix,
  mirrored = true,
  debugVisible = false,
}: HeadOccluderProps) {
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
    <group ref={rootRef} name="VTO_HeadOccluderRoot" renderOrder={-1}>
      {/* 
        Head & Cranium Volume Occluder:
        Positioned strictly behind the face plane relative to Landmark 168 (Nose bridge):
        - Cranium center: (0, -1.5, -7.5) with radius 5.8 cm -> front apex at Z = -1.7 cm
        - Side/Ear cylinders: positioned at temples to occlude ear hooks without extending into cheeks
      */}
      <group position={[0, 0, 0]}>
        {/* Rear Cranium Sphere */}
        <mesh position={[0, -1.5, -7.5]} renderOrder={-1}>
          <sphereGeometry args={[5.8, 16, 12]} />
          <meshBasicMaterial
            colorWrite={debugVisible}
            depthWrite={true}
            depthTest={true}
            color="#00ff88"
            wireframe={debugVisible}
            transparent={debugVisible}
            opacity={debugVisible ? 0.35 : 1.0}
          />
        </mesh>

        {/* Mid-Head / Jaw Volume behind cheeks */}
        <mesh position={[0, -3.5, -6.5]} renderOrder={-1}>
          <cylinderGeometry args={[4.8, 4.0, 7.0, 16]} />
          <meshBasicMaterial
            colorWrite={debugVisible}
            depthWrite={true}
            depthTest={true}
            color="#0088ff"
            wireframe={debugVisible}
            transparent={debugVisible}
            opacity={debugVisible ? 0.35 : 1.0}
          />
        </mesh>

        {/* Left Ear / Temple Occluder Block */}
        <mesh position={[-6.2, -1.5, -5.0]} renderOrder={-1}>
          <sphereGeometry args={[2.8, 12, 12]} />
          <meshBasicMaterial
            colorWrite={debugVisible}
            depthWrite={true}
            depthTest={true}
            color="#ff8800"
            wireframe={debugVisible}
            transparent={debugVisible}
            opacity={debugVisible ? 0.35 : 1.0}
          />
        </mesh>

        {/* Right Ear / Temple Occluder Block */}
        <mesh position={[6.2, -1.5, -5.0]} renderOrder={-1}>
          <sphereGeometry args={[2.8, 12, 12]} />
          <meshBasicMaterial
            colorWrite={debugVisible}
            depthWrite={true}
            depthTest={true}
            color="#ff8800"
            wireframe={debugVisible}
            transparent={debugVisible}
            opacity={debugVisible ? 0.35 : 1.0}
          />
        </mesh>
      </group>
    </group>
  );
}

export default HeadOccluder;
