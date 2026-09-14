'use client';

import { useEffect, useState } from 'react';
import { globalVTOAssetRegistry } from '@/vto-pipeline/registry/VTOAssetRegistry';
import { AssetCalibrationMetadataSchema, type AssetCalibrationMetadata } from '@/vto-pipeline/types/AssetTypes';

let fetchPromise: Promise<void> | null = null;
let isFetched = false;

export function useVTOAssets() {
  const [loading, setLoading] = useState(!isFetched);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isFetched) {
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = (async () => {
        const res = await fetch('/api/vto/assets', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch published VTO assets');

        const rows: unknown = await res.json();
        if (!Array.isArray(rows)) throw new Error('Invalid VTO asset response');

        for (const row of rows) {
          const r = row as Record<string, unknown>;
          const metadata: AssetCalibrationMetadata = AssetCalibrationMetadataSchema.parse({
            assetId: r.asset_id,
            name: r.name,
            status: 'PUBLISHED',
            physicalDimensions: {
              frameWidthMm: r.frame_width_mm != null ? Number(r.frame_width_mm) : null,
              lensWidthMm: r.lens_width_mm != null ? Number(r.lens_width_mm) : null,
              bridgeWidthMm: r.bridge_width_mm != null ? Number(r.bridge_width_mm) : null,
              templeLengthMm: r.temple_length_mm != null ? Number(r.temple_length_mm) : null,
            },
            registration: {
              bridge: {
                x: r.bridge_x != null ? Number(r.bridge_x) : null,
                y: r.bridge_y != null ? Number(r.bridge_y) : null,
                z: r.bridge_z != null ? Number(r.bridge_z) : null,
              },
              measuredNativeWidth: Number(r.measured_native_width),
              widthMultiplier: Number(r.width_multiplier) || 1,
              rotationOffsetEuler: (r.rotation_offset_euler as object | null) ?? { x: 0, y: 0, z: 0 },
              pantoscopicTilt: Number(r.pantoscopic_tilt ?? -12),
            },
            orientation: {
              forward: String(r.forward_axis ?? '+Z'),
              up: String(r.up_axis ?? '+Y'),
              handedness: r.handedness === 'left-handed' ? 'left-handed' : 'right-handed',
            },
            templeProcessing: {
              mode: r.temple_processing_mode === 'full' ? 'full' : 'auto',
              strategy: String(r.temple_processing_strategy ?? 'preserve-visible-temple'),
              cutRatio: Number(r.temple_cut_ratio ?? 0.70),
              preserveFrontRims: true,
              preserveHinges: true,
              useMaterialClipping: Boolean(r.use_material_clipping ?? false),
            },
            versioning: {
              processorVersion: String(r.processor_version ?? '1.0.0'),
              sourceVersion: Number(r.source_version ?? 1),
              vtoVersion: Number(r.vto_version ?? 1),
              calibrationVersion: Number(r.calibration_version ?? 1),
            },
            paths: {
              sourceGlbUrl: String(r.source_glb_url ?? ''),
              vtoGlbUrl: String(r.vto_glb_url ?? ''),
              previewImages: Array.isArray(r.preview_images) ? r.preview_images.map(String) : [],
            },
            metadataSource: String(r.metadata_source ?? 'DB'),
            updatedAt: String(r.updated_at ?? new Date().toISOString()),
          });

          globalVTOAssetRegistry.registerAsset(metadata);
        }

        isFetched = true;
      })().catch((err) => {
        fetchPromise = null;
        throw err;
      });
    }

    fetchPromise
      .then(() => setLoading(false))
      .catch((err: unknown) => {
        console.error('[useVTOAssets] Error:', err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, []);

  return { loading, error };
}
