// src/hooks/useCamera.ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { UseCameraReturn } from '@/lib/try-on-types';
import { reportTryOnError } from '@/lib/try-on-reporter';

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setStream(null);
    setIsInitializing(false);
  }, []);

  // Start camera feed with WebRTC constraints & timeout
  const startCamera = useCallback(async (): Promise<MediaStream> => {
    stopCamera();
    setIsInitializing(true);
    setError(null);

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const err = new Error('WebRTC camera is not supported in this browser environment.');
      setError(err);
      setIsInitializing(false);
      reportTryOnError('CAMERA_PERMISSION_DENIED');
      throw err;
    }

    try {
      // AbortController for 1.5s timeout target
      const mediaPromise = navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Camera request timed out. Please allow camera access when prompted.')),
          15000,
        );
      });

      const mediaStream = (await Promise.race([mediaPromise, timeoutPromise])) as MediaStream;
      if (timeoutId) clearTimeout(timeoutId);

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsInitializing(false);
      return mediaStream;
    } catch (err: any) {
      const cameraErr = err instanceof Error ? err : new Error(String(err));
      setError(cameraErr);
      setIsInitializing(false);
      reportTryOnError('CAMERA_PERMISSION_DENIED');
      throw cameraErr;
    }
  }, [stopCamera]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // iOS Safari visibilitychange handling (re-attaches or stops stream if tab hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && streamRef.current) {
        // Pause active video tracks on tab hide to conserve resources
        streamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      } else if (!document.hidden && streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = true;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    stream,
    error,
    isInitializing,
    startCamera,
    stopCamera,
  };
}
