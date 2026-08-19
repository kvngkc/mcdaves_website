// src/app/checkout/page.tsx
// ─── Checkout Page — 3-Step Wizard ────────────────────────────────────────────
'use client';

import React, { useState, useCallback, useRef, SyntheticEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Truck,
  MapPin,
  Upload,
  Lock,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button, Input, Price } from '@/components/ui';
import { businessIdentity, deliveryConfig } from '@/config';

// ─── Nigerian States ───────────────────────────────────────────────────────────
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'Federal Capital Territory', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
] as const;

// ─── Delivery Methods ──────────────────────────────────────────────────────────
type DeliveryMethod = 'door' | 'pickup';

const DELIVERY_OPTIONS: { id: DeliveryMethod; label: string; description: string; fee: number }[] = [
  {
    id: 'door',
    label: 'Door Delivery',
    description: deliveryConfig.timelines.displaySummary,
    fee: deliveryConfig.standardFee,
  },
  {
    id: 'pickup',
    label: 'Pickup in Lagos',
    description: `${businessIdentity.contact.address.shortAddress} — Ready in ${deliveryConfig.timelines.lagosPickup}`,
    fee: deliveryConfig.lagosPickupFee,
  },
];

// ─── Prescription Options ──────────────────────────────────────────────────────
type PrescriptionOption = 'upload' | 'plano' | 'whatsapp';

const PRESCRIPTION_OPTIONS: { id: PrescriptionOption; label: string; description: string }[] = [
  { id: 'upload',   label: 'I have a prescription', description: 'Upload JPG, PNG or PDF (max 5 MB)' },
  { id: 'plano',    label: 'Plano / non-prescription lenses', description: 'No vision correction needed' },
  { id: 'whatsapp', label: "I'll send it later via WhatsApp", description: 'We\'ll message you after order confirmation' },
];

