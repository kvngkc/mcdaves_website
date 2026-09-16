import { AssetCalibrationMetadata } from '../types/AssetTypes';

export class VTOAssetRegistry {
  private assets = new Map<string, AssetCalibrationMetadata>();
  private listeners = new Set<() => void>();

  public getAsset(identifier: string): AssetCalibrationMetadata | null {
    if (!identifier) return null;
    if (this.assets.has(identifier)) return this.assets.get(identifier)!;
    const cleanUrl = identifier.startsWith('/') || identifier.startsWith('http://') || identifier.startsWith('https://') ? identifier : `/${identifier}`;
    for (const metadata of this.assets.values()) {
      if (metadata.paths.vtoGlbUrl.endsWith(cleanUrl) || cleanUrl.endsWith(metadata.paths.vtoGlbUrl) || metadata.paths.sourceGlbUrl.endsWith(cleanUrl) || cleanUrl.endsWith(metadata.paths.sourceGlbUrl)) return metadata;
    }
    return null;
  }

  public registerAsset(metadata: AssetCalibrationMetadata): void {
    this.assets.set(metadata.assetId, { ...metadata, updatedAt: new Date().toISOString() });
    this.notify();
  }

  public replaceAssets(metadata: AssetCalibrationMetadata[]): void {
    this.assets.clear();
    metadata.forEach((item) => this.assets.set(item.assetId, { ...item, updatedAt: item.updatedAt }));
    this.notify();
  }

  public updateCalibration(assetId: string, updates: Partial<AssetCalibrationMetadata['registration']>): AssetCalibrationMetadata {
    const existing = this.getAsset(assetId);
    if (!existing) throw new Error(`Cannot update calibration for unknown VTO asset: ${assetId}`);
    const updated = { ...existing, registration: { ...existing.registration, ...updates }, versioning: { ...existing.versioning, calibrationVersion: existing.versioning.calibrationVersion + 1 }, updatedAt: new Date().toISOString() };
    this.assets.set(assetId, updated);
    this.notify();
    return updated;
  }

  public setStatus(assetId: string, status: AssetCalibrationMetadata['status']): AssetCalibrationMetadata {
    const existing = this.getAsset(assetId);
    if (!existing) throw new Error(`Cannot update status for unknown VTO asset: ${assetId}`);
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    this.assets.set(assetId, updated);
    this.notify();
    return updated;
  }

  public listAssets(): AssetCalibrationMetadata[] { return Array.from(this.assets.values()); }
  public subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private notify(): void { this.listeners.forEach((fn) => fn()); }
}

export const globalVTOAssetRegistry = new VTOAssetRegistry();
