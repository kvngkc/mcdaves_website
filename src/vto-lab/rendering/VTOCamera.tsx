// src/vto-lab/rendering/VTOCamera.tsx
/**
 * Three.js PerspectiveCamera for VTO Lab.
 * Configured with FOV = 63.0 degrees to match MediaPipe Face Geometry metric camera.
 */

'use client';

import React from 'react';
import { PerspectiveCamera } from '@react-three/drei';

export interface VTOCameraProps {
  fov?: number;
  near?: number;
  far?: number;
}

export function VTOCamera({
  fov = 63.0,
  near = 0.1,
  far = 1000.0,
}: VTOCameraProps) {
  return (
    <PerspectiveCamera
      makeDefault
      fov={fov}
      position={[0, 0, 0]}
      near={near}
      far={far}
    />
  );
}

export default VTOCamera;
