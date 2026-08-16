// src/components/try-on/TryOnShell.tsx
'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Camera,
  Upload,
  RefreshCw,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react';
import { Modal, Button, Badge } from '@/components/ui';
import { Product } from '@/lib/types';
import { TryOnShellProps } from '@/lib/try-on-types';
import { useTryOnState } from '@/hooks/useTryOnState';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import dynamic from 'next/dynamic';
import { PermissionGate } from './PermissionGate';
import { AlignmentGuide } from './AlignmentGuide';
import { PhotoFallback } from './PhotoFallback';
import { useCart } from '@/hooks/useCart';
import { siteConfig } from '@/data/site-config';

const GlassesRenderer3D = dynamic(() => import('./GlassesRenderer3D'), {
  ssr: false,
});

export function TryOnShell({
  open,
  onClose,
  product,
  initialTier = 'auto',
}: TryOnShellProps) {
  const { addItem, openDrawer } = useCart();

  const {
    state,
    errorMessage,
    handlePermissionGranted,
    handlePermissionDenied,
    handleModelLoaded,
    handleModelError,
    handleFaceDetected,
    handleFaceLost,
    handleFaceRefound,
    switchToPhotoFallback,
    switchToCarouselFallback,
  } = useTryOnState({ open, initialTier });

  const { stream, startCamera, stopCamera } = useCamera();
  const {
    isModelReady,
    error: detectionError,
    faceDetected,
    latestResultRef,
    start: startDetection,
    stop: stopDetection,
  } = useFaceDetection();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const detectionStartedRef = useRef(false);

  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });
  const [containerSize, setContainerSize] = useState({ width: 640, height: 480 });
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [modelErrorMessage, setModelErrorMessage] = useState<string>('');
  const [, setDebugTick] = useState(0);

  const isLiveState =
    state === 'loading_model' ||
    state === 'detecting_face' ||
    state === 'tracking' ||
    state === 'face_lost';

  const viewport = useMemo(() => {
    const videoAspect = videoSize.width / videoSize.height;
    const containerAspect = containerSize.width / containerSize.height;

    if (!Number.isFinite(videoAspect) || videoAspect <= 0) {
      return { left: 0, top: 0, width: containerSize.width, height: containerSize.height };
    }

    if (videoAspect > containerAspect) {
      const width = containerSize.width;
      const height = width / videoAspect;
      return {
        left: 0,
        top: (containerSize.height - height) / 2,
        width,
        height,
      };
    }

    const height = containerSize.height;
    const width = height * videoAspect;
    return {
      left: (containerSize.width - width) / 2,
      top: 0,
      width,
      height,
    };
  }, [containerSize, videoSize]);

  // Keep the outer camera stage and the inner video/3D viewport dimensionally identical.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setContainerSize({ width, height });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Attach stream and capture the actual camera dimensions.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    if (video.srcObject !== stream) video.srcObject = stream;

    const updateVideoSize = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoSize({
          width: video.videoWidth,
          height: video.videoHeight,
        });
      }
    };

    video.addEventListener('loadedmetadata', updateVideoSize);
    video.addEventListener('resize', updateVideoSize);

    video.play().catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[VTO] Video autoplay/playback was blocked', error);
      }
    });

    updateVideoSize();

    return () => {
      video.removeEventListener('loadedmetadata', updateVideoSize);
      video.removeEventListener('resize', updateVideoSize);
    };
  }, [stream]);

  // Start the single MediaPipe engine once the video is actually usable.
  useEffect(() => {
    if (!open || state !== 'loading_model' || !stream) return;

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const start = async () => {
      try {
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          await new Promise<void>((resolve) => {
            const ready = () => {
              video.removeEventListener('canplay', ready);
              resolve();
            };
            video.addEventListener('canplay', ready, { once: true });
          });
        }

        if (cancelled || detectionStartedRef.current) return;

        detectionStartedRef.current = true;
        await startDetection(video);

        if (!cancelled) handleModelLoaded();
      } catch (error) {
        detectionStartedRef.current = false;
        const normalized = error instanceof Error ? error : new Error(String(error));
        setModelErrorMessage(normalized.message);
        handleModelError(normalized);
      }
    };

    start();

    const timeout = window.setTimeout(() => {
      if (!detectionStartedRef.current && !cancelled) {
        const error = new Error('3D face-tracking initialization timed out. Switched to Photo mode.');
        setModelErrorMessage(error.message);
        handleModelError(error);
      }
    }, 15000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    open,
    state,
    stream,
    startDetection,
    handleModelLoaded,
    handleModelError,
  ]);

  useEffect(() => {
    if (!isDebugMode || !isLiveState) return;

    const timer = window.setInterval(() => {
      setDebugTick((tick) => tick + 1);
    }, 100);

    return () => window.clearInterval(timer);
  }, [isDebugMode, isLiveState]);

  // Drive UI state from the renderer's shared latest-result ref, not from a
  // per-frame React state update.
  useEffect(() => {
    if (!isLiveState) return;

    if (faceDetected) {
      if (state === 'detecting_face' || state === 'face_lost') {
        handleFaceDetected();
      }
    } else if (state === 'tracking') {
      handleFaceLost();
    }
  }, [
    faceDetected,
    isLiveState,
    state,
    handleFaceDetected,
    handleFaceLost,
  ]);

  // Stop detection and camera cleanly on close/unmount.
  useEffect(() => {
    if (!open) {
      detectionStartedRef.current = false;
      stopDetection();
      stopCamera();
      return;
    }

    return () => {
      detectionStartedRef.current = false;
      stopDetection();
      stopCamera();
    };
  }, [open, stopDetection, stopCamera]);

  useEffect(() => {
    if (detectionError && state === 'loading_model') {
      setModelErrorMessage(detectionError.message);
      handleModelError(detectionError);
    }
  }, [detectionError, state, handleModelError]);

  useEffect(() => {
    if (open && product && !product.glbModel && state === 'requesting_permission') {
      switchToCarouselFallback();
    }
  }, [open, product, state, switchToCarouselFallback]);

  const handleModelErrorWithFallback = useCallback(
    (error?: Error) => {
      const normalized = error ?? new Error('The 3D eyewear model could not be loaded.');
      setModelErrorMessage(normalized.message);
      handleModelError(normalized);
    },
    [handleModelError],
  );

  if (!product) return null;

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || siteConfig.whatsappNumber;
  const whatsappMsg = encodeURIComponent(
    `Hi McDaves! I'd like to inquire about trying on the ${product.name} frame (${product.sizes}).`,
  );

  const canRender3D = Boolean(product.glbModel && product.frameSize);

  return (
    <Modal
      open={open}
      onClose={() => {
        stopDetection();
        stopCamera();
        onClose();
      }}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-gold" />
          <span> Sightly Virtual Try-On — {product.name}</span>
        </div>
      }
      description="Preview frames live with calibrated 3D AR or upload your selfie photo."
    >
      <div className="space-y-6">
        {errorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-caption rounded-xl flex items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <Button variant="tertiary" size="sm" onClick={switchToPhotoFallback}>
              Use Photo Mode
            </Button>
          </div>
        )}

        {state === 'requesting_permission' && (
          <PermissionGate
            onRequestCamera={startCamera}
            onGrant={() => handlePermissionGranted()}
            onDeny={handlePermissionDenied}
            onSelectPhotoFallback={switchToPhotoFallback}
          />
        )}

        {(state === 'loading_model' ||
          state === 'detecting_face' ||
          state === 'tracking' ||
          state === 'face_lost') && (
          <div
            ref={containerRef}
            className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] border border-neutral-800 shadow-2xl"
          >
            <div
              className="absolute overflow-hidden"
              style={{
                left: viewport.left,
                top: viewport.top,
                width: viewport.width,
                height: viewport.height,
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="absolute inset-0 w-full h-full object-fill transform -scale-x-100"
                aria-label="Live camera preview for virtual glasses try-on"
              />

              {state === 'loading_model' ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-neutral-900/90 text-white space-y-3 text-center">
                  <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
                  <h4 className="text-body-md font-semibold">
                    Initializing Sightly 3D AR Engine...
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-sm">
                    Loading the on-device face model and calibrating the camera space.
                  </p>
                  {modelErrorMessage && (
                    <p className="text-xs text-red-300 max-w-sm">{modelErrorMessage}</p>
                  )}
                  <button
                    onClick={switchToPhotoFallback}
                    className="mt-2 px-4 py-2 bg-white text-black rounded-full text-xs font-semibold hover:bg-neutral-100 transition"
                  >
                    Use Photo Upload Instead
                  </button>
                </div>
              ) : canRender3D ? (
                <>
                  <GlassesRenderer3D
                    videoRef={videoRef}
                    detectionRef={latestResultRef}
                    frameSize={product.frameSize!}
                    glbPath={product.glbModel!}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    onModelError={handleModelErrorWithFallback}
                    debug={isDebugMode}
                  />

                  <AlignmentGuide
                    state={state}
                    confidence={faceDetected ? 1 : 0}
                    onSwitchToPhoto={switchToPhotoFallback}
                  />

                  <div className="absolute top-3 right-3 z-30">
                    <button
                      type="button"
                      onClick={() => setIsDebugMode((value) => !value)}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-full backdrop-blur-md border shadow-lg transition ${
                        isDebugMode
                          ? 'bg-emerald-500 text-black border-emerald-400 font-semibold'
                          : 'bg-neutral-900/80 hover:bg-neutral-800 text-white border-neutral-700/60'
                      }`}
                    >
                      {isDebugMode ? '3D Debug: ON' : '3D Debug'}
                    </button>
                  </div>

                  {isDebugMode && (
                    <div className="absolute top-3 left-3 z-40 bg-neutral-950/85 backdrop-blur-md border border-emerald-500/40 p-3 rounded-xl text-white font-mono text-[10px] space-y-1 min-w-[210px]">
                      <div className="text-emerald-400 font-bold uppercase tracking-wider">
                        Metric 3D Tracking
                      </div>
                      <div>
                        Face: {faceDetected ? 'LOCKED' : 'SEARCHING'}
                      </div>
                      <div>
                        Video: {videoSize.width}×{videoSize.height}
                      </div>
                      <div>
                        IPD: {latestResultRef.current?.landmarks.ipdPixels.toFixed(1) ?? '—'} px
                      </div>
                      <div>
                        Matrix Z:{' '}
                        {latestResultRef.current?.landmarks.pose.translation.z.toFixed(2) ?? '—'} cm
                      </div>
                      <div>
                        Yaw:{' '}
                        {latestResultRef.current
                          ? ((latestResultRef.current.landmarks.pose.yaw * 180) / Math.PI).toFixed(1)
                          : '—'}
                        °
                      </div>
                      <div>
                        Pitch:{' '}
                        {latestResultRef.current
                          ? ((latestResultRef.current.landmarks.pose.pitch * 180) / Math.PI).toFixed(1)
                          : '—'}
                        °
                      </div>
                      <div>
                        Roll:{' '}
                        {latestResultRef.current
                          ? ((latestResultRef.current.landmarks.pose.roll * 180) / Math.PI).toFixed(1)
                          : '—'}
                        °
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-neutral-900 text-white text-center">
                  <p className="text-sm font-semibold">
                    This frame is not yet configured with a calibrated 3D model.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={switchToPhotoFallback}
                    className="mt-4"
                  >
                    Use Photo Mode
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {state === 'photo_fallback' && (
          <PhotoFallback
            product={product}
            onCaptureSnapshot={() => {}}
            onClose={() => {
              stopCamera();
              onClose();
            }}
          />
        )}

        {state === 'carousel_fallback' && (
          <div className="space-y-6">
            <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 text-center space-y-4">
              <Badge variant="gold" size="sm">
                Sightly Frame Dimensions
              </Badge>
              <h4 className="text-h3 text-neutral-900 font-semibold">{product.name}</h4>

              {!product.glbModel && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3 text-center">
                  3D AR preview is not configured for this frame yet.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                {product.images?.map((img, idx) => (
                  <div
                    key={`${product.id}-view-${idx}`}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-200 bg-white"
                  >
                    <Image
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-caption text-neutral-700 font-medium">
                <span className="bg-white px-3 py-1.5 rounded-lg border border-neutral-200">
                  Frame Dimensions: {product.sizes}
                </span>
                <span className="bg-white px-3 py-1.5 rounded-lg border border-neutral-200">
                  Material: {product.material}
                </span>
                <span className="bg-white px-3 py-1.5 rounded-lg border border-neutral-200">
                  Price: ₦{product.price.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={switchToPhotoFallback}
                leadingIcon={<Upload className="w-4 h-4" />}
              >
                Upload Photo to Try On
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    addItem(product, 1);
                    openDrawer();
                    onClose();
                  }}
                  leadingIcon={<ShoppingBag className="w-4 h-4" />}
                >
                  Shop Frame (₦{product.price.toLocaleString()})
                </Button>

                <a
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="whatsapp"
                    size="md"
                    leadingIcon={<MessageCircle className="w-4 h-4" />}
                  >
                    Chat on WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default TryOnShell;