// ─── Step Indicator ────────────────────────────────────────────────────────────
interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { num: 1 as const, label: 'Customer Details' },
  { num: 2 as const, label: 'Delivery & Prescription' },
  { num: 3 as const, label: 'Review & Pay' },
];

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full mb-8 md:mb-10">
      {STEPS.map((step, idx) => {
        const isDone    = step.num < currentStep;
        const isActive  = step.num === currentStep;
        const isUpcoming = step.num > currentStep;

        return (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              {/* Circle */}
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
              {/* Label */}
              <span
                className={[
                  'text-[11px] font-medium text-center leading-tight max-w-[72px] hidden sm:block',
                  isActive ? 'text-brand-700' : isDone ? 'text-brand-600' : 'text-neutral-400',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
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

// ─── Form State ────────────────────────────────────────────────────────────────
interface CustomerDetails {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

interface DeliveryDetails {
  method: DeliveryMethod;
  prescriptionOption: PrescriptionOption;
  prescriptionFile: File | null;
  notes: string;
}

type FieldErrors<T> = Partial<Record<keyof T, string>>;

// ─── Validation Helpers ────────────────────────────────────────────────────────
function validateCustomer(data: CustomerDetails): FieldErrors<CustomerDetails> {
  const errors: FieldErrors<CustomerDetails> = {};
  if (!data.email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Enter a valid email.';
  if (!data.fullName.trim()) errors.fullName = 'Full name is required.';
  if (!data.phone.trim()) errors.phone = 'Phone number is required.';
  else if (!/^(\+?234|0)[7-9][0-1]\d{8}$/.test(data.phone.replace(/\s/g, '')))
    errors.phone = 'Enter a valid Nigerian phone number (e.g. 0812 345 6789).';
  if (!data.address.trim()) errors.address = 'Delivery address is required.';
  if (!data.city.trim()) errors.city = 'City is required.';
  if (!data.state) errors.state = 'Please select a state.';
  return errors;
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, subtotal } = useCart();

  const [step, setStep]     = useState<1 | 2 | 3>(1);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Step 1 state
  const [customer, setCustomer] = useState<CustomerDetails>({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });
  const [customerErrors, setCustomerErrors] = useState<FieldErrors<CustomerDetails>>({});

  // Step 2 state
  const [delivery, setDelivery] = useState<DeliveryDetails>({
    method: 'door',
    prescriptionOption: 'whatsapp',
    prescriptionFile: null,
    notes: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Derived values
  const hasPrescriptionItems = items.some((i) => i.prescriptionRequired);
  const deliveryFee = delivery.method === 'pickup' ? 0 : (subtotal >= 50000 ? 0 : 2500);
  const total = subtotal + deliveryFee;

  // ── Empty cart guard ────────────────────────────────────────────────────────
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

  // ── Step 1 handlers ─────────────────────────────────────────────────────────
  // Uses SyntheticEvent with a wide element type to satisfy both Input's
  // HTMLInputElement|HTMLTextAreaElement onChange and the native <select> onChange.
  const handleCustomerChange =
    (field: keyof CustomerDetails) =>
    (e: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = (e.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
      setCustomer((prev) => ({ ...prev, [field]: value }));
      // Clear field error on change
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

  // ── Step 2 handlers ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) { setDelivery((prev) => ({ ...prev, prescriptionFile: null })); return; }
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

  // ── Step 3: Pay ─────────────────────────────────────────────────────────────
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
          metadata,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error || 'Could not initialize payment.');
      }

      const data = await res.json() as { authorizationUrl: string; reference: string };

      // Save reference to sessionStorage so callback page can display it
      sessionStorage.setItem('mcdaves_pending_ref', data.reference);
      sessionStorage.setItem('mcdaves_pending_total', String(total));

      // Redirect to Paystack hosted checkout
      window.location.href = data.authorizationUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment error. Please try again.';
      setPayError(msg);
      setPaying(false);
    }
  }, [customer, delivery, hasPrescriptionItems, items, total]);

  // ─── Render ─────────────────────────────────────────────────────────────────
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

        {/* ── STEP 1: Customer Details ─────────────────────────────────── */}
        {step === 1 && (
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
                onChange={handleCustomerChange('email')}
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
                onChange={handleCustomerChange('fullName')}
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
                onChange={handleCustomerChange('phone')}
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
                onChange={handleCustomerChange('address')}
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
                  onChange={handleCustomerChange('city')}
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
                      onChange={handleCustomerChange('state')}
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
                  onClick={handleStep1Continue}
                  trailingIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Continue to Delivery
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ── STEP 2: Delivery & Prescription ─────────────────────────── */}
        {step === 2 && (
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
                        onChange={() => setDelivery((prev) => ({ ...prev, method: opt.id }))}
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
                              opt.fee === 0 ? 'text-brand-700' : 'text-neutral-700',
                            ].join(' ')}
                          >
                            {opt.fee === 0 ? 'Free' : `+₦${opt.fee.toLocaleString()}`}
                          </span>
                        </div>
                        <p className="text-caption text-neutral-500 mt-1">
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  ))}

                  {/* Free delivery banner */}
                  {delivery.method === 'door' && subtotal >= 50000 && (
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
                            setDelivery((prev) => ({ ...prev, prescriptionOption: opt.id, prescriptionFile: null }));
                            setFileError(null);
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
                                ref={fileInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                className="sr-only"
                                onChange={handleFileChange}
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
                  onChange={(e) => setDelivery((prev) => ({ ...prev, notes: (e.target as HTMLTextAreaElement).value }))}
                />
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <Button
                  id="checkout-back-step2"
                  variant="secondary"
                  size="lg"
                  onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  leadingIcon={<ChevronLeft className="w-4 h-4" />}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  id="checkout-continue-step2"
                  variant="primary"
                  size="lg"
                  onClick={handleStep2Continue}
                  trailingIcon={<ChevronRight className="w-4 h-4" />}
                  className="flex-1"
                >
                  Continue to Review
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ── STEP 3: Review & Pay ─────────────────────────────────────── */}
        {step === 3 && (
          <section
            className="space-y-4"
            aria-labelledby="step3-heading"
          >
            {/* Order Summary card */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/60">
                <h2 id="step3-heading" className="text-h4 font-semibold text-neutral-900">
                  Order Summary
                </h2>
              </div>

              <ul className="divide-y divide-neutral-100 px-6">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.color ?? 'default'}`}
                    className="py-4 flex gap-4"
                  >
                    {/* Image */}
                    <div className="relative w-16 h-16 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="font-semibold text-body-sm text-neutral-900 truncate">
                        {item.name}
                      </p>
                      {item.color && (
                        <p className="text-caption text-neutral-500">Color: {item.color}</p>
                      )}
                      <p className="text-caption text-neutral-500">Qty: {item.quantity}</p>
                    </div>

                    {/* Price */}
                    <div className="flex-shrink-0 flex items-center">
                      <Price amount={item.price * item.quantity} size="sm" />
                    </div>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="border-t border-neutral-100 bg-neutral-50/60 px-6 py-5 space-y-2.5">
                <div className="flex justify-between text-body-sm text-neutral-600">
                  <span>Subtotal</span>
                  <Price amount={subtotal} size="sm" />
                </div>
                <div className="flex justify-between text-body-sm text-neutral-600">
                  <span>Delivery</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="font-semibold text-brand-700">Free</span>
                    ) : (
                      <Price amount={deliveryFee} size="sm" />
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-body font-semibold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <Price amount={total} size="md" />
                </div>
              </div>
            </div>

            {/* Delivery & Contact recap */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm px-6 py-5 space-y-3">
              <h3 className="text-caption font-semibold text-neutral-700 uppercase tracking-wide">
                Delivery Details
              </h3>
              <div className="text-body-sm text-neutral-700 space-y-1">
                <p><span className="font-medium">Name:</span> {customer.fullName}</p>
                <p><span className="font-medium">Email:</span> {customer.email}</p>
                <p><span className="font-medium">Phone:</span> {customer.phone}</p>
                <p>
                  <span className="font-medium">Address:</span>{' '}
                  {customer.address}, {customer.city}, {customer.state}
                </p>
                <p>
                  <span className="font-medium">Method:</span>{' '}
                  {delivery.method === 'door' ? 'Door Delivery' : 'Pickup in Lagos'}
                </p>
              </div>
            </div>

            {/* Error message */}
            {payError && (
              <div
                role="alert"
                className="flex items-start gap-3 bg-red-50 border border-accent-rose/30 rounded-lg px-4 py-3 text-body-sm text-accent-rose"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p>{payError}</p>
              </div>
            )}

            {/* Pay CTA */}
            <Button
              id="checkout-pay-btn"
              variant="primary"
              size="lg"
              fullWidth
              loading={paying}
              onClick={handlePay}
              leadingIcon={!paying ? <Lock className="w-4 h-4" /> : undefined}
            >
              {paying
                ? 'Redirecting to Paystack…'
                : `Pay ₦${total.toLocaleString()} with Paystack`}
            </Button>

            {/* Trust micro-copy */}
            <div className="flex items-center justify-center gap-2 text-caption text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" aria-hidden="true" />
              <span>Secured by Paystack. Your payment is encrypted.</span>
            </div>

            {/* Back button */}
            <div className="flex justify-center pt-1">
              <Button
                id="checkout-back-step3"
                variant="tertiary"
                size="sm"
                onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                leadingIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Back to Delivery
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
