import 'server-only';

import { createHash } from 'node:crypto';
import { supabaseServer } from '@/lib/supabase/server';
import { defaultVTOAssetProcessor } from '../processor/VTOAssetProcessor';
import { OpticalDimensions, BridgeRegistration } from '../types/AssetTypes';

const BUCKET = 'vto-models';
const MAX_SOURCE_BYTES = 50 * 1024 * 1024;

export interface VTOPipelineRequest {
  assetId: string;
  sourceStoragePath: string;
  fileName: string;
  physicalDimensions: OpticalDimensions;
  customBridge?: Partial<BridgeRegistration>;
  provenance?: Record<string, unknown>;
}

export interface VTOPipelineResult {
  assetId: string;
  status: 'CALIBRATED' | 'REVIEW_REQUIRED' | 'PROCESSING_FAILED';
  sourceSizeBytes?: number;
  derivedSizeBytes?: number;
  sourceHash?: string;
  derivedHash?: string;
  derivedStoragePath?: string;
  sourceDeleted: boolean;
  failureReason?: string;
}

function sha256(buffer: ArrayBuffer): string {
  return createHash('sha256').update(Buffer.from(buffer)).digest('hex');
}

function assertConfigured() {
  if (!supabaseServer) throw new Error('Supabase server client is not configured.');
}

async function updateAsset(assetId: string, patch: Record<string, unknown>) {
  assertConfigured();
  const { error } = await supabaseServer!.from('vto_asset_calibrations').update(patch).eq('asset_id', assetId);
  if (error) throw new Error(`Failed to update VTO asset ${assetId}: ${error.message}`);
}

export async function processVTOAsset(request: VTOPipelineRequest): Promise<VTOPipelineResult> {
  assertConfigured();
  await updateAsset(request.assetId, { status: 'PROCESSING', processing_started_at: new Date().toISOString(), failure_reason: null });

  try {
    const { data, error } = await supabaseServer!.storage.from(BUCKET).download(request.sourceStoragePath);
    if (error || !data) throw new Error(`Failed to download source GLB: ${error?.message ?? 'empty response'}`);
    const sourceBuffer = await data.arrayBuffer();
    if (sourceBuffer.byteLength === 0 || sourceBuffer.byteLength > MAX_SOURCE_BYTES) throw new Error(`Source GLB size ${sourceBuffer.byteLength} is outside the allowed range.`);

    const sourceHash = sha256(sourceBuffer);
    await updateAsset(request.assetId, { source_size_bytes: sourceBuffer.byteLength, source_content_hash: sourceHash, source_storage_path: request.sourceStoragePath });

    const output = await defaultVTOAssetProcessor.processGlbBuffer(sourceBuffer, request.fileName, {
      assetId: request.assetId,
      physicalDimensions: request.physicalDimensions,
      customBridge: request.customBridge,
    }, true);
    if (!output.vtoGlbBuffer) throw new Error('VTO processor returned no derived GLB.');

    const derivedSizeBytes = output.vtoGlbBuffer.byteLength;
    const derivedHash = sha256(output.vtoGlbBuffer);
    const derivedPath = `${request.assetId}/derived/${request.assetId}-${derivedHash.slice(0, 12)}.glb`;

    const { error: uploadError } = await supabaseServer!.storage.from(BUCKET).upload(derivedPath, Buffer.from(output.vtoGlbBuffer), { contentType: 'model/gltf-binary', upsert: false });
    if (uploadError) throw new Error(`Failed to save derived GLB: ${uploadError.message}`);

    const { data: verifyData, error: verifyError } = await supabaseServer!.storage.from(BUCKET).download(derivedPath);
    if (verifyError || !verifyData) throw new Error(`Derived GLB verification download failed: ${verifyError?.message ?? 'empty response'}`);
    const verifiedBuffer = await verifyData.arrayBuffer();
    if (sha256(verifiedBuffer) !== derivedHash || verifiedBuffer.byteLength !== derivedSizeBytes) throw new Error('Derived GLB verification failed: hash or byte size changed after storage.');

    // Every successful processing run stops at the human review gate. No automatic publication.
    const finalStatus = 'REVIEW_REQUIRED' as const;
    await updateAsset(request.assetId, {
      status: finalStatus, source_storage_path: request.sourceStoragePath, derived_storage_path: derivedPath,
      derived_size_bytes: derivedSizeBytes, derived_content_hash: derivedHash,
      processor_version: output.metadata.versioning.processorVersion, calibration_version: output.metadata.versioning.calibrationVersion,
      storage_bucket: BUCKET, storage_path: derivedPath, vto_glb_url: derivedPath, processing_completed_at: new Date().toISOString(),
      provenance: { ...(request.provenance ?? {}), sourceHash, derivedHash, sourcePath: request.sourceStoragePath, derivedPath, processorVersion: output.metadata.versioning.processorVersion, physicalDimensions: request.physicalDimensions },
    });

    return { assetId: request.assetId, status: finalStatus, sourceSizeBytes: sourceBuffer.byteLength, derivedSizeBytes, sourceHash, derivedHash, derivedStoragePath: derivedPath, sourceDeleted: false };
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : String(error);
    try { await updateAsset(request.assetId, { status: 'PROCESSING_FAILED', processing_failed_at: new Date().toISOString(), failure_reason: failureReason }); } catch { /* preserve original error */ }
    return { assetId: request.assetId, status: 'PROCESSING_FAILED', sourceDeleted: false, failureReason };
  }
}

export async function deleteVTOAssetSourceAfterPublication(assetId: string): Promise<void> {
  assertConfigured();
  const { data: asset, error } = await supabaseServer!.from('vto_asset_calibrations').select('source_storage_path,source_deleted_at,status,derived_storage_path,derived_content_hash,derived_size_bytes').eq('asset_id', assetId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!asset) throw new Error('VTO asset not found.');
  if (asset.status !== 'PUBLISHED') throw new Error('Source deletion requires PUBLISHED status.');
  if (!asset.derived_storage_path || !asset.derived_content_hash || !asset.derived_size_bytes) throw new Error('Source deletion requires a verified derived asset.');
  if (asset.source_deleted_at || !asset.source_storage_path) return;

  const { data: verifyData, error: verifyError } = await supabaseServer!.storage.from(BUCKET).download(asset.derived_storage_path);
  if (verifyError || !verifyData) throw new Error('Cannot verify the published derived asset before source deletion.');
  const verifiedBuffer = await verifyData.arrayBuffer();
  if (sha256(verifiedBuffer) !== asset.derived_content_hash || verifiedBuffer.byteLength !== asset.derived_size_bytes) throw new Error('Published derived asset provenance does not match recorded hash or size.');

  const { error: removeError } = await supabaseServer!.storage.from(BUCKET).remove([asset.source_storage_path]);
  if (removeError) throw new Error(`Source cleanup failed: ${removeError.message}`);
  await updateAsset(assetId, { source_deleted_at: new Date().toISOString() });
}
