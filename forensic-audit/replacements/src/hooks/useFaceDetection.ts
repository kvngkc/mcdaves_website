// src/hooks/useFaceDetection.ts
'use client';

import { useCallback, useRef, useState } from 'react';
import { Matrix4, Euler, Quaternion, Vector3 } from 'three';
import {
  FaceDetectionResult,
  NormalizedLandmarks,
  Point3D,
} from '@/lib/try-on-types';
import { reportTryOnError } from '@/lib/try-on-reporter';

const MODEL_URL = '/models/face_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

interface FaceLandmarkerLike {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): {
    faceLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
    facialTransformationMatrixes?: Array<{ data: number[] | Float32Array }>;
  };
  close?: () => void;
}

let landmarkerInstance: FaceLandmarkerLike | null = null;
let loadPromise: Promise<FaceLandmarkerLike> | null = null;

async function createLandmarker(): Promise<FaceLandmarkerLike> {
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  const options = {
    runningMode: 'VIDEO' as const,
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
  };

  try {
    return (await FaceLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'GPU',
      },
    })) as unknown as FaceLandmarkerLike;
  } catch (gpuError) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[VTO] GPU delegate unavailable; retrying with CPU.', gpuError);
    }

    return (await FaceLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'CPU',
      },
    })) as unknown as FaceLandmarkerLike;
  }
}

export async function getOrCreateLandmarker(): Promise<FaceLandmarkerLike> {
  if (landmarkerInstance) return landmarkerInstance;
  if (!loadPromise) {
    loadPromise = createLandmarker()
      .then((instance) => {
        landmarkerInstance = instance;
        return instance;
      })
      .catch((error) => {
        loadPromise = null;
        throw error;
      });
  }
  return loadPromise;
}

export function destroyLandmarker(): void {
  landmarkerInstance?.close?.();
  landmarkerInstance = null;
  loadPromise = null;
}

function matrixToPose(matrix: Float32Array): {
  translation: Point3D;
  pitch: number;
  yaw: number;
  roll: number;
} {
  const m = new Matrix4().fromArray(matrix);
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  m.decompose(position, quaternion, scale);

  const euler = new Euler().setFromQuaternion(quaternion, 'YXZ');

  return {
    translation: { x: position.x, y: position.y, z: position.z },
    pitch: euler.x,
    yaw: euler.y,
    roll: euler.z,
  };
}

function processResult(
  result: ReturnType<FaceLandmarkerLike['detectForVideo']>,
  videoWidth: number,
  videoHeight: number,
): FaceDetectionResult | null {
  const raw = result.faceLandmarks?.[0];
  if (!raw) return null;

  const nose = raw[168] ?? raw[6];
  const leftPupil = raw[468] ?? raw[33];
  const rightPupil = raw[473] ?? raw[263];
  const leftTemple = raw[234] ?? raw[127];
  const rightTemple = raw[454] ?? raw[356];

  if (!nose || !leftPupil || !rightPupil) return null;

  const toPixels = (p: { x: number; y: number; z: number }): Point3D => ({
    x: p.x * videoWidth,
    y: p.y * videoHeight,
    z: p.z * videoWidth,
  });

  const noseBridge = toPixels(nose);
  const left = toPixels(leftPupil);
  const right = toPixels(rightPupil);
  const leftTemplePx = leftTemple ? toPixels(leftTemple) : left;
  const rightTemplePx = rightTemple ? toPixels(rightTemple) : right;

  const ipdPixels = Math.hypot(right.x - left.x, right.y - left.y);

  const matrixData = result.facialTransformationMatrixes?.[0]?.data;
  const faceMatrix = matrixData ? new Float32Array(matrixData) : null;

  const poseFromMatrix = faceMatrix
    ? matrixToPose(faceMatrix)
    : {
        translation: { ...noseBridge },
        pitch: 0,
        yaw: 0,
        roll: Math.atan2(right.y - left.y, right.x - left.x),
      };

  const landmarks: NormalizedLandmarks = {
    noseBridge,
    leftPupil: left,
    rightPupil: right,
    leftTemple: leftTemplePx,
    rightTemple: rightTemplePx,
    ipdPixels,
    pose: {
      ...poseFromMatrix,
      roll: poseFromMatrix.roll || Math.atan2(right.y - left.y, right.x - left.x),
    },
    confidence: 1,
  };

  return {
    faceMatrix,
    landmarks,
    videoWidth,
    videoHeight,
    confidence: 1,
  };
}

export function useFaceDetection() {
  const [isModelReady, setIsModelReady] = useState(Boolean(landmarkerInstance));
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  const latestResultRef = useRef<FaceDetectionResult | null>(null);
  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastStatePublishRef = useRef(0);

  const preloadModel = useCallback(async () => {
    try {
      await getOrCreateLandmarker();
      setIsModelReady(true);
      setError(null);
      return true;
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error(String(err));
      setError(normalized);
      reportTryOnError('MODEL_LOAD_FAILED');
      return false;
    }
  }, []);

  const detectFromVideo = useCallback(
    (video: HTMLVideoElement): FaceDetectionResult | null => {
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
      const landmarker = landmarkerInstance;
      if (!landmarker || video.videoWidth <= 0 || video.videoHeight <= 0) return null;

      try {
        const result = landmarker.detectForVideo(
          video,
          Math.round(video.currentTime * 1000),
        );
        const processed = processResult(result, video.videoWidth, video.videoHeight);
        latestResultRef.current = processed;
        return processed;
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[VTO] Face detection frame failed', err);
        }
        return null;
      }
    },
    [],
  );

  const start = useCallback(
    async (video: HTMLVideoElement) => {
      const ready = await preloadModel();
      if (!ready) throw error ?? new Error('Face model failed to load.');

      runningRef.current = true;
      setIsDetecting(true);
      lastVideoTimeRef.current = -1;

      const loop = () => {
        if (!runningRef.current) return;

        if (
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.currentTime !== lastVideoTimeRef.current
        ) {
          lastVideoTimeRef.current = video.currentTime;
          const result = detectFromVideo(video);
          const now = performance.now();

          // Publish UI state at 10 Hz; the renderer consumes latestResultRef at frame rate.
          if (now - lastStatePublishRef.current >= 100) {
            lastStatePublishRef.current = now;
            setFaceDetected(Boolean(result?.faceMatrix));
          }
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    },
    [detectFromVideo, error, preloadModel],
  );

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsDetecting(false);
    setFaceDetected(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastVideoTimeRef.current = -1;
    latestResultRef.current = null;
  }, []);

  const destroy = useCallback(() => {
    stop();
    destroyLandmarker();
    setIsModelReady(false);
  }, [stop]);

  return {
    isModelReady,
    isDetecting,
    faceDetected,
    error,
    latestResultRef,
    preloadModel,
    detectFromVideo,
    start,
    stop,
    destroy,
  };
}

export default useFaceDetection;
