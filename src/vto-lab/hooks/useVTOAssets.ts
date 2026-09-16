'use client';
import { useCallback, useEffect, useState } from 'react';
import { globalVTOAssetRegistry } from '@/vto-pipeline/registry/VTOAssetRegistry';
import type { AssetCalibrationMetadata } from '@/vto-pipeline/types/AssetTypes';

const DEFAULT_ORIENTATION = { forward: '+Z', up: '+Y', handedness: 'right-handed' } as const;
const DEFAULT_TEMPLE_PROCESSING = { mode: 'disabled', strategy: 'manual', cutRatio: 1, preserveFrontRims: true, preserveHinges: true, useMaterialClipping: false } as const;
const DEFAULT_MANUAL = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 1 } as const;

let fetchPromise: Promise<void> | null = null;

async function hydrateVTOAssets(): Promise<void> {
  const res = await fetch('/api/vto/assets', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch VTO assets');
  const payload = await res.json();
  const rows = Array.isArray(payload) ? payload : payload?.assets;
  if (!Array.isArray(rows)) throw new Error('Invalid VTO asset response');

  const metadata = rows.map((row: any): AssetCalibrationMetadata => {
    const dimensions = row.physical_dimensions ?? {};
    const registration = row.registration ?? {};
    const bridge = registration.bridge ?? {};
    const manual = row.manual_transform ?? DEFAULT_MANUAL;
    const vtoUrl = row.vto_glb_url || row.storage_path || '';
    return {
      assetId: row.asset_id,
      name: row.name,
      status: row.status,
      physicalDimensions: {
        frameWidthMm: dimensions.frame_width_mm != null ? Number(dimensions.frame_width_mm) : null,
        lensWidthMm: dimensions.lens_width_mm != null ? Number(dimensions.lens_width_mm) : null,
        bridgeWidthMm: dimensions.bridge_width_mm != null ? Number(dimensions.bridge_width_mm) : null,
        templeLengthMm: dimensions.temple_length_mm != null ? Number(dimensions.temple_length_mm) : null,
      },
      registration: {
        bridge: { x: Number(bridge.x) || 0, y: Number(bridge.y) || 0, z: Number(bridge.z) || 0 },
        measuredNativeWidth: 1,
        widthMultiplier: 1,
        rotationOffsetEuler: registration.rotation_offset_euler ?? { x: 0, y: 0, z: 0 },
      },
      manualTransform: {
        position: { x: Number(manual.position?.x) || 0, y: Number(manual.position?.y) || 0, z: Number(manual.position?.z) || 0 },
        rotation: { x: Number(manual.rotation?.x) || 0, y: Number(manual.rotation?.y) || 0, z: Number(manual.rotation?.z) || 0 },
        scale: Number(manual.scale) > 0 ? Number(manual.scale) : 1,
      },
      orientation: DEFAULT_ORIENTATION,
      templeProcessing: DEFAULT_TEMPLE_PROCESSING,
      versioning: { processorVersion: 'manual', sourceVersion: 1, vtoVersion: 1, calibrationVersion: Number(row.calibration_version) || 1 },
      paths: { sourceGlbUrl: vtoUrl, vtoGlbUrl: vtoUrl, previewImages: [] },
      metadataSource: row.metadata_source || 'DB',
      updatedAt: row.updated_at,
    };
  });
  globalVTOAssetRegistry.replaceAssets(metadata);
}

export function refreshVTOAssets(): Promise<void> {
  if (!fetchPromise) fetchPromise = hydrateVTOAssets().finally(() => { fetchPromise = null; });
  return fetchPromise;
}

export function useVTOAssets() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { await refreshVTOAssets(); }
    catch (err: any) { setError(err?.message || 'Failed to fetch VTO assets'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  return { loading, error, refresh };
}
