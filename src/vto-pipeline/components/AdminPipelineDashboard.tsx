// src/vto-pipeline/components/AdminPipelineDashboard.tsx
/**
 * Complete Admin Eyewear Ingestion & Calibration Workspace.
 * End-to-end: Upload -> Validate -> Inspect -> Process -> Multi-Angle 3D Review -> Calibrate -> Approve.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import {
  AssetCalibrationMetadata,
  AssetInspectionReport,
  AssetValidationReport,
} from '../types/AssetTypes';
import { defaultVTOAssetProcessor, VTOProcessingOutput } from '../processor/VTOAssetProcessor';
import { globalVTOAssetRegistry } from '../registry/VTOAssetRegistry';
import { MultiAnglePreviewCanvas, InspectionAnglePreset } from './MultiAnglePreviewCanvas';
import { InspectionReportView } from './InspectionReportView';
import { CalibrationEditor } from './CalibrationEditor';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Check,
  RotateCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

export function AdminPipelineDashboard() {
  const [selectedSample, setSelectedSample] = useState<string>('/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Core Pipeline State
  const [sourceScene, setSourceScene] = useState<THREE.Group | null>(null);
  const [vtoScene, setVtoScene] = useState<THREE.Group | null>(null);
  const [inspection, setInspection] = useState<AssetInspectionReport | null>(null);
  const [validation, setValidation] = useState<AssetValidationReport | null>(null);
  const [metadata, setMetadata] = useState<AssetCalibrationMetadata | null>(null);

  // 3D Canvas Controls
  const [presetAngle, setPresetAngle] = useState<InspectionAnglePreset>('front');
  const [showHead, setShowHead] = useState<boolean>(true);
  const [showLandmark, setShowLandmark] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'vto' | 'source' | 'both'>('vto');

  // Approval notification
  const [isApproved, setIsApproved] = useState<boolean>(false);

  const rawBufferRef = useRef<ArrayBuffer | null>(null);
  const fileNameRef = useRef<string>('model.glb');
  const tmpUrlRef = useRef<string | null>(null);

  // Process a GLB buffer through the pipeline
  const processBuffer = useCallback(
    async (buffer: ArrayBuffer, fileName: string, tmpUrl?: string, customMeta?: Partial<AssetCalibrationMetadata>) => {
      setIsLoading(true);
      setError(null);
      setIsApproved(false);
      rawBufferRef.current = buffer;
      fileNameRef.current = fileName;
      if (tmpUrl) tmpUrlRef.current = tmpUrl;

      try {
        const loader = new GLTFLoader();
        loader.parse(
          buffer,
          '',
          async (gltf) => {
            try {
              const srcGroup = gltf.scene as THREE.Group;
              setSourceScene(srcGroup);

              const output: VTOProcessingOutput = await defaultVTOAssetProcessor.processGlbBuffer(
                buffer,
                fileName,
                {
                  physicalDimensions: customMeta?.physicalDimensions,
                  customBridge: customMeta?.registration?.bridge,
                  templeProcessing: customMeta?.templeProcessing,
                },
                false,
              );

              setVtoScene(output.vtoScene);
              setInspection(output.inspectionReport);
              setValidation(output.validationReport);
              setMetadata(output.metadata);
              setIsLoading(false);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              setError(msg);
              setIsLoading(false);
            }
          },
          (err) => {
            setError(`GLB parse error: ${err}`);
            setIsLoading(false);
          },
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setIsLoading(false);
      }
    },
    [],
  );

  // Load sample on mount or change
  useEffect(() => {
    if (!selectedSample) return;
    const fetchSample = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(selectedSample);
        const buffer = await res.arrayBuffer();
        const fname = selectedSample.split('/').pop() || 'sample.glb';
        await processBuffer(buffer, fname);
      } catch (err) {
        setError(`Failed to fetch sample GLB: ${err}`);
        setIsLoading(false);
      }
    };
    fetchSample();
  }, [selectedSample, processBuffer]);

  // Handle custom upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // 1. Get signed URL
      const genRes = await fetch('http://localhost:3001/api/upload-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-url', filename: file.name }),
      });
      if (!genRes.ok) throw new Error('Failed to generate upload URL');
      const { signedUrl, path } = await genRes.json();

      // 2. Upload to storage
      await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'model/gltf-binary' },
        body: file,
      });

      // 3. Process via Generator (optimize)
      const procRes = await fetch('http://localhost:3001/api/upload-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process-model', rawPath: path }),
      });
      if (!procRes.ok) throw new Error('Failed to process model on server');
      const { glbPath } = await procRes.json();

      // 4. Download optimized buffer
      const optRes = await fetch(glbPath);
      const buffer = await optRes.arrayBuffer();

      setSelectedSample('');
      await processBuffer(buffer, file.name, glbPath);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setIsLoading(false);
    }
  };

  const handleReProcess = async () => {
    if (!rawBufferRef.current || !metadata) return;
    await processBuffer(rawBufferRef.current, fileNameRef.current, tmpUrlRef.current || undefined, metadata);
  };

  // Approve and publish (Register VTO Asset)
  const handleApprove = async () => {
    if (!metadata || !rawBufferRef.current) return;
    setIsLoading(true);

    try {
      let vtoGlbBuffer: ArrayBuffer | undefined;
      if (vtoScene) {
         vtoGlbBuffer = await defaultVTOAssetProcessor.exportToGlb(vtoScene);
      } else {
         throw new Error("No VTO Scene available");
      }

      const formData = new FormData();
      const blob = new Blob([vtoGlbBuffer], { type: 'model/gltf-binary' });
      formData.append('file', blob, metadata.paths.vtoGlbUrl.split('/').pop() || 'optimized.glb');
      formData.append('evidence', JSON.stringify(metadata));
      formData.append('clientValidationStatus', validation?.overallStatus || 'PASS');
      if (tmpUrlRef.current) {
        formData.append('tmpGlbUrl', tmpUrlRef.current);
      }

      const res = await fetch('http://localhost:3001/api/register-vto-asset', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
         throw new Error(data.error || data.message || `Registration failed: ${res.status}`);
      }

      const approved = { ...metadata, status: data.status || 'REVIEW_REQUIRED' };
      setMetadata(approved);
      setIsApproved(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Approval failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Eyewear GLB → VTO Ingestion Pipeline
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Automated 3D Asset Inspection, Validation, Temple Slicing, and Physical Calibration Studio
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/vto-lab"
            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            Open VTO Lab
          </Link>
        </div>
      </div>

      {/* Ingestion Source Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl">
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-neutral-300">Catalog Test Asset:</label>
          <button
            type="button"
            onClick={() => setSelectedSample('/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              selectedSample.includes('Cat_Eye')
                ? 'bg-purple-900/60 border-purple-400 text-purple-200 font-bold'
                : 'bg-neutral-800 border-neutral-700 text-neutral-300'
            }`}
          >
            Meshy Cat-Eye Purple
          </button>

          <button
            type="button"
            onClick={() => setSelectedSample('/models/glasses.glb')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              selectedSample.includes('glasses.glb')
                ? 'bg-amber-900/60 border-amber-400 text-amber-200 font-bold'
                : 'bg-neutral-800 border-neutral-700 text-neutral-300'
            }`}
          >
            Classic Havana Acetate
          </button>
        </div>

        {/* Upload Custom GLB */}
        <div className="flex items-center justify-end">
          <label className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-600/30">
            <UploadCloud className="w-4 h-4" />
            <span>Upload New GLB</span>
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <span className="font-bold">Pipeline Error: </span>
            {error}
          </div>
        </div>
      )}

      {/* Main Grid: 3D Stage on Left, Diagnostics/Calibration on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3D Multi-Angle Preview Stage (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="aspect-[4/3] w-full relative">
            <MultiAnglePreviewCanvas
              sourceScene={sourceScene}
              vtoScene={vtoScene}
              metadata={metadata}
              presetAngle={presetAngle}
              showHeadReference={showHead}
              showLandmark168={showLandmark}
              showAxes={showAxes}
              showWireframe={showWireframe}
              viewMode={viewMode}
            />

            {isLoading && (
              <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 rounded-2xl z-20">
                <RotateCw className="w-8 h-8 text-brand-400 animate-spin" />
                <span className="text-xs font-mono text-neutral-300">Processing 3D Asset Geometry...</span>
              </div>
            )}
          </div>

          {/* 3D Viewport Controls & Angle Presets */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-neutral-300">Inspection Angles:</span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['front', 'Front (0°)'],
                    ['left-30', '30° Left'],
                    ['right-30', '30° Right'],
                    ['left-45', '45° Left'],
                    ['right-45', '45° Right'],
                    ['top', 'Top View'],
                    ['free', 'Orbit'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPresetAngle(key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                      presetAngle === key
                        ? 'bg-brand-600 border-brand-400 text-white'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 text-[11px] font-semibold">View Mode:</span>
                {(['vto', 'source', 'both'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition ${
                      viewMode === mode
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHead(!showHead)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                    showHead ? 'bg-blue-900/60 border-blue-500 text-blue-300' : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                  }`}
                >
                  Head Occluder: {showHead ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowWireframe(!showWireframe)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                    showWireframe ? 'bg-cyan-900/60 border-cyan-500 text-cyan-300' : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                  }`}
                >
                  Wireframe: {showWireframe ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calibration & Diagnostics (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Approval Action Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Asset Lifecycle State
              </div>
              <div className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {metadata?.status || 'INSPECTED'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproved}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
                  isApproved
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                {isApproved ? 'Submitted for Review' : 'Submit for Review'}
              </button>
            </div>
          </div>

          {/* Calibration Adjustments */}
          {metadata && (
            <CalibrationEditor
              metadata={metadata}
              onChange={setMetadata}
              onApplyReProcess={handleReProcess}
            />
          )}

          {/* Diagnostic Inspection & Validation Report */}
          {inspection && validation && (
            <InspectionReportView
              inspection={inspection}
              validation={validation}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPipelineDashboard;
