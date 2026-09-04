// src/app/vto-lab/page.tsx
/**
 * Standalone VTO Lab Route: /vto-lab
 * Dedicated isolated test harness for camera, face tracking, pose math, and eyewear calibration.
 */

'use client';

import React from 'react';
import { VTOApp } from '@/vto-lab';

export default function StandaloneVTOLabPage() {
  return <VTOApp />;
}
