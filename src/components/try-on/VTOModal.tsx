// src/components/try-on/VTOModal.tsx
/**
 * Canonical Customer-Facing Virtual Try-On Modal for McDaves
 * Consumes the verified isolated VTO Lab engine (src/vto-lab/) directly.
 * Strict Variant-First Architecture: Renders exact selected variant's GLB and physical calibration.
 */

'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  X,
  Camera,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { useCameraController } from '@/vto-lab/camera/CameraController';
import {
  initFaceLandmarker,
  processFaceLandmarks,
} from '@/vto-lab/tracking/FaceLandmarker';
import {
  FaceDetectionResult,
  LetterboxViewport,
  ModelMeasurement,
} from '@/vto-lab/tracking/FaceTrackingTypes';
import VTOVideo, { computeLetterboxViewport } from '@/vto-lab/components/VTOVideo';
import VTOCanvas from '@/vto-lab/components/VTOCanvas';

export interface VTOModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  variantName?: string;
  price?: number;
  glbPath: string;
  frameSize: string;
  onOrderIntent?: () => void;
}

export function VTOModal({
  open,
  onClose,
  productName,
  variantName,
  price,
  glbPath,
  frameSize,
  onOrderIntent,
}: VTOModalProps) {
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

  const [detectorReady, setDetectorReady] = useState(false);
  const [detectorError, setDetectorError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Reset modelLoaded when changing glbPath
  useEffect(() => {
    setModelLoaded(false);
  }, [glbPath]);

  // Mutable ref for zero-latency 60 FPS 3D tracking
  const latestDetectionRef = useRef<FaceDetectionResult | null>(null);
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
  } = useCameraController({ autoStart: open });

  // Manage camera on open/close
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [open, startCamera, stopCamera]);

  // 2. Container Resize Observer
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // 3. Compute Viewport for Three.js Canvas
  useEffect(() => {
    const vp = computeLetterboxViewport(
      containerSize.width,
      containerSize.height,
      videoWidth || 640,
      videoHeight || 480,
    );
    setViewport(vp);
  }, [containerSize, videoWidth, videoHeight]);

  // 4. Initialize MediaPipe Detector
  const loadDetector = useCallback(async () => {
    if (!open) return;
    setDetectorReady(false);
    setDetectorError(null);

    try {
      const landmarker = await initFaceLandmarker();
      landmarkerRef.current = landmarker;
      setDetectorReady(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDetectorError(msg);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      loadDetector();
    }
  }, [open, loadDetector]);

  const handleClose = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Ensure camera stops immediately on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      stopCamera();
    };
  }, [stopCamera]);

  // 5. 60 FPS Detection Loop
  useEffect(() => {
    if (!open || !isStreaming || !detectorReady || !landmarkerRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    runningRef.current = true;
    let lastDetectedTime = 0;

    const detectLoop = () => {
      if (!runningRef.current) return;

      if (
        video &&
        !video.paused &&
        !video.ended &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        landmarkerRef.current
      ) {
        try {
          const nowMs = performance.now();
          const raw = landmarkerRef.current.detectForVideo(video, nowMs);
          if (raw) {
            const processed = processFaceLandmarks(
              raw,
              video.videoWidth,
              video.videoHeight,
              nowMs,
            );

            // Zero-latency mutable ref write for Three.js renderer
            latestDetectionRef.current = processed;

            const isNowDetected = Boolean(processed && processed.faceMatrix);
            if (nowMs - lastDetectedTime > 200) {
              setFaceDetected(isNowDetected);
              lastDetectedTime = nowMs;
            }
          }
        } catch {
          // Keep loop resilient
        }
      }

      if (runningRef.current) {
        rafRef.current = requestAnimationFrame(detectLoop);
      }
    };

    rafRef.current = requestAnimationFrame(detectLoop);

    return () => {
      runningRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [open, isStreaming, detectorReady]);

  // Video Ref Callback
  const handleVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      attachVideo(el);
    },
    [attachVideo],
  );

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-neutral-950/85 backdrop-blur-md transition-all duration-300 animate-in fade-in"
    >
      <div className="relative w-full max-w-4xl bg-neutral-900 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl border-0 sm:border sm:border-neutral-800 flex flex-col h-[100dvh] sm:h-[min(88dvh,680px)] max-h-[100dvh] sm:max-h-[720px]">
        
        {/* Header Bar (Fixed / No Shrink) */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-neutral-800/80 bg-neutral-900/90 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-600/20 text-brand-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Virtual Try-On: {productName}
              </h2>
              <p className="text-xs text-neutral-400 truncate">
                {variantName ? `${variantName} · ` : ''}
                {frameSize} · Sightly by McDaves
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Face Tracking Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-xs font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  faceDetected
                    ? 'bg-emerald-400 animate-pulse'
                    : isStreaming
                    ? 'bg-amber-400'
                    : 'bg-neutral-500'
                }`}
              />
              <span className="text-neutral-300">
                {faceDetected
                  ? 'Face Tracked'
                  : isStreaming
                  ? 'Looking for face...'
                  : 'Starting Camera...'}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              aria-label="Close Virtual Try-On"
              className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main AR Fitting Viewport (Flexible / Dynamically Sized) */}
        <div
          ref={containerRef}
          className="relative flex-1 min-h-0 bg-black overflow-hidden flex items-center justify-center"
        >
          {/* Camera Feed */}
          <VTOVideo
            ref={handleVideoRef}
            stream={stream}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            videoWidth={videoWidth}
            videoHeight={videoHeight}
            mirrored={true}
          />

          {/* Three.js AR Eyewear Canvas with Depth Occlusion */}
          {glbPath && (
            <VTOCanvas
              viewport={viewport}
              mirrored={true}
              detectionRef={latestDetectionRef}
              activeModel="glasses"
              showAxes={false}
              showCube={false}
              showGlasses={true}
              showHeadOcclusion={true}
              glbPath={glbPath}
              frameSize={frameSize}
              fovDegrees={63.0}
              onModelMeasured={() => setModelLoaded(true)}
              onError={(err) => console.error('[VTO] Render error:', err)}
            />
          )}

          {/* 3D Model Loading State Indicator */}
          {!modelLoaded && isStreaming && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-neutral-950/80 backdrop-blur-md border border-brand-500/40 text-xs font-semibold text-brand-300 flex items-center gap-2 shadow-xl animate-in fade-in">
              <div className="w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading 3D Frame...</span>
            </div>
          )}

          {/* Guide Alignment Cue if Face Not Detected */}
          {isStreaming && !faceDetected && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-48 sm:w-56 h-64 sm:h-72 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center animate-pulse">
                <p className="text-xs font-semibold text-white/80 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  Center your face here
                </p>
              </div>
            </div>
          )}

          {/* Camera Error / Permission Gate */}
          {cameraError && (
            <div className="absolute inset-0 z-30 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-2xl font-bold">
                <Camera className="w-7 h-7" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-bold text-white mb-1">
                  Camera Access Required
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  To try this frame in live 3D AR, please allow camera access in your browser. No video is ever recorded or uploaded.
                </p>
              </div>
              <button
                onClick={() => startCamera()}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Enable Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Conversion Action Bar (Fixed / No Shrink / Safe Area Padded) */}
        <div className="flex-shrink-0 px-4 sm:px-5 py-3.5 sm:py-4 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-20 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <div className="text-center sm:text-left">
            <p className="text-xs font-medium text-neutral-400">
              Trying on: <span className="text-white font-semibold">{productName}</span>
              {variantName && <span className="text-brand-400"> ({variantName})</span>}
            </p>
            {price && (
              <p className="text-sm font-bold text-white">
                ₦{price.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onOrderIntent ? (
              <button
                onClick={() => {
                  handleClose();
                  onOrderIntent();
                }}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-green-900/30 flex items-center justify-center gap-2 active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Chat with us on WhatsApp</span>
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-all"
              >
                Close Fitting Room
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default VTOModal;
