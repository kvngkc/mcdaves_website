// src/vto-lab/components/VTODebugOverlay.tsx
/**
 * Real-time Telemetry & Diagnostic HUD for VTO Lab.
 * Reports FPS, Camera resolution, Matrix pose, and Model measurements.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  FaceDetectionResult,
  LetterboxViewport,
  ModelMeasurement,
  VTOActiveModel,
} from '../tracking/FaceTrackingTypes';

export interface VTODebugOverlayProps {
  detection: FaceDetectionResult | null;
  viewport: LetterboxViewport;
  activeModel: VTOActiveModel;
  modelMeasurement: ModelMeasurement | null;
  modelScale: number;
  fovDegrees: number;
  mirrored: boolean;
  enabled?: boolean;
}

export function VTODebugOverlay({
  detection,
  viewport,
  activeModel,
  modelMeasurement,
  modelScale,
  fovDegrees,
  mirrored,
  enabled = true,
}: VTODebugOverlayProps) {
  const [fps, setFps] = useState<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animId: number;

    const calcFps = () => {
      frameCountRef.current += 1;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      animId = requestAnimationFrame(calcFps);
    };

    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!enabled) return null;

  const hasMatrix = Boolean(detection?.faceMatrix);
  const pose = detection?.pose;

  return (
    <div className="absolute top-4 left-4 z-40 bg-neutral-950/90 backdrop-blur-md border border-emerald-500/40 rounded-xl p-4 text-white font-mono text-[11px] space-y-2.5 max-w-xs shadow-2xl pointer-events-none select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <span className="text-emerald-400 font-bold tracking-wider uppercase">
          VTO Lab Diagnostics
        </span>
        <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
          {fps} FPS
        </span>
      </div>

      {/* Camera & Viewport */}
      <div className="space-y-1">
        <div className="text-neutral-400 font-semibold text-[10px] uppercase">
          Video & Viewport
        </div>
        <div className="grid grid-cols-2 gap-x-2 text-neutral-300">
          <div>
            Video: <span className="text-white">{viewport.videoWidth}×{viewport.videoHeight}</span>
          </div>
          <div>
            Display: <span className="text-white">{Math.round(viewport.width)}×{Math.round(viewport.height)}</span>
          </div>
          <div>
            Letterbox X: <span className="text-white">{Math.round(viewport.left)}px</span>
          </div>
          <div>
            Letterbox Y: <span className="text-white">{Math.round(viewport.top)}px</span>
          </div>
          <div>
            Camera FOV: <span className="text-cyan-300">{fovDegrees.toFixed(1)}°</span>
          </div>
          <div>
            Mirror: <span className="text-white">{mirrored ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>

      {/* Face Tracking */}
      <div className="space-y-1 border-t border-neutral-800/80 pt-1.5">
        <div className="text-neutral-400 font-semibold text-[10px] uppercase">
          Face Tracking
        </div>
        <div className="grid grid-cols-2 gap-x-2 text-neutral-300">
          <div>
            Status:{' '}
            <span className={hasMatrix ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {hasMatrix ? 'LOCKED' : 'SEARCHING'}
            </span>
          </div>
          <div>
            Landmarks: <span className="text-white">{detection?.rawLandmarks.length ?? 0}</span>
          </div>
          <div>
            Matrix: <span className={hasMatrix ? 'text-emerald-400' : 'text-neutral-500'}>{hasMatrix ? '4×4 6-DOF' : 'NONE'}</span>
          </div>
          <div>
            IPD: <span className="text-white">{detection?.ipdPixels.toFixed(1) ?? '—'} px</span>
          </div>
        </div>
      </div>

      {/* 6-DOF Pose */}
      <div className="space-y-1 border-t border-neutral-800/80 pt-1.5">
        <div className="text-neutral-400 font-semibold text-[10px] uppercase">
          Metric Pose (Camera Space cm)
        </div>
        {pose ? (
          <div className="grid grid-cols-3 gap-x-2 text-neutral-300 text-[10px]">
            <div>
              X: <span className="text-amber-300">{pose.translation.x.toFixed(2)}</span>
            </div>
            <div>
              Y: <span className="text-amber-300">{pose.translation.y.toFixed(2)}</span>
            </div>
            <div>
              Z: <span className="text-amber-300">{pose.translation.z.toFixed(2)}</span>
            </div>
            <div>
              Yaw: <span className="text-cyan-300">{((pose.yaw * 180) / Math.PI).toFixed(1)}°</span>
            </div>
            <div>
              Pitch: <span className="text-cyan-300">{((pose.pitch * 180) / Math.PI).toFixed(1)}°</span>
            </div>
            <div>
              Roll: <span className="text-cyan-300">{((pose.roll * 180) / Math.PI).toFixed(1)}°</span>
            </div>
          </div>
        ) : (
          <div className="text-neutral-500 italic text-[10px]">No pose detected</div>
        )}
      </div>

      {/* Active 3D Model */}
      <div className="space-y-1 border-t border-neutral-800/80 pt-1.5">
        <div className="text-neutral-400 font-semibold text-[10px] uppercase">
          Active 3D Model ({activeModel.toUpperCase()})
        </div>
        {modelMeasurement ? (
          <div className="space-y-0.5 text-[10px] text-neutral-300">
            <div>
              Native Dimensions:{' '}
              <span className="text-white">
                {modelMeasurement.nativeWidth.toFixed(2)} × {modelMeasurement.nativeHeight.toFixed(2)} × {modelMeasurement.nativeDepth.toFixed(2)}
              </span>
            </div>
            <div>
              Computed Scale: <span className="text-amber-300 font-bold">{modelScale.toFixed(5)}</span>
            </div>
          </div>
        ) : (
          <div className="text-neutral-500 italic text-[10px]">
            {activeModel === 'none' ? 'No model active' : 'Primitive mode active'}
          </div>
        )}
      </div>
    </div>
  );
}

export default VTODebugOverlay;
