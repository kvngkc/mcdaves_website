// src/vto-pipeline/components/CalibrationEditor.tsx
/**
 * Interactive Calibration & Processing Profile Editor for Admins.
 * Allows micro-adjusting bridge coordinates, optical dimensions, and temple cutoff planes live.
 */

'use client';

import React from 'react';
import {
  AssetCalibrationMetadata,
  BridgeRegistration,
  OpticalDimensions,
  TempleProcessingProfile,
} from '../types/AssetTypes';
import { Sliders, Scissors, Move, Ruler, RotateCw } from 'lucide-react';

export interface CalibrationEditorProps {
  metadata: AssetCalibrationMetadata;
  onChange: (updated: AssetCalibrationMetadata) => void;
  onApplyReProcess?: () => void;
}

export function CalibrationEditor({
  metadata,
  onChange,
  onApplyReProcess,
}: CalibrationEditorProps) {
  const { physicalDimensions, registration, templeProcessing } = metadata;

  const updateBridge = (key: keyof BridgeRegistration, val: number) => {
    onChange({
      ...metadata,
      registration: {
        ...metadata.registration,
        bridge: {
          ...metadata.registration.bridge,
          [key]: val,
        },
      },
    });
  };

  const updateDimensions = (key: keyof OpticalDimensions, val: number) => {
    onChange({
      ...metadata,
      physicalDimensions: {
        ...metadata.physicalDimensions,
        [key]: val,
      },
    });
  };

  const updateTemple = (updates: Partial<TempleProcessingProfile>) => {
    onChange({
      ...metadata,
      templeProcessing: {
        ...metadata.templeProcessing,
        ...updates,
      },
    });
  };

  const updateRotation = (axis: 'x' | 'y' | 'z', val: number) => {
    onChange({
      ...metadata,
      registration: {
        ...metadata.registration,
        rotationOffsetEuler: {
          ...metadata.registration.rotationOffsetEuler,
          [axis]: (val * Math.PI) / 180, // store in radians
        },
      },
    });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white space-y-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h3 className="text-sm font-bold tracking-wide uppercase text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-400" />
          Asset Calibration & Processing Controls
        </h3>
        <span className="text-xs font-mono text-neutral-400">
          v{metadata.versioning.calibrationVersion}.0
        </span>
      </div>

      {/* 1. Bridge Registration Offset */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-amber-400" />
            1. Physical Bridge Anchor Point (Model Space)
          </label>
          <span className="text-[11px] text-neutral-400 font-mono">
            ({registration.bridge.x.toFixed(3)}, {registration.bridge.y.toFixed(3)}, {registration.bridge.z.toFixed(3)})
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          {/* Bridge X */}
          <div className="space-y-1 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
            <div className="flex justify-between text-neutral-400 font-mono text-[10px]">
              <span>X (Lateral)</span>
              <span>{registration.bridge.x.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min={-registration.measuredNativeWidth * 0.2}
              max={registration.measuredNativeWidth * 0.2}
              step={0.001}
              value={registration.bridge.x}
              onChange={(e) => updateBridge('x', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Bridge Y */}
          <div className="space-y-1 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
            <div className="flex justify-between text-neutral-400 font-mono text-[10px]">
              <span>Y (Up/Down)</span>
              <span>{registration.bridge.y.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min={registration.bridge.y - 1.0}
              max={registration.bridge.y + 1.0}
              step={0.001}
              value={registration.bridge.y}
              onChange={(e) => updateBridge('y', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Bridge Z */}
          <div className="space-y-1 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
            <div className="flex justify-between text-neutral-400 font-mono text-[10px]">
              <span>Z (Forward Depth)</span>
              <span>{registration.bridge.z.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min={registration.bridge.z - 1.5}
              max={registration.bridge.z + 1.5}
              step={0.001}
              value={registration.bridge.z}
              onChange={(e) => updateBridge('z', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. Physical Eyewear Dimensions */}
      <div className="space-y-3 border-t border-neutral-800/80 pt-4">
        <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-cyan-400" />
          2. Physical Optical Frame Dimensions (mm)
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400">Total Frame Width</span>
            <input
              type="number"
              value={physicalDimensions.frameWidthMm}
              onChange={(e) => updateDimensions('frameWidthMm', parseFloat(e.target.value) || 120)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400">Lens Width</span>
            <input
              type="number"
              value={physicalDimensions.lensWidthMm || 52}
              onChange={(e) => updateDimensions('lensWidthMm', parseFloat(e.target.value) || 52)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400">Bridge Width</span>
            <input
              type="number"
              value={physicalDimensions.bridgeWidthMm || 18}
              onChange={(e) => updateDimensions('bridgeWidthMm', parseFloat(e.target.value) || 18)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400">Temple Length</span>
            <input
              type="number"
              value={physicalDimensions.templeLengthMm || 140}
              onChange={(e) => updateDimensions('templeLengthMm', parseFloat(e.target.value) || 140)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* 3. Temple Processing Profile */}
      <div className="space-y-3 border-t border-neutral-800/80 pt-4">
        <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-purple-400" />
          3. VTO Temple Processing Strategy
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['auto', 'full', 'shortened', 'disabled'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateTemple({ mode })}
              className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition border ${
                templeProcessing.mode === mode
                  ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {templeProcessing.mode !== 'disabled' && templeProcessing.mode !== 'full' && (
          <div className="space-y-1 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
            <div className="flex justify-between text-neutral-400 font-mono text-[10px]">
              <span>Temple Retention Ratio from Hinges</span>
              <span className="text-purple-300 font-bold">
                {((templeProcessing.cutRatio || 0.7) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0.3}
              max={1.0}
              step={0.05}
              value={templeProcessing.cutRatio || 0.7}
              onChange={(e) => updateTemple({ cutRatio: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Re-process Button */}
      {onApplyReProcess && (
        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onApplyReProcess}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Re-generate VTO Derivative
          </button>
        </div>
      )}
    </div>
  );
}

export default CalibrationEditor;
