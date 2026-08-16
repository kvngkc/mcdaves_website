// src/vto-lab/rendering/VTORenderer.tsx
/**
 * Three.js WebGL Renderer for VTO Lab.
 * Integrates 3D Head Depth Occlusion to naturally mask rear temples behind the head.
 */

'use client';

import React, { Suspense, MutableRefObject } from 'react';
import { Canvas } from '@react-three/fiber';
import VTOCamera from './VTOCamera';
import PosePrimitive from '../models/PosePrimitive';
import GlassesModel from '../models/GlassesModel';
import HeadOccluder from '../models/HeadOccluder';
import { FaceDetectionResult, ModelMeasurement, VTOActiveModel } from '../tracking/FaceTrackingTypes';

export interface VTORendererProps {
  detectionRef?: MutableRefObject<FaceDetectionResult | null>;
  faceMatrix?: Float32Array | null;
  mirrored?: boolean;
  activeModel: VTOActiveModel;
  showAxes: boolean;
  showCube: boolean;
  showGlasses: boolean;
  showHeadOcclusion?: boolean;
  debugOccluderMesh?: boolean;
  glbPath: string;
  frameSize: string;
  fovDegrees?: number;
  onModelMeasured?: (measurement: ModelMeasurement, scale: number) => void;
  onError?: (error: Error) => void;
}

export function VTORenderer({
  detectionRef,
  faceMatrix,
  mirrored = true,
  activeModel,
  showAxes,
  showCube,
  showGlasses,
  showHeadOcclusion = true,
  debugOccluderMesh = false,
  glbPath,
  frameSize,
  fovDegrees = 63.0,
  onModelMeasured,
  onError,
}: VTORendererProps) {
  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      frameloop="always"
      style={{
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <VTOCamera fov={fovDegrees} />

      <ambientLight intensity={1.0} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <directionalLight position={[-3, 2, 3]} intensity={0.6} />

      {/* 3D Physical Head Depth Occluder - Renders head volume into depth buffer */}
      {showHeadOcclusion && (
        <HeadOccluder
          detectionRef={detectionRef}
          faceMatrix={faceMatrix}
          mirrored={mirrored}
          debugVisible={debugOccluderMesh}
        />
      )}

      {/* Milestone 3: 3D Pose Primitive (Axes & Cube) - Instant, zero-suspense */}
      {(activeModel === 'axes' || activeModel === 'cube' || showAxes || showCube) && (
        <PosePrimitive
          detectionRef={detectionRef}
          faceMatrix={faceMatrix}
          mirrored={mirrored}
          showAxes={activeModel === 'axes' || showAxes}
          showCube={activeModel === 'cube' || showCube}
        />
      )}

      {/* Milestone 5: Calibrated GLB Eyewear */}
      {(activeModel === 'glasses' || showGlasses) && glbPath && (
        <Suspense fallback={null}>
          <GlassesModel
            glbPath={glbPath}
            frameSize={frameSize}
            detectionRef={detectionRef}
            faceMatrix={faceMatrix}
            mirrored={mirrored}
            showAxes={showAxes}
            showFitAnchor={false}
            onModelMeasured={onModelMeasured}
            onError={onError}
          />
        </Suspense>
      )}
    </Canvas>
  );
}

export default VTORenderer;
