// src/vto-lab/components/VTOCanvas.tsx
/**
 * Three.js Canvas Container for VTO Lab.
 * Aligns precisely with the computed letterbox/pillarbox viewport rectangle of the video.
 * Renders in native 3D space with integrated Head Depth Occlusion.
 *
 * The canvas is the shared runtime boundary for every VTO consumer. It waits
 * for the published backend asset registry to hydrate before mounting the renderer,
 * so GlassesModel cannot resolve calibration against an empty runtime registry.
 */

'use client';

import React, { MutableRefObject } from 'react';
import dynamic from 'next/dynamic';
import {
  FaceDetectionResult,
  LetterboxViewport,
  ModelMeasurement,
  VTOActiveModel,
} from '../tracking/FaceTrackingTypes';
import { VTORendererProps } from '../rendering/VTORenderer';
import { useVTOAssets } from '../hooks/useVTOAssets';

const VTORenderer = dynamic<VTORendererProps>(
  () => import('../rendering/VTORenderer'),
  { ssr: false },
);

export interface VTOCanvasProps {
  viewport: LetterboxViewport;
  mirrored?: boolean;
  detectionRef?: MutableRefObject<FaceDetectionResult | null>;
  faceMatrix?: Float32Array | null;
  activeModel: VTOActiveModel;
  showAxes: boolean;
  showCube: boolean;
  showGlasses: boolean;
  showHeadOcclusion?: boolean;
  debugOccluderMesh?: boolean;
  clipTemples?: boolean;
  templeDepthCutoff?: number;
  glbPath: string;
  frameSize: string;
  fovDegrees?: number;
  onModelMeasured?: (measurement: ModelMeasurement, scale: number) => void;
  onError?: (error: Error) => void;
}

export function VTOCanvas({
  viewport,
  mirrored = true,
  detectionRef,
  faceMatrix,
  activeModel,
  showAxes,
  showCube,
  showGlasses,
  showHeadOcclusion = true,
  debugOccluderMesh = false,
  clipTemples = true,
  templeDepthCutoff = 2.5,
  glbPath,
  frameSize,
  fovDegrees = 63.0,
  onModelMeasured,
  onError,
}: VTOCanvasProps) {
  const { loading, error } = useVTOAssets();

  if (loading || error) {
    return null;
  }

  return (
    <div
      className="absolute overflow-hidden pointer-events-none z-10"
      style={{
        left: viewport.left,
        top: viewport.top,
        width: viewport.width,
        height: viewport.height,
      }}
    >
      <VTORenderer
        detectionRef={detectionRef}
        faceMatrix={faceMatrix}
        mirrored={mirrored}
        activeModel={activeModel}
        showAxes={showAxes}
        showCube={showCube}
        showGlasses={showGlasses}
        showHeadOcclusion={showHeadOcclusion}
        debugOccluderMesh={debugOccluderMesh}
        clipTemples={clipTemples}
        templeDepthCutoff={templeDepthCutoff}
        glbPath={glbPath}
        frameSize={frameSize}
        fovDegrees={fovDegrees}
        onModelMeasured={onModelMeasured}
        onError={onError}
      />
    </div>
  );
}

export default VTOCanvas;
