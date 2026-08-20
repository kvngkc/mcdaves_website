// src/app/checkout/components/CustomerStep.tsx
'use client';

import React, { SyntheticEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { CustomerDetails, FieldErrors, NIGERIAN_STATES } from './types';

interface CustomerStepProps {
  customer: CustomerDetails;
  customerErrors: FieldErrors<CustomerDetails>;
  onChange: (
    field: keyof CustomerDetails,
  ) => (e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onContinue: () => void;
}

export function CustomerStep({
  customer,
  customerErrors,
  onChange,
  onContinue,
}: CustomerStepProps) {
  return (
    <section
      className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden"
      aria-labelledby="step1-heading"
    >
      <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/60">
        <h2 id="step1-heading" className="text-h4 font-semibold text-neutral-900">
          Customer Details
        </h2>
        <p className="text-caption text-neutral-500 mt-0.5">
          Where should we reach you and deliver your order?
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Email */}
        <Input
          id="checkout-email"
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          value={customer.email}
          onChange={onChange('email')}
          state={customerErrors.email ? 'error' : 'default'}
          errorMessage={customerErrors.email}
          required
          autoComplete="email"
        />

        {/* Full Name */}
        <Input
          id="checkout-name"
          type="text"
          label="Full Name"
          placeholder="John Adeyemi"
          value={customer.fullName}
          onChange={onChange('fullName')}
          state={customerErrors.fullName ? 'error' : 'default'}
          errorMessage={customerErrors.fullName}
          required
          autoComplete="name"
        />

        {/* Phone */}
        <Input
          id="checkout-phone"
          type="tel"
          label="Phone Number"
          placeholder="0812 345 6789"
          helperText="Nigerian format: 080X XXX XXXX or +234 80X XXX XXXX"
          value={customer.phone}
          onChange={onChange('phone')}
          state={customerErrors.phone ? 'error' : 'default'}
          errorMessage={customerErrors.phone}
          required
          autoComplete="tel"
        />

        {/* Delivery Address */}
        <Input
          id="checkout-address"
          type="text"
          label="Delivery Address"
          placeholder="10 Broad Street, Victoria Island"
          value={customer.address}
          onChange={onChange('address')}
          state={customerErrors.address ? 'error' : 'default'}
          errorMessage={customerErrors.address}
          required
          autoComplete="street-address"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* City */}
          <Input
            id="checkout-city"
            type="text"
            label="City"
            placeholder="Lagos"
            value={customer.city}
            onChange={onChange('city')}
            state={customerErrors.city ? 'error' : 'default'}
            errorMessage={customerErrors.city}
            required
            autoComplete="address-level2"
          />

          {/* State */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="checkout-state"
              className="block text-caption font-medium text-neutral-700 leading-none"
            >
              State <span className="text-accent-rose">*</span>
            </label>
            <div className="relative">
              <select
                id="checkout-state"
                value={customer.state}
                onChange={onChange('state')}
                required
                className={[
                  'block w-full h-11 pl-3.5 pr-10 rounded-lg border bg-white font-sans text-body-sm text-neutral-800',
                  'transition-all duration-150 ease-in-out appearance-none',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  customerErrors.state
                    ? 'border-accent-rose focus:border-accent-rose focus:ring-accent-rose/30'
                    : 'border-neutral-300 focus:border-brand-500 focus:ring-brand-500/30',
                  !customer.state ? 'text-neutral-400' : 'text-neutral-800',
                ].join(' ')}
                aria-describedby={customerErrors.state ? 'checkout-state-error' : undefined}
                aria-invalid={!!customerErrors.state}
              >
                <option value="" disabled>Select state…</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {/* Chevron icon */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400">
                <ChevronRight className="w-4 h-4 rotate-90" aria-hidden="true" />
              </div>
            </div>
            {customerErrors.state && (
              <p id="checkout-state-error" className="text-caption text-accent-rose leading-tight">
                {customerErrors.state}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <Button
            id="checkout-continue-step1"
            variant="primary"
            size="lg"
            fullWidth
            onClick={onContinue}
            trailingIcon={<ChevronRight className="w-4 h-4" />}
          >
            Continue to Delivery
          </Button>
        </div>
      </div>
    </section>
  );
}
