// src/app/checkout/components/types.ts
import { businessIdentity, deliveryConfig } from '@/config';

// ─── Nigerian States ───────────────────────────────────────────────────────────
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'Federal Capital Territory', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
] as const;

// ─── Delivery Methods ──────────────────────────────────────────────────────────
export type DeliveryMethod = 'door' | 'pickup';

export const DELIVERY_OPTIONS: { id: DeliveryMethod; label: string; description: string; fee: number }[] = [
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
export type PrescriptionOption = 'upload' | 'plano' | 'whatsapp';

export const PRESCRIPTION_OPTIONS: { id: PrescriptionOption; label: string; description: string }[] = [
  { id: 'upload',   label: 'I have a prescription', description: 'Upload JPG, PNG or PDF (max 5 MB)' },
  { id: 'plano',    label: 'Plano / non-prescription lenses', description: 'No vision correction needed' },
  { id: 'whatsapp', label: "I'll send it later via WhatsApp", description: 'We\'ll message you after order confirmation' },
];

// ─── Form State ────────────────────────────────────────────────────────────────
export interface CustomerDetails {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

export interface DeliveryDetails {
  method: DeliveryMethod;
  prescriptionOption: PrescriptionOption;
  prescriptionFile: File | null;
  notes: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

// ─── Validation Helpers ────────────────────────────────────────────────────────
export function validateCustomer(data: CustomerDetails): FieldErrors<CustomerDetails> {
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
