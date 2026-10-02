// src/vto-lab/VTOApp.tsx
/**
 * Isolated VTO Lab Application Container.
 * Clean, verified pipeline: Camera -> MediaPipe -> 3D Pose -> Three.js -> Calibrated GLB.
 * Features zero-latency mutable ref updates for high-speed 60 FPS 3D tracking.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCameraController } from './camera/CameraController';
import {
  initFaceLandmarker,
  processFaceLandmarks,
} from './tracking/FaceLandmarker';
import {
  FaceDetectionResult,
  LetterboxViewport,
  ModelMeasurement,
  VTOControlState,
} from './tracking/FaceTrackingTypes';
import VTOVideo, { computeLetterboxViewport } from './components/VTOVideo';
import VTOCanvas from './components/VTOCanvas';
import LandmarkCanvas2D from './components/LandmarkCanvas2D';
import VTODebugOverlay from './components/VTODebugOverlay';
import VTOControls from './components/VTOControls';

export function VTOApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [containerSize, setContainerSize] = useState({ width: 640, height: 480 });
  const [viewport, setViewport] = useState<LetterboxViewport>({
    left: 0,
    top: 0,
    width: 640,
    height: 480,
    videoWidth: 640,
    videoHeight: 480,
    containerWidth: 640,
    containerHeight: 480,
  });

  const [controls, setControls] = useState<VTOControlState>({
    activeModel: 'glasses', // Default to glasses
    showAxes: false,
    showCube: false,
    showGlasses: true,
    showLandmarks2D: false,
    mirrorPresentation: true,
    debugOverlay: true,
    selectedGlb: '/models/glasses.glb',
    frameSize: '52□18-140',
    fovDegrees: 63.0,
    showHeadOcclusion: true,
    debugOccluderMesh: false,
  });

  const [detectorReady, setDetectorReady] = useState(false);
  const [detectorError, setDetectorError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<FaceDetectionResult | null>(null);
  const [modelMeasurement, setModelMeasurement] = useState<ModelMeasurement | null>(null);
  const [modelScale, setModelScale] = useState<number>(1.0);

  // Mutable ref for zero-latency 60 FPS 3D tracking
  const latestDetectionRef = useRef<FaceDetectionResult | null>(null);
  const lastUiUpdateRef = useRef<number>(0);

  const landmarkerRef = useRef<Awaited<ReturnType<typeof initFaceLandmarker>> | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  // 1. Camera Lifecycle
  const {
    stream,
    videoWidth,
    videoHeight,
    isStreaming,
    isLoading: cameraLoading,
    error: cameraError,
    startCamera,
    stopCamera,
    attachVideo,
  } = useCameraController({ autoStart: true });

  // 2. Measure Container Dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setContainerSize({ width, height });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 3. Compute Letterbox Viewport
  useEffect(() => {
    const vp = computeLetterboxViewport(
      containerSize.width,
      containerSize.height,
      videoWidth || 640,
      videoHeight || 480,
    );
    queueMicrotask(() => setViewport(vp));
  }, [containerSize, videoWidth, videoHeight]);

  // 4. Initialize MediaPipe Detector
  const loadDetector = useCallback(async () => {
    queueMicrotask(() => {
      setDetectorReady(false);
      setDetectorError(null);
    });

    try {
      const landmarker = await initFaceLandmarker();
      landmarkerRef.current = landmarker;
      setDetectorReady(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDetectorError(msg);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadDetector();
    });
  }, [loadDetector]);

  // 5. High-Speed Detection Frame Loop (Zero-Latency Mutable Ref)
  useEffect(() => {
    if (!isStreaming || !detectorReady || !landmarkerRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    runningRef.current = true;

    const detectLoop = () => {
      if (!runningRef.current) return;

      if (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        try {
          const nowMs = performance.now();
          const raw = landmarkerRef.current!.detectForVideo(video, nowMs);
          const processed = processFaceLandmarks(
            raw,
            video.videoWidth,
            video.videoHeight,
            nowMs,
          );

          // Write directly to mutable ref for zero-latency Three.js consumption
          latestDetectionRef.current = processed;

          // Throttle React state update for HUD/2D canvas to 10 Hz (every 100ms)
          if (nowMs - lastUiUpdateRef.current >= 100) {
            lastUiUpdateRef.current = nowMs;
            setDetectionResult(processed);
          }
        } catch (detectErr) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[VTO-Lab] Detection frame exception:', detectErr);
          }
        }
      }

      rafRef.current = requestAnimationFrame(detectLoop);
    };

    rafRef.current = requestAnimationFrame(detectLoop);

    return () => {
      runningRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isStreaming, detectorReady]);

  // Video Ref Callback
  const handleVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      attachVideo(el);
    },
    [attachVideo],
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8 flex flex-col items-center justify-start space-y-6">
      {/* Stage Header */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            Isolated VTO Lab
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Strict 6-DOF Milestone Verification & Physical Calibration Environment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
              isStreaming
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : cameraLoading
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            Camera: {isStreaming ? 'LIVE' : cameraLoading ? 'STARTING...' : 'STOPPED'}
          </span>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
              detectorReady
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : detectorError
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            Detector: {detectorReady ? 'READY' : detectorError ? 'ERROR' : 'LOADING...'}
          </span>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl aspect-[4/3] bg-black rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl flex items-center justify-center"
      >
        {/* Milestone 1: Camera Feed */}
        <VTOVideo
          ref={handleVideoRef}
          stream={stream}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          mirrored={controls.mirrorPresentation}
        />

        {/* Milestone 2: Optional 2D Landmark Overlay */}
        <LandmarkCanvas2D
          detection={detectionResult}
          viewport={viewport}
          mirrored={controls.mirrorPresentation}
          enabled={controls.showLandmarks2D}
        />

        {/* Milestone 3 & 5: Three.js WebGL Canvas (Axes/Cube/GLB) with Zero-Latency Ref */}
        <VTOCanvas
          viewport={viewport}
          mirrored={controls.mirrorPresentation}
          detectionRef={latestDetectionRef}
          faceMatrix={detectionResult?.faceMatrix ?? null}
          activeModel={controls.activeModel}
          showAxes={controls.showAxes}
          showCube={controls.showCube}
          showGlasses={controls.showGlasses}
          showHeadOcclusion={controls.showHeadOcclusion}
          debugOccluderMesh={controls.debugOccluderMesh}
          glbPath={controls.selectedGlb}
          frameSize={controls.frameSize}
          fovDegrees={controls.fovDegrees}
          onModelMeasured={(m, s) => {
            setModelMeasurement(m);
            setModelScale(s);
          }}
          onError={(err) => console.error('[VTO-Lab] Model render error:', err)}
        />

        {/* Real-time Telemetry & Diagnostics HUD */}
        <VTODebugOverlay
          detection={detectionResult}
          viewport={viewport}
          activeModel={controls.activeModel}
          modelMeasurement={modelMeasurement}
          modelScale={modelScale}
          fovDegrees={controls.fovDegrees}
          mirrored={controls.mirrorPresentation}
          enabled={controls.debugOverlay}
        />

        {/* Camera Failure Overlay */}
        {cameraError && (
          <div className="absolute inset-0 z-50 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold">
              !
            </div>
            <h3 className="text-base font-bold text-white">Camera Access Denied or Unavailable</h3>
            <p className="text-xs text-neutral-400 max-w-sm">{cameraError.message}</p>
            <button
              onClick={() => startCamera()}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Retry Camera Permission
            </button>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="w-full max-w-4xl">
        <VTOControls
          state={controls}
          onChange={setControls}
          onReloadDetector={loadDetector}
          onRestartCamera={startCamera}
        />
      </div>
    </div>
  );
}

export default VTOApp;
