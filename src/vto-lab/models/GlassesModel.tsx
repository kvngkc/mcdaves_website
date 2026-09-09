// src/vto-lab/models/GlassesModel.tsx
/**
 * 3D Eyewear Model Component for VTO Lab.
 * Anchored to the detected nose bridge landmark in metric 3D camera space.
 * Supports both mutable detectionRef for zero-latency 60 FPS updates and direct faceMatrix prop.
 */

'use client';

import React, { useMemo, useRef, useEffect, MutableRefObject, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group } from 'three';
import { getCalibrationForGlb } from '../calibration/calibrationRegistry';
import { calculateModelScale } from './ModelCalibration';
import { prepareGlassesModel } from './ModelLoader';
import { getMetricBridgePose } from '../pose/CoordinateTransform';
import { PoseFilter } from '../pose/FacePose';
import { FaceDetectionResult, ModelMeasurement } from '../tracking/FaceTrackingTypes';

export interface GlassesModelProps {
  glbPath: string;
  frameSize: string;
  detectionRef?: MutableRefObject<FaceDetectionResult | null>;
  faceMatrix?: Float32Array | null;
  mirrored?: boolean;
  showAxes?: boolean;
  showFitAnchor?: boolean;
  clipTemples?: boolean;
  templeDepthCutoff?: number;
  onModelMeasured?: (measurement: ModelMeasurement, scale: number) => void;
  onError?: (error: Error) => void;
}

export function GlassesModel({
  glbPath,
  frameSize,
  detectionRef,
  faceMatrix,
  mirrored = true,
  showAxes = false,
  showFitAnchor = false,
  clipTemples = true,
  templeDepthCutoff = 2.5,
  onModelMeasured,
}: GlassesModelProps) {
  const rootRef = useRef<Group>(null);
  const filterRef = useRef(new PoseFilter(45.0, 50.0, 40.0));

  const { scene } = useGLTF(glbPath);

  const calibration = useMemo(() => getCalibrationForGlb(glbPath), [glbPath]);

  const [prepared, setPrepared] = useState<any>(null);

  useEffect(() => {
    if (!scene) {
      setPrepared(null);
      return;
    }

    const newPrepared = prepareGlassesModel(scene as Group, calibration, clipTemples, templeDepthCutoff);
    setPrepared(newPrepared);

    // Clean up only the cloned materials when this specific instance unmounts.
    // Do NOT dispose geometry, as it is shared via the useGLTF cache.
    return () => {
      if (newPrepared && newPrepared.root) {
        newPrepared.root.traverse((child) => {
          const mesh = child as any;
          if (mesh.isMesh && mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
      }
    };
  }, [scene, calibration, clipTemples, templeDepthCutoff]);

  const { scale } = useMemo(() => {
    const nativeW = prepared?.measurements.nativeWidth || calibration.measuredNativeWidth;
    return calculateModelScale(
      frameSize || calibration.defaultFrameSize,
      nativeW,
      calibration,
    );
  }, [frameSize, calibration, prepared]);

  useEffect(() => {
    if (prepared && onModelMeasured) {
      onModelMeasured(prepared.measurements, scale);
    }
  }, [prepared, scale, onModelMeasured]);

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

    filterRef.current.setTarget(position, quaternion, scale);
    filterRef.current.update(delta);

    root.position.copy(filterRef.current.position);
    root.quaternion.copy(filterRef.current.quaternion);
    root.scale.setScalar(filterRef.current.scale);
  });

  if (!prepared) return null;

  return (
    <group ref={rootRef} name="VTO_GlassesRoot" visible={true}>
      <primitive object={prepared.root} />

      {showFitAnchor && (
        <mesh position={[0, 0, 0]} renderOrder={1000}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial color="#ffaa00" depthTest={false} />
        </mesh>
      )}

      {showAxes && <axesHelper args={[4]} />}
    </group>
  );
}

export default GlassesModel;
