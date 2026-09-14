import 'server-only';

import { createHash } from 'node:crypto';
import { supabaseServer } from '@/lib/supabase/server';
import { defaultVTOAssetProcessor, classifyVTOOutputSize } from '../processor/VTOAssetProcessor';
import { OpticalDimensions, BridgeRegistration } from '../types/AssetTypes';

const BUCKET = 'vto-models';
const MAX_SOURCE_BYTES = 50 * 1024 * 1024;

export interface VTOPipelineRequest {
  assetId: string;
  sourceStoragePath: string;
  fileName: string;
  physicalDimensions: OpticalDimensions;
  customBridge?: Partial<BridgeRegistration>;
}

export interface VTOPipelineResult {
  assetId: string;
  status: 'CALIBRATED' | 'REVIEW_REQUIRED' | 'PROCESSING_FAILED';
  outputSizeStatus?: 'PASS' | 'REVIEW_REQUIRED' | 'FAIL';
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
  const { error } = await supabaseServer!
    .from('vto_asset_calibrations')
    .update(patch)
    .eq('asset_id', assetId);
  if (error) throw new Error(`Failed to update VTO asset ${assetId}: ${error.message}`);
}

export async function processVTOAsset(request: VTOPipelineRequest): Promise<VTOPipelineResult> {
  assertConfigured();

  const startedAt = new Date().toISOString();
  await updateAsset(request.assetId, {
    status: 'PROCESSING',
    processing_started_at: startedAt,
    failure_reason: null,
  });

  try {
    const { data, error } = await supabaseServer!.storage.from(BUCKET).download(request.sourceStoragePath);
    if (error || !data) throw new Error(`Failed to download source GLB: ${error?.message ?? 'empty response'}`);

    const sourceBuffer = await data.arrayBuffer();
    if (sourceBuffer.byteLength === 0 || sourceBuffer.byteLength > MAX_SOURCE_BYTES) {
      throw new Error(`Source GLB size ${sourceBuffer.byteLength} is outside the allowed range.`);
    }

    const sourceHash = sha256(sourceBuffer);
    await updateAsset(request.assetId, {
      source_size_bytes: sourceBuffer.byteLength,
      source_content_hash: sourceHash,
      source_storage_path: request.sourceStoragePath,
    });

    const output = await defaultVTOAssetProcessor.processGlbBuffer(
      sourceBuffer,
      request.fileName,
      {
        assetId: request.assetId,
        physicalDimensions: request.physicalDimensions,
        customBridge: request.customBridge,
      },
      true,
    );

    if (!output.vtoGlbBuffer) throw new Error('VTO processor returned no derived GLB.');

    const derivedSizeBytes = output.vtoGlbBuffer.byteLength;
    const outputSizeStatus = classifyVTOOutputSize(derivedSizeBytes);
    const derivedHash = sha256(output.vtoGlbBuffer);
    const derivedPath = `${request.assetId}/derived/${request.assetId}-${derivedHash.slice(0, 12)}.glb`;

    // A FAIL is never uploaded or published. REVIEW_REQUIRED may be stored for
    // human review but remains unavailable to the storefront.
    if (outputSizeStatus === 'FAIL') {
      await updateAsset(request.assetId, {
        status: 'PROCESSING_FAILED',
        derived_size_bytes: derivedSizeBytes,
        derived_content_hash: derivedHash,
        output_size_status: outputSizeStatus,
        processor_version: output.metadata.versioning.processorVersion,
        calibration_version: output.metadata.versioning.calibrationVersion,
        processing_failed_at: new Date().toISOString(),
        failure_reason: `Derived GLB exceeds the 3 MB hard limit (${derivedSizeBytes} bytes).`,
      });
      return {
        assetId: request.assetId,
        status: 'PROCESSING_FAILED',
        outputSizeStatus,
        sourceSizeBytes: sourceBuffer.byteLength,
        derivedSizeBytes,
        sourceHash,
        derivedHash,
        sourceDeleted: false,
        failureReason: `Derived GLB exceeds the 3 MB hard limit (${derivedSizeBytes} bytes).`,
      };
    }

    const { error: uploadError } = await supabaseServer!.storage
      .from(BUCKET)
      .upload(derivedPath, Buffer.from(output.vtoGlbBuffer), {
        contentType: 'model/gltf-binary',
        upsert: false,
      });
    if (uploadError) throw new Error(`Failed to save derived GLB: ${uploadError.message}`);

    const { data: verifyData, error: verifyError } = await supabaseServer!.storage
      .from(BUCKET)
      .download(derivedPath);
    if (verifyError || !verifyData) throw new Error(`Derived GLB verification download failed: ${verifyError?.message ?? 'empty response'}`);

    const verifiedBuffer = await verifyData.arrayBuffer();
    const verifiedHash = sha256(verifiedBuffer);
    if (verifiedHash !== derivedHash || verifiedBuffer.byteLength !== derivedSizeBytes) {
      throw new Error('Derived GLB verification failed: hash or byte size changed after storage.');
    }

    const finalStatus = outputSizeStatus === 'PASS' ? 'CALIBRATED' : 'REVIEW_REQUIRED';
    await updateAsset(request.assetId, {
      status: finalStatus,
      source_storage_path: request.sourceStoragePath,
      derived_storage_path: derivedPath,
      derived_size_bytes: derivedSizeBytes,
      derived_content_hash: derivedHash,
      output_size_status: outputSizeStatus,
      processor_version: output.metadata.versioning.processorVersion,
      calibration_version: output.metadata.versioning.calibrationVersion,
      storage_bucket: BUCKET,
      storage_path: derivedPath,
      vto_glb_url: derivedPath,
      processing_completed_at: new Date().toISOString(),
      provenance: {
        sourceHash,
        derivedHash,
        sourcePath: request.sourceStoragePath,
        derivedPath,
        processorVersion: output.metadata.versioning.processorVersion,
        outputSizeStatus,
        physicalDimensions: request.physicalDimensions,
      },
    });

    // Source cleanup is deliberately limited to a successful derived save + verify
    // + durable metadata write. REVIEW_REQUIRED is safe to clean because the
    // derived artifact is already verified and is the canonical object.
    const { error: removeError } = await supabaseServer!.storage.from(BUCKET).remove([request.sourceStoragePath]);
    if (removeError) throw new Error(`Derived asset is ready but source cleanup failed: ${removeError.message}`);

    await updateAsset(request.assetId, { source_deleted_at: new Date().toISOString() });

    return {
      assetId: request.assetId,
      status: finalStatus,
      outputSizeStatus,
      sourceSizeBytes: sourceBuffer.byteLength,
      derivedSizeBytes,
      sourceHash,
      derivedHash,
      derivedStoragePath: derivedPath,
      sourceDeleted: true,
    };
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : String(error);
    try {
      await updateAsset(request.assetId, {
        status: 'PROCESSING_FAILED',
        processing_failed_at: new Date().toISOString(),
        failure_reason: failureReason,
      });
    } catch {
      // Preserve the original processing error. Database failure is captured by logs.
    }
    return {
      assetId: request.assetId,
      status: 'PROCESSING_FAILED',
      sourceDeleted: false,
      failureReason,
    };
  }
}
