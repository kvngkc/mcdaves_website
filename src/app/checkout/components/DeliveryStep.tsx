// src/app/checkout/components/DeliveryStep.tsx
'use client';

import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Truck,
  MapPin,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { deliveryConfig } from '@/config/services';
import {
  DeliveryDetails,
  DELIVERY_OPTIONS,
  PRESCRIPTION_OPTIONS,
} from './types';

interface DeliveryStepProps {
  delivery: DeliveryDetails;
  hasPrescriptionItems: boolean;
  subtotal: number;
  fileError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDeliveryChange: React.Dispatch<React.SetStateAction<DeliveryDetails>>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileErrorChange: (err: string | null) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function DeliveryStep({
  delivery,
  hasPrescriptionItems,
  subtotal,
  fileError,
  fileInputRef,
  onDeliveryChange,
  onFileChange,
  onFileErrorChange,
  onBack,
  onContinue,
}: DeliveryStepProps) {
  // Compute effective door delivery fee based on free-threshold eligibility
  const qualifiesForFreeDelivery = subtotal >= deliveryConfig.freeThreshold;
  const effectiveDoorFee = qualifiesForFreeDelivery ? 0 : deliveryConfig.standardFee;

  return (
    <section
      className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden"
      aria-labelledby="step2-heading"
    >
      <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/60">
        <h2 id="step2-heading" className="text-h4 font-semibold text-neutral-900">
          Delivery & Prescription
        </h2>
        <p className="text-caption text-neutral-500 mt-0.5">
          Choose how you&apos;d like to receive your order.
        </p>
      </div>

      <div className="p-6 space-y-7">
        {/* Delivery Method */}
        <fieldset>
          <legend className="text-caption font-medium text-neutral-700 mb-3">
            Delivery Method
          </legend>
          <div className="space-y-3">
            {DELIVERY_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                htmlFor={`delivery-${opt.id}`}
                className={[
                  'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
                  delivery.method === opt.id
                    ? 'border-brand-500 bg-brand-50/60'
                    : 'border-neutral-200 hover:border-brand-300 hover:bg-neutral-50',
                ].join(' ')}
              >
                <input
                  id={`delivery-${opt.id}`}
                  type="radio"
                  name="delivery-method"
                  value={opt.id}
                  checked={delivery.method === opt.id}
                  onChange={() => onDeliveryChange((prev) => ({ ...prev, method: opt.id }))}
                  className="mt-0.5 w-4 h-4 accent-brand-600 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                    <div className="flex items-center gap-2">
                      {opt.id === 'door' ? (
                        <Truck className="w-4 h-4 text-brand-600 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" aria-hidden="true" />
                      )}
                      <span className="font-semibold text-neutral-900 text-body-sm">
                        {opt.label}
                      </span>
                    </div>
                    <span
                      className={[
                        'text-caption font-semibold self-start sm:self-auto',
                        // For door delivery, use the effective fee (accounts for free threshold)
                        // For pickup, always use opt.fee (it is always 0)
                        (opt.id === 'door' ? effectiveDoorFee : opt.fee) === 0
                          ? 'text-brand-700'
                          : 'text-neutral-700',
                      ].join(' ')}
                    >
                      {opt.id === 'door'
                        ? effectiveDoorFee === 0
                          ? 'Free'
                          : `+₦${effectiveDoorFee.toLocaleString()}`
                        : opt.fee === 0
                          ? 'Free'
                          : `+₦${opt.fee.toLocaleString()}`}
                    </span>
                  </div>
                  <p className="text-caption text-neutral-500 mt-1">
                    {opt.description}
                  </p>
                </div>
              </label>
            ))}

            {/* Free delivery banner — only shown when door method is selected AND subtotal qualifies */}
            {delivery.method === 'door' && qualifiesForFreeDelivery && (
              <p className="flex items-center gap-2 text-caption text-brand-700 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2.5 font-medium">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                Your order qualifies for FREE nationwide delivery!
              </p>
            )}
          </div>
        </fieldset>

        {/* Prescription (only if prescription-required items in cart) */}
        {hasPrescriptionItems && (
          <fieldset>
            <legend className="text-caption font-medium text-neutral-700 mb-3">
              Prescription
            </legend>
            <div className="space-y-3">
              {PRESCRIPTION_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  htmlFor={`rx-${opt.id}`}
                  className={[
                    'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
                    delivery.prescriptionOption === opt.id
                      ? 'border-brand-500 bg-brand-50/60'
                      : 'border-neutral-200 hover:border-brand-300 hover:bg-neutral-50',
                  ].join(' ')}
                >
                  <input
                    id={`rx-${opt.id}`}
                    type="radio"
                    name="prescription-option"
                    value={opt.id}
                    checked={delivery.prescriptionOption === opt.id}
                    onChange={() => {
                      onDeliveryChange((prev) => ({ ...prev, prescriptionOption: opt.id, prescriptionFile: null }));
                      onFileErrorChange(null);
                    }}
                    className="mt-0.5 w-4 h-4 accent-brand-600 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-neutral-900 text-body-sm">
                      {opt.label}
                    </span>
                    <p className="text-caption text-neutral-500 mt-0.5">
                      {opt.description}
                    </p>

                    {/* File upload sub-section */}
                    {opt.id === 'upload' && delivery.prescriptionOption === 'upload' && (
                      <div className="mt-3 ml-0">
                        <button
                          type="button"
                          id="prescription-upload-btn"
                          onClick={() => fileInputRef.current?.click()}
                          className={[
                            'w-full border-2 border-dashed rounded-lg py-4 px-4 flex flex-col items-center gap-2',
                            'text-neutral-500 hover:border-brand-400 hover:text-brand-600 transition-all duration-200',
                            fileError ? 'border-accent-rose' : 'border-neutral-300',
                          ].join(' ')}
                        >
                          <Upload className="w-6 h-6" aria-hidden="true" />
                          <span className="text-caption font-medium">
                            {delivery.prescriptionFile
                              ? delivery.prescriptionFile.name
                              : 'Click to upload prescription'}
                          </span>
                          <span className="text-[11px] text-neutral-400">JPG, PNG or PDF — max 5 MB</span>
                        </button>
                        <input
                          ref={fileInputRef as React.RefObject<HTMLInputElement>}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="sr-only"
                          onChange={onFileChange}
                          aria-label="Upload prescription file"
                        />
                        {fileError && (
                          <p className="flex items-center gap-1.5 text-caption text-accent-rose mt-2">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            {fileError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Order Notes */}
        <div>
          <Input
            id="checkout-notes"
            type="textarea"
            label="Order Notes (optional)"
            placeholder="Any special instructions for your order, e.g. call before delivery, specific lens requirements…"
            rows={3}
            value={delivery.notes}
            onChange={(e) => onDeliveryChange((prev) => ({ ...prev, notes: (e.target as HTMLTextAreaElement).value }))}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Button
            id="checkout-back-step2"
            variant="secondary"
            size="lg"
            onClick={onBack}
            leadingIcon={<ChevronLeft className="w-4 h-4" />}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            id="checkout-continue-step2"
            variant="primary"
            size="lg"
            onClick={onContinue}
            trailingIcon={<ChevronRight className="w-4 h-4" />}
            className="flex-1"
          >
            Continue to Review
          </Button>
        </div>
      </div>
    </section>
  );
}
