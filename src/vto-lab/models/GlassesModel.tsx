// src/vto-lab/models/GlassesModel.tsx
/**
 * 3D Eyewear Model Component for VTO Lab.
 * Anchored to the detected nose bridge landmark in metric 3D camera space.
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
  frameSize?: string;
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

const preparedModelCache = new Map<string, any>();

export function GlassesModel(props: GlassesModelProps) {
  const calibration = useMemo(() => getCalibrationForGlb(props.glbPath), [props.glbPath]);

  const isValid = useMemo(() => {
    if (!calibration) return false;
    return Boolean(
      calibration.measuredNativeWidth > 0 &&
      calibration.physicalDimensions.frameWidthMm &&
      calibration.physicalDimensions.frameWidthMm > 0,
    );
  }, [calibration]);

  if (!isValid) {
    console.warn('[VTO] Refusing to render: asset lacks required physical calibration evidence.');
    return null;
  }

  return <GlassesModelInner {...props} calibration={calibration!} />;
}

function GlassesModelInner({
  glbPath,
  frameSize,
  detectionRef,
  faceMatrix,
  mirrored = true,
  showAxes = false,
  showFitAnchor = false,
  clipTemples,
  templeDepthCutoff = 2.5,
  onModelMeasured,
  calibration,
}: GlassesModelProps & { calibration: any }) {
  const rootRef = useRef<Group>(null);
  const filterRef = useRef(new PoseFilter(45.0, 50.0, 40.0));

  const optimizedGlbPath = useMemo(() => {
    try {
      if (glbPath.includes('/storage/v1/object/public/vto-models/')) {
        const url = new URL(glbPath);
        return `/vto-models${url.pathname.split('/vto-models')[1]}`;
      }
    } catch {
      // Preserve the original URL when it cannot be parsed.
    }
    return glbPath;
  }, [glbPath]);

  const { scene } = useGLTF(optimizedGlbPath);
  const [prepared, setPrepared] = useState<any>(null);

  useEffect(() => {
    if (!scene) {
      setPrepared(null);
      return;
    }

    const activeClipTemples = clipTemples ?? calibration.useMaterialClipping;
    const cacheKey = `${glbPath}_${activeClipTemples}_${templeDepthCutoff}`;

    if (preparedModelCache.has(cacheKey)) {
      setPrepared(preparedModelCache.get(cacheKey));
      return;
    }

    const prepareAsync = async () => {
      try {
        const newPrepared = await prepareGlassesModel(scene as Group, calibration, activeClipTemples, templeDepthCutoff);
        preparedModelCache.set(cacheKey, newPrepared);
        setPrepared(newPrepared);
      } catch (err) {
        console.error('prepareGlassesModel error:', err);
      }
    };

    if (typeof requestIdleCallback !== 'undefined') requestIdleCallback(prepareAsync);
    else setTimeout(prepareAsync, 0);
  }, [scene, calibration, clipTemples, templeDepthCutoff, glbPath]);

  const scale = useMemo(() => {
    const nativeW = calibration.measuredNativeWidth || prepared?.measurements.nativeWidth;
    if (!nativeW) return 0;
    return calculateModelScale(frameSize || '', nativeW, calibration).scale;
  }, [frameSize, calibration, prepared]);

  useEffect(() => {
    if (prepared && onModelMeasured) onModelMeasured(prepared.measurements, scale);
  }, [prepared, scale, onModelMeasured]);

  useFrame((_, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const matrix = detectionRef?.current?.faceMatrix ?? faceMatrix ?? null;
    if (!matrix || !calibration || scale <= 0) {
      filterRef.current.reset();
      root.visible = false;
      return;
    }

    root.visible = true;
    const { position, quaternion } = getMetricBridgePose(matrix, mirrored, calibration.pantoscopicTilt);
    filterRef.current.setTarget(position, quaternion, scale);
    filterRef.current.update(delta);
    root.position.copy(filterRef.current.position);
    root.quaternion.copy(filterRef.current.quaternion);
    root.scale.setScalar(filterRef.current.scale);
  });

  if (!prepared || scale <= 0) return null;

  return (
    <group ref={rootRef} name="VTO_GlassesRoot" visible={true}>
      <primitive object={prepared.root} />
      {showFitAnchor && <mesh position={[0, 0, 0]} renderOrder={1000}><sphereGeometry args={[0.35, 16, 16]} /><meshBasicMaterial color="#ffaa00" depthTest={false} /></mesh>}
      {showAxes && <axesHelper args={[4]} />}
    </group>
  );
}

export default GlassesModel;
