'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { CheckCircle2, Loader2, UploadCloud, XCircle } from 'lucide-react';

type Variant = {
  id: string;
  name: string;
  sku: string;
  product_id: string;
  products?: {
    id: string;
    name: string;
    slug: string;
    frame_width_mm: number | null;
    lens_width_mm: number | null;
    bridge_width_mm: number | null;
    temple_length_mm: number | null;
  } | null;
};

type PipelineResult = {
  assetId: string;
  status: string;
  outputSizeStatus?: string;
  sourceSizeBytes?: number;
  derivedSizeBytes?: number;
  failureReason?: string;
};

export function AdminPipelineDashboard() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantId, setVariantId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/vto/variants')
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error ?? 'Failed to load variants.');
        return response.json();
      })
      .then((data) => setVariants(data.variants ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const uploadAndProcess = async () => {
    if (!file || !variantId) {
      setError('Select an active product variant and a .glb file first.');
      return;
    }
    if (!/\.glb$/i.test(file.name)) {
      setError('Only GLB assets are accepted.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage('Creating direct Storage upload...');
    setResult(null);

    try {
      const prepareResponse = await fetch('/api/admin/vto/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, fileName: file.name, sizeBytes: file.size }),
      });
      const prepare = await prepareResponse.json();
      if (!prepareResponse.ok) throw new Error(prepare.error ?? 'Could not prepare VTO upload.');
      if (!supabaseClient) throw new Error('Browser Supabase client is not configured.');

      setMessage('Uploading source GLB directly to Supabase Storage...');
      const { error: uploadError } = await supabaseClient.storage
        .from(prepare.bucket)
        .uploadToSignedUrl(prepare.sourcePath, prepare.token, file);
      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      setMessage('Server processing: inspect → validate → calibrate → optimize → verify...');
      const processResponse = await fetch('/api/admin/vto/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: prepare.assetId }),
      });
      const processed = await processResponse.json();
      if (!processResponse.ok) throw new Error(processed.error ?? 'VTO processing failed.');
      setResult(processed);
      setMessage(processed.status === 'REVIEW_REQUIRED'
        ? 'Processing complete. Human review is now required before publication.'
        : 'Processing complete.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const approveAndPublish = async () => {
    if (!result?.assetId) return;
    setLoading(true);
    setError(null);
    setMessage('Verifying derived GLB, approving publication, linking variant, and cleaning source...');
    try {
      const response = await fetch('/api/admin/vto/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: result.assetId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Publication failed.');
      setResult({ ...result, status: 'PUBLISHED', outputSizeStatus: 'PASS' });
      setMessage(`Published ${data.assetId}. Source cleanup completed: ${data.sourceDeleted ? 'yes' : 'pending retry'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const selected = variants.find((item) => item.id === variantId);
  const dimensions = selected?.products;

  return (
    <section className="min-h-screen bg-neutral-950 text-white p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-black">VTO Asset Review Pipeline</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Direct Storage upload. Server-side processing. Human review. Explicit publication. Source deletion only after publication.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200 flex gap-2">
          <XCircle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-200">{message}</div>
      )}

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-5 max-w-3xl">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Product variant</label>
          <select
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3 text-sm"
            disabled={loading}
          >
            <option value="">Select an active variant</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>{variant.name} · {variant.sku}</option>
            ))}
          </select>
          {dimensions && (
            <p className="mt-2 text-xs text-neutral-500">
              Authoritative dimensions: {dimensions.frame_width_mm} × {dimensions.lens_width_mm} × {dimensions.bridge_width_mm} × {dimensions.temple_length_mm} mm
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Source GLB</label>
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={loading}
            className="block w-full text-sm text-neutral-300 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </div>

        <button
          type="button"
          onClick={uploadAndProcess}
          disabled={loading || !file || !variantId}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          Upload and Process
        </button>
      </div>

      {result && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 max-w-3xl space-y-4">
          <div className="flex items-center gap-3">
            {result.status === 'PUBLISHED' ? <CheckCircle2 className="h-6 w-6 text-emerald-400" /> : <span className="h-3 w-3 rounded-full bg-amber-400" />}
            <div>
              <h2 className="font-bold">Review gate</h2>
              <p className="text-sm text-neutral-400">Asset: {result.assetId}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-neutral-950 p-3">Pipeline status: <strong>{result.status}</strong></div>
            <div className="rounded-lg bg-neutral-950 p-3">Output size: <strong>{result.outputSizeStatus ?? 'n/a'}</strong></div>
            <div className="rounded-lg bg-neutral-950 p-3">Source: <strong>{result.sourceSizeBytes ? `${(result.sourceSizeBytes / 1024 / 1024).toFixed(2)} MB` : 'n/a'}</strong></div>
            <div className="rounded-lg bg-neutral-950 p-3">Derived: <strong>{result.derivedSizeBytes ? `${(result.derivedSizeBytes / 1024 / 1024).toFixed(2)} MB` : 'n/a'}</strong></div>
          </div>
          {result.failureReason && <p className="text-sm text-red-300">{result.failureReason}</p>}
          {result.status === 'REVIEW_REQUIRED' && result.outputSizeStatus === 'PASS' && (
            <button
              type="button"
              onClick={approveAndPublish}
              disabled={loading}
              className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold disabled:opacity-40"
            >
              Approve and Publish
            </button>
          )}
        </div>
      )}
    </section>
  );
}
