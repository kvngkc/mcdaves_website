// src/vto-pipeline/registry/VTOAssetRegistry.ts
/**
 * Dynamic VTO Eyewear Asset Registry.
 * Runtime calibration is populated only from the published backend asset API.
 */

import { AssetCalibrationMetadata } from '../types/AssetTypes';

export class VTOAssetRegistry {
  private assets: Map<string, AssetCalibrationMetadata>;
  private listeners: Set<() => void>;

  constructor() {
    this.assets = new Map();
    this.listeners = new Set();
  }

  /**
   * Retrieves asset calibration metadata by assetId or GLB file URL.
   * Only assets explicitly registered by the runtime data bridge can resolve.
   */
  public getAsset(identifier: string): AssetCalibrationMetadata | null {
    if (!identifier) return null;

    if (this.assets.has(identifier)) {
      return this.assets.get(identifier)!;
    }

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

    return null;
  }

  /**
   * Registers published runtime metadata from the backend.
   * The renderer never invents calibration values locally.
   */
  public registerAsset(metadata: AssetCalibrationMetadata): void {
    this.assets.set(metadata.assetId, {
      ...metadata,
      updatedAt: new Date().toISOString(),
    });
    this.notify();
  }

  public updateCalibration(
    assetId: string,
    updates: Partial<AssetCalibrationMetadata['registration']>,
  ): AssetCalibrationMetadata {
    const existing = this.assets.get(assetId);
    if (!existing) {
      throw new Error(`Cannot update calibration for unregistered asset: ${assetId}`);
    }

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

  public setStatus(
    assetId: string,
    status: AssetCalibrationMetadata['status'],
  ): AssetCalibrationMetadata {
    const existing = this.assets.get(assetId);
    if (!existing) {
      throw new Error(`Cannot update status for unregistered asset: ${assetId}`);
    }

    const updated: AssetCalibrationMetadata = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    this.assets.set(assetId, updated);
    this.notify();
    return updated;
  }

  public listAssets(): AssetCalibrationMetadata[] {
    return Array.from(this.assets.values());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const globalVTOAssetRegistry = new VTOAssetRegistry();
