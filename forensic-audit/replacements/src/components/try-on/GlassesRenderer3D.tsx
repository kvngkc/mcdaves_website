// src/components/try-on/GlassesRenderer3D.tsx
'use client';

import React, {
  MutableRefObject,
  Suspense,
  useEffect,
  useState,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { FaceDetectionResult } from '@/lib/try-on-types';
import GlassesModel from './GlassesModel';

export interface GlassesRenderer3DProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  detectionRef: MutableRefObject<FaceDetectionResult | null>;
  frameSize: string;
  glbPath: string;
  className?: string;
  onModelError?: (error?: Error) => void;
  debug?: boolean;
}

class ModelErrorBoundary extends React.Component<
  {
    onError?: (error: Error) => void;
    children: React.ReactNode;
  },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    return this.state.error ? null : this.props.children;
  }
}

function CameraProjection({
  videoRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const [fov, setFov] = useState(41.112);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        // MediaPipe's face-geometry projection convention uses a virtual
        // focal length equal to the frame width. This produces:
        // fovY = 2 * atan(frameHeight / (2 * frameWidth)).
        const nextFov =
          (2 * Math.atan(video.videoHeight / (2 * video.videoWidth)) * 180) /
          Math.PI;
        setFov(nextFov);
      }
    };

    update();
    video.addEventListener('loadedmetadata', update);
    video.addEventListener('resize', update);
    return () => {
      video.removeEventListener('loadedmetadata', update);
      video.removeEventListener('resize', update);
    };
  }, [videoRef]);

  return (
    <PerspectiveCamera
      makeDefault
      fov={fov}
      position={[0, 0, 0]}
      near={0.05}
      far={200}
    />
  );
}

export function GlassesRenderer3D({
  videoRef,
  detectionRef,
  frameSize,
  glbPath,
  className = '',
  onModelError,
  debug = false,
}: GlassesRenderer3DProps) {
  return (
    <div className={`absolute inset-0 w-full h-full ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          transform: 'scaleX(-1)',
          transformOrigin: 'center',
        }}
      >
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
          <CameraProjection videoRef={videoRef} />

          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 4, 4]} intensity={1.2} />
          <directionalLight position={[-3, 1, 2]} intensity={0.35} />

          <Suspense fallback={null}>
            <ModelErrorBoundary onError={onModelError}>
              <GlassesModel
                glbPath={glbPath}
                frameSize={frameSize}
                detectionRef={detectionRef}
                debug={debug}
              />
            </ModelErrorBoundary>
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute bottom-2 right-2 z-20 pointer-events-none bg-neutral-900/75 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white/80 border border-neutral-700/50">
        3D model: Glasses by Peter Tilley, CC BY 4.0
      </div>
    </div>
  );
}

export default GlassesRenderer3D;
