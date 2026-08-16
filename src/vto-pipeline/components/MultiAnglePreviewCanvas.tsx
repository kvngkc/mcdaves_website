// src/vto-pipeline/components/MultiAnglePreviewCanvas.tsx
/**
 * 3D Multi-Angle Inspection & Preview Canvas.
 * Supports side-by-side/switch comparison between Source GLB and VTO Derived asset,
 * preset inspection angles (Front, 30° L/R, 45° L/R, Top), reference head volume, and Landmark 168.
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { AssetCalibrationMetadata } from '../types/AssetTypes';

export type InspectionAnglePreset =
  | 'front'
  | 'left-30'
  | 'right-30'
  | 'left-45'
  | 'right-45'
  | 'top'
  | 'free';

export interface MultiAnglePreviewCanvasProps {
  sourceScene?: THREE.Object3D | null;
  vtoScene?: THREE.Object3D | null;
  metadata?: AssetCalibrationMetadata | null;
  presetAngle: InspectionAnglePreset;
  showHeadReference?: boolean;
  showLandmark168?: boolean;
  showAxes?: boolean;
  showWireframe?: boolean;
  viewMode?: 'vto' | 'source' | 'both';
}

function SceneContent({
  sourceScene,
  vtoScene,
  metadata,
  presetAngle,
  showHeadReference = true,
  showLandmark168 = true,
  showAxes = true,
  showWireframe = false,
  viewMode = 'vto',
}: MultiAnglePreviewCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Apply wireframe toggle dynamically
  useEffect(() => {
    const applyWire = (obj?: THREE.Object3D | null) => {
      if (!obj) return;
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = (child as THREE.Mesh).material;
          const mats = Array.isArray(m) ? m : [m];
          mats.forEach((mat) => {
            if (mat && 'wireframe' in mat) {
              (mat as { wireframe: boolean }).wireframe = showWireframe;
            }
          });
        }
      });
    };
    applyWire(sourceScene);
    applyWire(vtoScene);
  }, [sourceScene, vtoScene, showWireframe]);

  // Handle camera presets
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const dist = 35; // cm
    switch (presetAngle) {
      case 'front':
        controls.object.position.set(0, 0, dist);
        break;
      case 'left-30':
        controls.object.position.set(-dist * Math.sin(Math.PI / 6), 0, dist * Math.cos(Math.PI / 6));
        break;
      case 'right-30':
        controls.object.position.set(dist * Math.sin(Math.PI / 6), 0, dist * Math.cos(Math.PI / 6));
        break;
      case 'left-45':
        controls.object.position.set(-dist * Math.sin(Math.PI / 4), 0, dist * Math.cos(Math.PI / 4));
        break;
      case 'right-45':
        controls.object.position.set(dist * Math.sin(Math.PI / 4), 0, dist * Math.cos(Math.PI / 4));
        break;
      case 'top':
        controls.object.position.set(0, dist, 0.001);
        break;
      case 'free':
      default:
        break;
    }
    controls.target.set(0, 0, 0);
    controls.update();
  }, [presetAngle]);

  // Compute metric scale for preview (in cm)
  const nativeW = metadata?.registration.measuredNativeWidth || 1.0;
  const frameWidthMm = metadata?.physicalDimensions.frameWidthMm || 124;
  const scale = (frameWidthMm / 10) / nativeW;

  return (
    <>
      <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.1} />

      <ambientLight intensity={0.9} />
      <directionalLight position={[10, 20, 15]} intensity={1.5} />
      <directionalLight position={[-10, 10, -10]} intensity={0.6} />

      {/* Grid Floor */}
      <gridHelper args={[60, 30, '#00ffaa', '#333333']} position={[0, -8, 0]} />

      {/* Coordinate Axes at Bridge Origin (0,0,0) */}
      {showAxes && <axesHelper args={[5]} />}

      {/* Landmark 168 Target Bridge Marker */}
      {showLandmark168 && (
        <group position={[0, 0, 0]}>
          <mesh renderOrder={999}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#ffaa00" />
          </mesh>
          <mesh renderOrder={998}>
            <ringGeometry args={[0.4, 0.5, 32]} />
            <meshBasicMaterial color="#ffaa00" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Reference Head Volume Occluder (Canonical Head Size in cm, strictly behind Z = -1.7 cm) */}
      {showHeadReference && (
        <group position={[0, 0, 0]}>
          {/* Cranium */}
          <mesh position={[0, -1.5, -7.5]}>
            <sphereGeometry args={[5.8, 32, 24]} />
            <meshBasicMaterial
              color="#00ffaa"
              wireframe={true}
              transparent={true}
              opacity={0.25}
            />
          </mesh>
          {/* Jaw & Head volume */}
          <mesh position={[0, -3.5, -6.5]}>
            <cylinderGeometry args={[4.8, 4.0, 7.0, 32]} />
            <meshBasicMaterial
              color="#0088ff"
              wireframe={true}
              transparent={true}
              opacity={0.25}
            />
          </mesh>
        </group>
      )}

      {/* Render VTO Derived Model */}
      {(viewMode === 'vto' || viewMode === 'both') && vtoScene && (
        <group scale={[scale, scale, scale]}>
          <primitive object={vtoScene} />
        </group>
      )}

      {/* Render Source Model (Offset slightly if in 'both' mode) */}
      {(viewMode === 'source' || viewMode === 'both') && sourceScene && (
        <group
          position={viewMode === 'both' ? [0, 6, 0] : [0, 0, 0]}
          scale={[scale, scale, scale]}
        >
          <primitive object={sourceScene} />
        </group>
      )}
    </>
  );
}

export function MultiAnglePreviewCanvas(props: MultiAnglePreviewCanvasProps) {
  return (
    <div className="w-full h-full relative bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-inner">
      <Canvas
        camera={{ position: [0, 0, 35], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}

export default MultiAnglePreviewCanvas;
