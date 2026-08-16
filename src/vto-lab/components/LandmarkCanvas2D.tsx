// src/vto-lab/components/LandmarkCanvas2D.tsx
/**
 * 2D Landmark Diagnostic Canvas.
 * Renders detected facial landmarks, pupil centers, nose bridge anchor, and bounding box.
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { FaceDetectionResult, LetterboxViewport } from '../tracking/FaceTrackingTypes';

export interface LandmarkCanvas2DProps {
  detection: FaceDetectionResult | null;
  viewport: LetterboxViewport;
  mirrored?: boolean;
  enabled?: boolean;
}

export function LandmarkCanvas2D({
  detection,
  viewport,
  mirrored = true,
  enabled = false,
}: LandmarkCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detection || !detection.rawLandmarks || detection.rawLandmarks.length === 0) {
      return;
    }

    const { rawLandmarks, noseBridgePx, leftPupilPx, rightPupilPx, videoWidth, videoHeight } =
      detection;

    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    // Draw landmark mesh points
    ctx.fillStyle = 'rgba(0, 255, 128, 0.4)';
    rawLandmarks.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 1.2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw Nose Bridge Anchor (Point 168)
    ctx.fillStyle = '#ffaa00';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(noseBridgePx.x * scaleX, noseBridgePx.y * scaleY, 4.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw Left Pupil Center
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(leftPupilPx.x * scaleX, leftPupilPx.y * scaleY, 3.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw Right Pupil Center
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(rightPupilPx.x * scaleX, rightPupilPx.y * scaleY, 3.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw IPD Line
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(leftPupilPx.x * scaleX, leftPupilPx.y * scaleY);
    ctx.lineTo(rightPupilPx.x * scaleX, rightPupilPx.y * scaleY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [detection, enabled]);

  if (!enabled) return null;

  return (
    <div
      className="absolute overflow-hidden pointer-events-none z-15"
      style={{
        left: viewport.left,
        top: viewport.top,
        width: viewport.width,
        height: viewport.height,
      }}
    >
      <canvas
        ref={canvasRef}
        width={viewport.width}
        height={viewport.height}
        className="w-full h-full"
        style={{
          transform: mirrored ? 'scaleX(-1)' : 'none',
          transformOrigin: 'center',
        }}
      />
    </div>
  );
}

export default LandmarkCanvas2D;
