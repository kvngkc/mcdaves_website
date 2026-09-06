// src/vto-pipeline/registry/VTOAssetRegistry.ts
/**
 * Dynamic VTO Eyewear Asset Registry.
 * Fully decouples the VTO tracking engine from asset-specific assumptions.
 */

import { AssetCalibrationMetadata } from '../types/AssetTypes';
import { DEFAULT_VTO_ASSETS, FALLBACK_VTO_METADATA } from './defaultAssets';

export class VTOAssetRegistry {
  private assets: Map<string, AssetCalibrationMetadata>;
  private listeners: Set<() => void>;

  constructor() {
    this.assets = new Map();
    this.listeners = new Set();

    // Initialize with defaults
    Object.entries(DEFAULT_VTO_ASSETS).forEach(([key, metadata]) => {
      this.assets.set(key, metadata);
    });
  }

  /**
   * Retrieves asset calibration metadata by assetId or GLB file URL.
   */
  public getAsset(identifier: string): AssetCalibrationMetadata {
    if (!identifier) return FALLBACK_VTO_METADATA;

    // Direct ID match
    if (this.assets.has(identifier)) {
      return this.assets.get(identifier)!;
    }

    // Match by GLB URL (source or VTO)
    const isExternal = identifier.startsWith('http://') || identifier.startsWith('https://');
    const cleanUrl = isExternal || identifier.startsWith('/') ? identifier : `/${identifier}`;
    for (const metadata of this.assets.values()) {
      if (
        metadata.paths.vtoGlbUrl.endsWith(cleanUrl) ||
        cleanUrl.endsWith(metadata.paths.vtoGlbUrl) ||
        metadata.paths.sourceGlbUrl.endsWith(cleanUrl) ||
        cleanUrl.endsWith(metadata.paths.sourceGlbUrl)
      ) {
        return metadata;
      }
    }

    return {
      ...FALLBACK_VTO_METADATA,
      assetId: `dynamic-${Date.now()}`,
      paths: {
        sourceGlbUrl: cleanUrl,
        vtoGlbUrl: cleanUrl,
        previewImages: [],
      },
    };
  }

  /**
   * Registers a new or updated asset metadata.
   */
  public registerAsset(metadata: AssetCalibrationMetadata): void {
    this.assets.set(metadata.assetId, {
      ...metadata,
      updatedAt: new Date().toISOString(),
    });
    this.notify();
  }

  /**
   * Updates calibration parameters for an existing asset.
   */
  public updateCalibration(
    assetId: string,
    updates: Partial<AssetCalibrationMetadata['registration']>,
  ): AssetCalibrationMetadata {
    const existing = this.getAsset(assetId);
    const updated: AssetCalibrationMetadata = {
      ...existing,
      registration: {
        ...existing.registration,
        ...updates,
      },
      versioning: {
        ...existing.versioning,
        calibrationVersion: existing.versioning.calibrationVersion + 1,
      },
      updatedAt: new Date().toISOString(),
    };

    this.assets.set(assetId, updated);
    this.notify();
    return updated;
  }

  /**
   * Updates lifecycle status (e.g. APPROVED, PUBLISHED).
   */
  public setStatus(
    assetId: string,
    status: AssetCalibrationMetadata['status'],
  ): AssetCalibrationMetadata {
    const existing = this.getAsset(assetId);
    const updated: AssetCalibrationMetadata = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    this.assets.set(assetId, updated);
    this.notify();
    return updated;
  }

  /**
   * Lists all registered assets.
   */
  public listAssets(): AssetCalibrationMetadata[] {
    return Array.from(this.assets.values());
  }

  /**
   * Subscribe to registry changes.
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

// Global Singleton Instance
export const globalVTOAssetRegistry = new VTOAssetRegistry();
