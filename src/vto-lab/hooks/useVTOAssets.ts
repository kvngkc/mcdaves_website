'use client';

import { useEffect, useState } from 'react';
import { globalVTOAssetRegistry } from '@/vto-pipeline/registry/VTOAssetRegistry';
import { FALLBACK_VTO_METADATA } from '@/vto-pipeline/registry/defaultAssets';
import type { AssetCalibrationMetadata } from '@/vto-pipeline/types/AssetTypes';

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
        try {
          const res = await fetch('/api/vto/assets');
          if (!res.ok) throw new Error('Failed to fetch VTO assets');
          
          const rows = await res.json();
          
          if (Array.isArray(rows)) {
            rows.forEach((row: any) => {
              const metadata: AssetCalibrationMetadata = {
                assetId: row.asset_id,
                name: row.name,
                status: row.status as any,
                physicalDimensions: {
                  frameWidthMm: Number(row.frame_width_mm) || 124,
                  lensWidthMm: Number(row.lens_width_mm) || 52,
                  bridgeWidthMm: Number(row.bridge_width_mm) || 18,
                  templeLengthMm: Number(row.temple_length_mm) || 140,
                },
                registration: {
                  bridge: {
                    x: Number(row.bridge_x) || 0,
                    y: Number(row.bridge_y) || 0,
                    z: Number(row.bridge_z) || 0,
                  },
                  measuredNativeWidth: Number(row.measured_native_width) || 1.0,
                  widthMultiplier: Number(row.width_multiplier) || 1.0,
                  rotationOffsetEuler: row.rotation_offset_euler || { x: 0, y: 0, z: 0 },
                },
                orientation: FALLBACK_VTO_METADATA.orientation,
                templeProcessing: FALLBACK_VTO_METADATA.templeProcessing,
                versioning: FALLBACK_VTO_METADATA.versioning,
                paths: {
                  sourceGlbUrl: row.source_glb_url,
                  vtoGlbUrl: row.vto_glb_url,
                  previewImages: row.preview_images || [],
                },
                metadataSource: row.metadata_source || 'DB',
                updatedAt: row.updated_at,
              };
              
              globalVTOAssetRegistry.registerAsset(metadata);
            });
          }
          isFetched = true;
        } catch (err: any) {
          console.error('[useVTOAssets] Error:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      fetchPromise.then(() => setLoading(false));
    }
  }, []);

  return { loading, error };
}
