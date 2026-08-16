// src/components/try-on/GlassesModel.tsx
'use client';

import React, { MutableRefObject, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  Box3,
  Group,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three';
import {
  FaceDetectionResult,
} from '@/lib/try-on-types';
import {
  getAssetCalibration,
  parseFrameWidthMm,
} from './calibration';

export interface GlassesModelProps {
  glbPath: string;
  frameSize: string;
  detectionRef: MutableRefObject<FaceDetectionResult | null>;
  debug?: boolean;
}

function GlassesModelInner({
  glbPath,
  frameSize,
  detectionRef,
  debug = false,
}: GlassesModelProps) {
  const { scene } = useGLTF(glbPath);
  const rootRef = useRef<Group>(null);
  const assetCalib = useMemo(() => getAssetCalibration(glbPath), [glbPath]);

  const prepared = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((object) => {
      const mesh = object as typeof object & {
        isMesh?: boolean;
        castShadow?: boolean;
        receiveShadow?: boolean;
      };

      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const material = (mesh as typeof mesh & { material?: unknown }).material;
        const materials = Array.isArray(material) ? material : [material];
        materials.forEach((entry) => {
          if (
            entry &&
            typeof entry === 'object' &&
            'depthTest' in entry &&
            'depthWrite' in entry
          ) {
            (entry as { depthTest: boolean; depthWrite: boolean }).depthTest = true;
            (entry as { depthTest: boolean; depthWrite: boolean }).depthWrite = true;
          }
        });
      }
    });

    // Registration happens once in model space. After this operation the
    // physical bridge anchor is exactly the local origin.
    clone.position.set(
      -assetCalib.bridge.x,
      -assetCalib.bridge.y,
      -assetCalib.bridge.z,
    );
    clone.updateMatrixWorld(true);

    const bounds = new Box3().setFromObject(clone);
    const size = new Vector3();
    bounds.getSize(size);

    if (size.x <= 0) {
      throw new Error(`3D eyewear asset "${glbPath}" has zero width.`);
    }

    return {
      clone,
      nativeWidth: size.x,
    };
  }, [scene, glbPath, assetCalib]);

  const targetPosition = useRef(new Vector3());
  const targetQuaternion = useRef(new Quaternion());
  const targetScale = useRef(1);
  const initializedRef = useRef(false);

  const smoothedPosition = useRef(new Vector3());
  const smoothedQuaternion = useRef(new Quaternion());
  const smoothedScale = useRef(1);

  const frameWidthMm = useMemo(() => {
    const parsed = parseFrameWidthMm(frameSize);
    if (!parsed) {
      throw new Error(`Invalid optical frame size "${frameSize}". Expected lens□bridge-temple notation.`);
    }
    return parsed;
  }, [frameSize]);

  useFrame((_, delta) => {
    const root = rootRef.current;
    const detection = detectionRef.current;

    if (!root || !detection?.faceMatrix) return;

    const matrix = new Matrix4().fromArray(detection.faceMatrix);
    const facePosition = new Vector3();
    const faceRotation = new Quaternion();
    const faceScale = new Vector3();
    matrix.decompose(facePosition, faceRotation, faceScale);

    // MediaPipe's canonical landmark 168 is the bridge anchor used by the
    // face transformation matrix. This point is transformed into metric
    // camera space, so Z is real estimated face depth rather than a constant.
    const canonicalBridge = new Vector3(
      0,
      3.271027,
      5.236015,
    );
    canonicalBridge.applyMatrix4(matrix);

    targetPosition.current.copy(canonicalBridge);
    targetQuaternion.current.copy(faceRotation);

    // MediaPipe metric space is centimeters. Match the actual optical frame
    // width to the GLB's measured native width; perspective then handles
    // apparent size automatically as the face moves toward/away from camera.
    targetScale.current =
      (frameWidthMm / 10 / prepared.nativeWidth) *
      assetCalib.widthMultiplier;

    if (!initializedRef.current) {
      smoothedPosition.current.copy(targetPosition.current);
      smoothedQuaternion.current.copy(targetQuaternion.current);
      smoothedScale.current = targetScale.current;
      initializedRef.current = true;
    }

    // Frame-rate independent smoothing. Quaternion.slerp avoids Euler-angle
    // discontinuities and prevents the "swing wildly on head turn" failure.
    const positionAlpha = 1 - Math.exp(-18 * delta);
    const rotationAlpha = 1 - Math.exp(-22 * delta);
    const scaleAlpha = 1 - Math.exp(-18 * delta);

    smoothedPosition.current.lerp(targetPosition.current, positionAlpha);
    smoothedQuaternion.current.slerp(targetQuaternion.current, rotationAlpha);
    smoothedScale.current +=
      (targetScale.current - smoothedScale.current) * scaleAlpha;

    root.position.copy(smoothedPosition.current);
    root.quaternion.copy(smoothedQuaternion.current);
    root.scale.setScalar(smoothedScale.current);
  });

  return (
    <group ref={rootRef} name="GlassesRoot">
      <primitive object={prepared.clone} />

      {debug && (
        <group name="FitAnchorDebug">
          <mesh position={[0, 0, 0]} renderOrder={999}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshBasicMaterial color="#ffb700" depthTest={false} />
          </mesh>
          <axesHelper args={[3]} />
        </group>
      )}
    </group>
  );
}

export const GlassesModel = React.memo(GlassesModelInner);
export default GlassesModel;
