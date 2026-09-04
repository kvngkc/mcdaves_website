// src/app/checkout/page.tsx
// ─── Checkout Page Coordinator (3-Step Wizard) ───────────────────────────────
'use client';

import React, { useState, useCallback, useRef, SyntheticEvent } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronLeft,
  Lock,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui';
import { deliveryConfig } from '@/config/services';
import {
  CustomerDetails,
  DeliveryDetails,
  FieldErrors,
  validateCustomer,
} from './components/types';
import { CustomerStep } from './components/CustomerStep';
import { DeliveryStep } from './components/DeliveryStep';
import { ReviewStep } from './components/ReviewStep';

// ─── Step Indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1 as const, label: 'Customer Details' },
  { num: 2 as const, label: 'Delivery & Prescription' },
  { num: 3 as const, label: 'Review & Pay' },
];

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full mb-8 md:mb-10">
      {STEPS.map((step, idx) => {
        const isDone = step.num < currentStep;
        const isActive = step.num === currentStep;

        return (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ring-4',
                  isDone
                    ? 'bg-brand-600 text-white ring-brand-100'
                    : isActive
                    ? 'bg-brand-600 text-white ring-brand-200 shadow-lg scale-110'
                    : 'bg-neutral-100 text-neutral-400 ring-transparent',
                ].join(' ')}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <span>{step.num}</span>
                )}
              </div>
              <span
                className={[
                  'text-[11px] font-medium text-center leading-tight max-w-[72px] hidden sm:block',
                  isActive ? 'text-brand-700' : isDone ? 'text-brand-600' : 'text-neutral-400',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={[
                  'h-0.5 flex-1 mx-2 rounded-full transition-all duration-500',
                  step.num < currentStep ? 'bg-brand-500' : 'bg-neutral-200',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Page Coordinator ───────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, subtotal } = useCart();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Step 1: Customer details state
  const [customer, setCustomer] = useState<CustomerDetails>({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });
  const [customerErrors, setCustomerErrors] = useState<FieldErrors<CustomerDetails>>({});

  // Step 2: Delivery & Prescription state
  const [delivery, setDelivery] = useState<DeliveryDetails>({
    method: 'door',
    prescriptionOption: 'plano',
    prescriptionFile: null,
    notes: '',
  });
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPrescriptionItems = items.some(
    (item) => item.prescriptionRequired || item.price >= 40000,
  );

  // Delivery fee calculation using canonical SSOT
  const deliveryFee =
    delivery.method === 'pickup'
      ? deliveryConfig.lagosPickupFee
      : subtotal >= deliveryConfig.freeThreshold
      ? 0
      : deliveryConfig.standardFee;

  const total = subtotal + deliveryFee;

  // Step 1 Handlers
  const handleCustomerChange =
    (field: keyof CustomerDetails) =>
    (e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = (e.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
      setCustomer((prev) => ({ ...prev, [field]: value }));
      if (customerErrors[field]) {
        setCustomerErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleStep1Continue = () => {
    const errors = validateCustomer(customer);
    if (Object.keys(errors).length > 0) {
      setCustomerErrors(errors);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) {
      setDelivery((prev) => ({ ...prev, prescriptionFile: null }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File must be smaller than 5 MB.');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setFileError('Only JPG, PNG or PDF files are accepted.');
      return;
    }
    setDelivery((prev) => ({ ...prev, prescriptionFile: file }));
  };

  const handleStep2Continue = () => {
    if (hasPrescriptionItems && delivery.prescriptionOption === 'upload' && !delivery.prescriptionFile) {
      setFileError('Please select a prescription file to upload.');
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3: Pay Handler
  const handlePay = useCallback(async () => {
    setPaying(true);
    setPayError(null);

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '2348152346649';

    const metadata: Record<string, unknown> = {
      customerName: customer.fullName,
      customerPhone: customer.phone,
      deliveryAddress: `${customer.address}, ${customer.city}, ${customer.state}`,
      deliveryMethod: delivery.method,
      prescriptionOption: hasPrescriptionItems ? delivery.prescriptionOption : 'n/a',
      notes: delivery.notes || '',
      whatsappNumber,
      orderItems: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        variantSku: item.variantSku,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        color: item.color || null,
      })),
    };

    try {
      const res = await fetch('/api/pay/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customer.email,
          amount: total,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            variantSku: item.variantSku,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            color: item.color || null,
          })),
          deliveryMethod: delivery.method,
          metadata,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || 'Could not initialize payment.');
      }

      const data = (await res.json()) as {
        authorizationUrl: string;
        reference: string;
        amount?: number;
      };

      // Save reference and confirmed total to sessionStorage for callback page
      sessionStorage.setItem('mcdaves_pending_ref', data.reference);
      sessionStorage.setItem('mcdaves_pending_total', String(data.amount || total));

      // Redirect to Paystack hosted checkout
      window.location.href = data.authorizationUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment error. Please try again.';
      setPayError(msg);
      setPaying(false);
    }
  }, [customer, delivery, hasPrescriptionItems, items, total]);

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-brand-600" aria-hidden="true" />
        </div>
        <h1 className="text-h3 font-semibold text-neutral-900 mb-3">Your cart is empty</h1>
        <p className="text-body-sm text-neutral-500 mb-8 max-w-sm">
          Add some items to your cart before checking out.
        </p>
        <Link href="/shop/">
          <Button variant="primary" size="lg">Browse the Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Page Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <Link href="/shop/" className="text-brand-600 hover:text-brand-800 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-h4 font-semibold text-neutral-900">Checkout</h1>
          <div className="ml-auto flex items-center gap-1.5 text-caption text-neutral-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Step 1: Customer Details */}
        {step === 1 && (
          <CustomerStep
            customer={customer}
            customerErrors={customerErrors}
            onChange={handleCustomerChange}
            onContinue={handleStep1Continue}
          />
        )}

        {/* Step 2: Delivery & Prescription */}
        {step === 2 && (
          <DeliveryStep
            delivery={delivery}
            hasPrescriptionItems={hasPrescriptionItems}
            subtotal={subtotal}
            fileError={fileError}
            fileInputRef={fileInputRef}
            onDeliveryChange={setDelivery}
            onFileChange={handleFileChange}
            onFileErrorChange={setFileError}
            onBack={() => {
              setStep(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onContinue={handleStep2Continue}
          />
        )}

        {/* Step 3: Review & Pay */}
        {step === 3 && (
          <ReviewStep
            items={items}
            customer={customer}
            delivery={delivery}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            paying={paying}
            payError={payError}
            onPay={handlePay}
            onBack={() => {
              setStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>
    </div>
  );
}
