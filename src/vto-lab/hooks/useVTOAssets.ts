'use client';

import { useEffect, useState } from 'react';
import { globalVTOAssetRegistry } from '@/vto-pipeline/registry/VTOAssetRegistry';
import type { AssetCalibrationMetadata } from '@/vto-pipeline/types/AssetTypes';

const DEFAULT_ORIENTATION = { forward: '+Z', up: '+Y', handedness: 'right-handed' } as const;
const DEFAULT_TEMPLE_PROCESSING = { mode: 'auto', strategy: 'preserve-visible-temple', cutRatio: 0.70, preserveFrontRims: true, preserveHinges: true } as const;
const DEFAULT_VERSIONING = { processorVersion: '1.0.0', sourceVersion: 1, vtoVersion: 1, calibrationVersion: 1 };

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
                  frameWidthMm: row.frame_width_mm != null ? Number(row.frame_width_mm) : null,
                  lensWidthMm: row.lens_width_mm != null ? Number(row.lens_width_mm) : null,
                  bridgeWidthMm: row.bridge_width_mm != null ? Number(row.bridge_width_mm) : null,
                  templeLengthMm: row.temple_length_mm != null ? Number(row.temple_length_mm) : null,
                },
                registration: {
                  bridge: {
                    x: row.bridge_x != null ? Number(row.bridge_x) : null,
                    y: row.bridge_y != null ? Number(row.bridge_y) : null,
                    z: row.bridge_z != null ? Number(row.bridge_z) : null,
                  },
                  measuredNativeWidth: Number(row.measured_native_width) || 1.0,
                  widthMultiplier: Number(row.width_multiplier) || 1.0,
                  rotationOffsetEuler: row.rotation_offset_euler || { x: 0, y: 0, z: 0 },
                  manualTransform: row.manual_transform || {
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: 1,
                  },
                },
                orientation: DEFAULT_ORIENTATION,
                templeProcessing: DEFAULT_TEMPLE_PROCESSING,
                versioning: DEFAULT_VERSIONING,
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
