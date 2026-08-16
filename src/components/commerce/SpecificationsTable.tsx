// src/components/commerce/SpecificationsTable.tsx
/**
 * Physical Eyewear Specifications Table
 * Displays lens width, bridge, temple, total frame width, weight, and material.
 * Highlights inherited vs custom overrides.
 */

'use client';

import React from 'react';
import {
  ResolvedProduct,
  ResolvedProductVariant,
} from '@/lib/commerce/types';
import { Info, Check } from 'lucide-react';

export interface SpecificationsTableProps {
  product: ResolvedProduct;
  variant: ResolvedProductVariant;
}

export function SpecificationsTable({
  product,
  variant,
}: SpecificationsTableProps) {
  const specs = variant.effectiveSpecifications;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-neutral-900 mb-1">
          Frame Dimensions & Physical Specifications
        </h3>
        <p className="text-xs text-neutral-500">
          Precision metric dimensions calibrated for true-to-life fit and virtual try-on accuracy.
        </p>
      </div>

      {/* Primary 4-Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
            Frame Width
          </span>
          <span className="text-lg font-black text-neutral-900">
            {specs.frameWidthMm} mm
          </span>
          {variant.hasSpecOverride && (
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium block mt-1 w-fit">
              Custom override
            </span>
          )}
        </div>

        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
            Lens Width
          </span>
          <span className="text-lg font-black text-neutral-900">
            {specs.lensWidthMm} mm
          </span>
          <span className="text-[10px] text-neutral-400 block mt-1">Eye size</span>
        </div>

        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
            Bridge Width
          </span>
          <span className="text-lg font-black text-neutral-900">
            {specs.bridgeWidthMm} mm
          </span>
          <span className="text-[10px] text-neutral-400 block mt-1">Nose distance</span>
        </div>

        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
            Temple Length
          </span>
          <span className="text-lg font-black text-neutral-900">
            {specs.templeLengthMm} mm
          </span>
          <span className="text-[10px] text-neutral-400 block mt-1">Arm length</span>
        </div>
      </div>

      {/* Secondary Specs List */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100 text-xs">
        <div className="flex justify-between items-center p-3.5">
          <span className="text-neutral-500 font-medium">Optical Frame Code</span>
          <span className="font-mono font-bold text-neutral-900 text-sm">
            {specs.frameSize}
          </span>
        </div>

        <div className="flex justify-between items-center p-3.5">
          <span className="text-neutral-500 font-medium">Frame Material</span>
          <span className="font-semibold text-neutral-900">
            {variant.effectiveMaterial}
          </span>
        </div>

        <div className="flex justify-between items-center p-3.5">
          <span className="text-neutral-500 font-medium">Total Weight</span>
          <span className="font-semibold text-neutral-900">
            {variant.effectiveWeight} (Ultra-lightweight)
          </span>
        </div>

        <div className="flex justify-between items-center p-3.5">
          <span className="text-neutral-500 font-medium">Face Shape Recommendations</span>
          <span className="font-semibold text-neutral-900 capitalize">
            {product.faceShape.join(', ')}
          </span>
        </div>
      </div>

      {/* Frame Size Educational Tip */}
      <div className="flex items-start gap-3 p-4 bg-brand-50/60 rounded-2xl border border-brand-200/60 text-xs text-brand-900">
        <Info className="w-4 h-4 text-brand-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-semibold">
            How to read your frame size ({specs.frameSize}):
          </p>
          <p className="text-brand-800">
            Check the inside temple arm of your current glasses. The numbers represent{' '}
            <span className="font-bold">{specs.lensWidthMm}mm</span> lens width,{' '}
            <span className="font-bold">{specs.bridgeWidthMm}mm</span> bridge width, and{' '}
            <span className="font-bold">{specs.templeLengthMm}mm</span> arm length.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SpecificationsTable;
