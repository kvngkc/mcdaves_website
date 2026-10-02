// src/vto-lab/components/VTOControls.tsx
/**
 * Interactive Control Panel for VTO Lab.
 * Dynamically queries the unified VTOAssetRegistry for registered eyewear models.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { VTOActiveModel, VTOControlState } from '../tracking/FaceTrackingTypes';
import { globalVTOAssetRegistry } from '@/vto-pipeline/registry/VTOAssetRegistry';
import { AssetCalibrationMetadata } from '@/vto-pipeline/types/AssetTypes';
import { ExternalLink } from 'lucide-react';

export interface VTOControlsProps {
  state: VTOControlState;
  onChange: (updater: (prev: VTOControlState) => VTOControlState) => void;
  onReloadDetector: () => void;
  onRestartCamera: () => void;
}

export function VTOControls({
  state,
  onChange,
  onReloadDetector,
  onRestartCamera,
}: VTOControlsProps) {
  const [registeredAssets, setRegisteredAssets] = useState<AssetCalibrationMetadata[]>([]);

  useEffect(() => {
    queueMicrotask(() => setRegisteredAssets(globalVTOAssetRegistry.listAssets()));
    const unsub = globalVTOAssetRegistry.subscribe(() => {
      setRegisteredAssets(globalVTOAssetRegistry.listAssets());
    });
    return unsub;
  }, []);

  const handleModelChange = (model: VTOActiveModel) => {
    onChange((prev) => ({
      ...prev,
      activeModel: model,
      showAxes: model === 'axes',
      showCube: model === 'cube',
      showGlasses: model === 'glasses',
    }));
  };

  const handleGlbChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPath = e.target.value;
    const metadata = globalVTOAssetRegistry.getAsset(nextPath);
    if (!metadata) {
      console.warn(`[VTOControls] Asset not found for path: ${nextPath}`);
      return;
    }
    const dims = metadata.physicalDimensions;
    const frameSizeStr = `${dims.lensWidthMm || 52}□${dims.bridgeWidthMm || 18}-${dims.templeLengthMm || 140}`;

    onChange((prev) => ({
      ...prev,
      selectedGlb: nextPath,
      frameSize: frameSizeStr,
    }));
  };

  const handleFrameSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange((prev) => ({ ...prev, frameSize: val }));
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h3 className="text-sm font-bold tracking-wide uppercase text-brand-400">
            VTO Lab Verification Controls
          </h3>
          <span className="text-xs text-neutral-400">Unified Dynamic Asset Pipeline</span>
        </div>

        <Link
          href="/admin/pipeline"
          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold transition"
        >
          <span>Admin Asset Pipeline</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Milestone Model Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-300 block">
          1. Milestone Mode Selection (Gate Progression)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleModelChange('axes')}
            className={`py-2 px-3 rounded-xl text-xs font-medium transition border ${
              state.activeModel === 'axes'
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
            }`}
          >
            Milestone 3: 3D Axes
          </button>

          <button
            type="button"
            onClick={() => handleModelChange('cube')}
            className={`py-2 px-3 rounded-xl text-xs font-medium transition border ${
              state.activeModel === 'cube'
                ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
            }`}
          >
            Milestone 3: 3D Cube
          </button>

          <button
            type="button"
            onClick={() => handleModelChange('glasses')}
            className={`py-2 px-3 rounded-xl text-xs font-medium transition border ${
              state.activeModel === 'glasses'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30 font-semibold'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
            }`}
          >
            Milestone 5: Eyewear GLB
          </button>

          <button
            type="button"
            onClick={() => handleModelChange('none')}
            className={`py-2 px-3 rounded-xl text-xs font-medium transition border ${
              state.activeModel === 'none'
                ? 'bg-neutral-600 border-neutral-500 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
            }`}
          >
            Camera Only
          </button>
        </div>
      </div>

      {/* GLB Asset & Frame Size */}
      {state.activeModel === 'glasses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-400">
              GLB Model Asset ({registeredAssets.length} Ingested)
            </label>
            <select
              value={state.selectedGlb}
              onChange={handleGlbChange}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              {registeredAssets.map((asset) => (
                <option key={asset.assetId} value={asset.paths.vtoGlbUrl || asset.paths.sourceGlbUrl}>
                  {asset.name} ({asset.paths.vtoGlbUrl.split('/').pop()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-400">
              Optical Frame Size (Boxing Notation)
            </label>
            <input
              type="text"
              value={state.frameSize}
              onChange={handleFrameSizeChange}
              placeholder="e.g. 52□18-140"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>
        </div>
      )}

      {/* Feature Toggles & Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-800">
        <button
          type="button"
          onClick={() =>
            onChange((prev) => ({ ...prev, showHeadOcclusion: !prev.showHeadOcclusion }))
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            state.showHeadOcclusion
              ? 'bg-emerald-700 border-emerald-400 text-white shadow-md shadow-emerald-700/30'
              : 'bg-neutral-800 border-neutral-700 text-neutral-400'
          }`}
        >
          Head Occlusion: {state.showHeadOcclusion ? 'ON (Masking Temples)' : 'OFF'}
        </button>

        <button
          type="button"
          onClick={() =>
            onChange((prev) => ({ ...prev, debugOccluderMesh: !prev.debugOccluderMesh }))
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            state.debugOccluderMesh
              ? 'bg-blue-900/80 border-blue-400 text-blue-200'
              : 'bg-neutral-800 border-neutral-700 text-neutral-400'
          }`}
        >
          Occluder Mesh: {state.debugOccluderMesh ? 'SHOW WIRE' : 'HIDE'}
        </button>

        <button
          type="button"
          onClick={() =>
            onChange((prev) => ({ ...prev, mirrorPresentation: !prev.mirrorPresentation }))
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            state.mirrorPresentation
              ? 'bg-neutral-800 border-neutral-600 text-white'
              : 'bg-neutral-900 border-neutral-700 text-neutral-500'
          }`}
        >
          Mirror: {state.mirrorPresentation ? 'ON' : 'OFF'}
        </button>

        <button
          type="button"
          onClick={() =>
            onChange((prev) => ({ ...prev, showLandmarks2D: !prev.showLandmarks2D }))
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            state.showLandmarks2D
              ? 'bg-cyan-900/60 border-cyan-500 text-cyan-200'
              : 'bg-neutral-800 border-neutral-700 text-neutral-400'
          }`}
        >
          2D Landmarks: {state.showLandmarks2D ? 'ON' : 'OFF'}
        </button>

        <button
          type="button"
          onClick={() =>
            onChange((prev) => ({ ...prev, debugOverlay: !prev.debugOverlay }))
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            state.debugOverlay
              ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200'
              : 'bg-neutral-800 border-neutral-700 text-neutral-400'
          }`}
        >
          Debug HUD: {state.debugOverlay ? 'ON' : 'OFF'}
        </button>

        <button
          type="button"
          onClick={onReloadDetector}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 transition"
        >
          Reload Detector
        </button>

        <button
          type="button"
          onClick={onRestartCamera}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 transition"
        >
          Restart Camera
        </button>
      </div>
    </div>
  );
}

export default VTOControls;
