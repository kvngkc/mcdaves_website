// src/vto-pipeline/components/InspectionReportView.tsx
/**
 * Detailed Diagnostic Breakdown & Inspection Report Component.
 * Displays geometry breakdown, validation statuses, bounding metrics, and hierarchy.
 */

'use client';

import React, { useState } from 'react';
import {
  AssetInspectionReport,
  AssetValidationReport,
  SceneNodeSummary,
} from '../types/AssetTypes';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Layers,
  Box,
  Sliders,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';

export interface InspectionReportViewProps {
  inspection: AssetInspectionReport;
  validation: AssetValidationReport;
}

function TreeNode({ node, depth = 0 }: { node: SceneNodeSummary; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="text-xs font-mono select-none">
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`flex items-center gap-1.5 py-1 px-2 rounded hover:bg-neutral-800/80 cursor-pointer transition ${
          node.isMesh ? 'text-cyan-300 font-semibold' : 'text-neutral-300'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          )
        ) : (
          <span className="w-3.5 h-3.5 inline-block text-neutral-600">•</span>
        )}

        <span>{node.name}</span>
        <span className="text-[10px] text-neutral-500 font-normal">({node.type})</span>

        {node.vertexCount && (
          <span className="ml-auto text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
            {node.vertexCount.toLocaleString()}v / {node.faceCount?.toLocaleString()}f
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map((child, i) => (
            <TreeNode key={`${child.name}-${i}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function InspectionReportView({ inspection, validation }: InspectionReportViewProps) {
  const [activeTab, setActiveTab] = useState<'validation' | 'metrics' | 'hierarchy' | 'slices'>('validation');

  const { size, center } = inspection.nativeBounds;
  const statusColor =
    validation.overallStatus === 'PASS'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : validation.overallStatus === 'REVIEW_REQUIRED'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-red-500/20 text-red-300 border-red-500/40';

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white space-y-4 shadow-xl">
      {/* Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div>
          <h3 className="text-sm font-bold tracking-wide uppercase text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-brand-400" />
            Asset Inspection & Validation Report
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            {inspection.fileName} • {(inspection.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColor}`}>
          Status: {validation.overallStatus.replace('_', ' ')}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-2.5 text-center">
          <div className="text-[10px] uppercase font-semibold text-neutral-500">Vertices</div>
          <div className="text-sm font-black text-cyan-400 font-mono mt-0.5">
            {inspection.totalVertices.toLocaleString()}
          </div>
        </div>

        <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-2.5 text-center">
          <div className="text-[10px] uppercase font-semibold text-neutral-500">Faces / Triangles</div>
          <div className="text-sm font-black text-cyan-400 font-mono mt-0.5">
            {inspection.totalFaces.toLocaleString()}
          </div>
        </div>

        <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-2.5 text-center">
          <div className="text-[10px] uppercase font-semibold text-neutral-500">Meshes / Nodes</div>
          <div className="text-sm font-black text-white font-mono mt-0.5">
            {inspection.meshCount} Meshes
          </div>
        </div>

        <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-2.5 text-center">
          <div className="text-[10px] uppercase font-semibold text-neutral-500">Materials</div>
          <div className="text-sm font-black text-amber-400 font-mono mt-0.5">
            {inspection.materialNames.length} Assigned
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-800 gap-2">
        <button
          onClick={() => setActiveTab('validation')}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'validation'
              ? 'border-brand-400 text-brand-300'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Validation Checks ({validation.summary.passes}P / {validation.summary.warnings}W / {validation.summary.failures}F)
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'metrics'
              ? 'border-brand-400 text-brand-300'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Features & Dimensions
        </button>

        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'hierarchy'
              ? 'border-brand-400 text-brand-300'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Scene Tree ({inspection.meshCount})
        </button>

        <button
          onClick={() => setActiveTab('slices')}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition ${
            activeTab === 'slices'
              ? 'border-brand-400 text-brand-300'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Z-Slice Sieve
        </button>
      </div>

      {/* Tab 1: Validation Checks */}
      {activeTab === 'validation' && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {validation.checks.map((check, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs"
            >
              {check.status === 'PASS' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {check.status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {check.status === 'FAIL' && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    [{check.category}] {check.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      check.status === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : check.status === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
                <p className="text-neutral-400 mt-1 leading-relaxed">{check.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Features & Dimensions */}
      {activeTab === 'metrics' && (
        <div className="space-y-3 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-1.5">
              <div className="font-bold text-brand-300 uppercase text-[11px]">Native Bounding Dimensions</div>
              <div className="text-neutral-300">Width (X): <span className="text-white">{size.x.toFixed(4)}</span></div>
              <div className="text-neutral-300">Height (Y): <span className="text-white">{size.y.toFixed(4)}</span></div>
              <div className="text-neutral-300">Depth (Z): <span className="text-white">{size.z.toFixed(4)}</span></div>
              <div className="text-neutral-300">Center: <span className="text-cyan-300">({center.x.toFixed(2)}, {center.y.toFixed(2)}, {center.z.toFixed(2)})</span></div>
            </div>

            <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-1.5">
              <div className="font-bold text-brand-300 uppercase text-[11px]">Feature Extraction</div>
              <div className="text-neutral-300">
                Bridge Contact: <span className="text-amber-300">Z={inspection.detectedFeatures.bridge.innerContactZ.toFixed(3)}</span>
              </div>
              <div className="text-neutral-300">
                Bridge Front: <span className="text-amber-300">Z={inspection.detectedFeatures.bridge.frontZ.toFixed(3)}</span>
              </div>
              <div className="text-neutral-300">
                Rear Overhang: <span className={inspection.detectedFeatures.temples.hasSevereRearOverhang ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                  {inspection.detectedFeatures.temples.hasSevereRearOverhang ? 'DETECTED (Trimming Recommended)' : 'NORMAL'}
                </span>
              </div>
              <div className="text-neutral-300">
                Inferred Forward: <span className="text-cyan-300">{inspection.inferredOrientation.forward} ({(inspection.inferredOrientation.confidence * 100).toFixed(0)}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Hierarchy Tree */}
      {activeTab === 'hierarchy' && (
        <div className="max-h-72 overflow-y-auto bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
          <TreeNode node={inspection.sceneHierarchy} />
        </div>
      )}

      {/* Tab 4: Z-Slice Sieve */}
      {activeTab === 'slices' && (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {inspection.zSlices.map((s) => (
            <div
              key={s.sliceIndex}
              className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800 text-[11px] font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-center text-neutral-500 font-bold">{s.sliceIndex}</span>
                <span className="text-neutral-300 font-semibold">{s.label}</span>
                <span className="text-neutral-500">[{s.zRange[0].toFixed(2)} to {s.zRange[1].toFixed(2)}]</span>
              </div>
              <div className="text-cyan-400 font-bold">{s.vertexCount.toLocaleString()} verts</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InspectionReportView;
