// src/components/try-on/calibration.ts
/**
 * 3D asset calibration registry.
 *
 * MediaPipe Face Geometry uses centimeters as its metric unit. The registry
 * therefore contains only model-space registration data and an optional
 * measured fit multiplier. It contains no runtime screen offsets or Z hacks.
 *
 * `bridge` is the physical nose-bridge anchor expressed in the GLB's native
 * coordinates. It is applied once, before the model is scaled into centimeters.
 */
export interface AssetCalibration {
  bridge: {
    x: number;
    y: number;
    z: number;
  };
  /** Optional correction when the exported model width is not physically exact. */
  widthMultiplier: number;
  /** Human-readable source note for future asset maintainers. */
  source: string;
}

export const GLASSES_CALIBRATION_REGISTRY: Record<string, AssetCalibration> = {
  '/models/glasses.glb': {
    // Derived from the previous asset registration, expressed as the model-space
    // bridge point rather than as a runtime translation.
    bridge: {
      x: 0.0012,
      y: 3.2142,
      z: 2.6306,
    },
    widthMultiplier: 1,
    source: 'Measured bridge registration from the supplied GLB asset.',
  },

  '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb': {
    bridge: {
      x: -0.003,
      y: 0.0836,
      z: 0.8262,
    },
    widthMultiplier: 1,
    source: 'Measured bridge registration from the supplied GLB asset.',
  },
};

export const DEFAULT_ASSET_CALIBRATION: AssetCalibration = {
  bridge: { x: 0, y: 0, z: 0 },
  widthMultiplier: 1,
  source: 'No asset-specific registration. Model origin is assumed to be the bridge.',
};

export function getAssetCalibration(glbPath: string): AssetCalibration {
  const cleanPath = glbPath.startsWith('/') ? glbPath : `/${glbPath}`;
  const key = Object.keys(GLASSES_CALIBRATION_REGISTRY).find(
    (candidate) => cleanPath.endsWith(candidate) || candidate.endsWith(cleanPath),
  );
  return key ? GLASSES_CALIBRATION_REGISTRY[key] : DEFAULT_ASSET_CALIBRATION;
}

/**
 * Parse common optical frame notation, e.g. 52□18-140.
 * The physical frame width is lens width × 2 + bridge width.
 */
export function parseFrameWidthMm(frameSize?: string): number | null {
  if (!frameSize) return null;

  const normalized = frameSize
    .replace(/[\u25A1\u2B1C\u2610\u25FB\u25FC\u25FD\u25FE\s]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const parts = normalized.split('-').map(Number);
  if (parts.length < 2 || parts.slice(0, 2).some((value) => !Number.isFinite(value) || value <= 0)) {
    return null;
  }

  return parts[0] * 2 + parts[1];
}
