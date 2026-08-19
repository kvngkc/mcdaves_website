// src/vto-lab/hooks/useVTOPreload.ts
/**
 * Background Pre-Warming & Asset Preloading Engine for VTO.
 * Runs non-blocking asset pre-fetching during browser idle time (requestIdleCallback)
 * so that when a user clicks 'Try On', the AI engine and 3D frame are already in memory.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { initFaceLandmarker } from '../tracking/FaceLandmarker';

const VTO_CACHE_NAME = 'mcdaves-vto-assets-v1';
const DEFAULT_PRELOAD_MODELS = [
  '/models/glasses.glb',
  '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
];

const PRELOAD_BINARY_ASSETS = [
  '/models/face_landmarker.task',
  '/wasm/vision_wasm_internal.wasm',
  '/wasm/vision_wasm_internal.js',
];

let globalPreloadStarted = false;
let globalPreloadPromise: Promise<void> | null = null;

/**
 * Pre-caches an asset into browser CacheStorage for instant 0ms retrieval on repeat visits.
 */
async function cacheAsset(url: string): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await window.caches.open(VTO_CACHE_NAME);
    const existing = await cache.match(url);
    if (!existing) {
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        await cache.put(url, response);
      }
    }
  } catch {
    // Non-blocking fallback
  }
}

/**
 * Standalone async function to preload VTO assets in background.
 */
export async function preloadVTOAssets(extraGlbUrls: string[] = []): Promise<void> {
  if (globalPreloadStarted) return;
  globalPreloadStarted = true;

  globalPreloadPromise = (async () => {
    // 1. Preload 3D GLB Models into Three.js texture cache
    const glbList = Array.from(new Set([...DEFAULT_PRELOAD_MODELS, ...extraGlbUrls]));
    glbList.forEach((url) => {
      if (url && url.endsWith('.glb')) {
        try {
          useGLTF.preload(url);
        } catch {
          // Gracefully continue
        }
      }
    });

    // 2. Cache binary assets into CacheStorage
    const allUrls = [...PRELOAD_BINARY_ASSETS, ...glbList];
    await Promise.allSettled(allUrls.map((u) => cacheAsset(u)));

    // 3. Pre-warm MediaPipe Face Landmarker AI Engine
    try {
      await initFaceLandmarker();
    } catch {
      // Keep resilient
    }
  })();

  return globalPreloadPromise;
}

/**
 * React Hook for preloading VTO assets on mount during idle time.
 */
export function useVTOPreload(extraGlbUrls: string[] = []): void {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const executePreload = () => {
      preloadVTOAssets(extraGlbUrls);
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const handle = (window as any).requestIdleCallback(
          () => executePreload(),
          { timeout: 3000 },
        );
        return () => {
          if ('cancelIdleCallback' in window) {
            (window as any).cancelIdleCallback(handle);
          }
        };
      } else {
        const timeout = setTimeout(executePreload, 1000);
        return () => clearTimeout(timeout);
      }
    }
  }, [extraGlbUrls]);
}

export default useVTOPreload;
