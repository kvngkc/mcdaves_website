// src/lib/commerce/customer-orders.ts
/**
 * Customer-scoped order queries (repository layer).
 *
 * Orders are resolved through the customer's Supabase auth linkage
 * (customers.auth_user_id), NOT by matching the customer's email. Email
 * matching is spoofable — a user can sign up with someone else's email and
 * read their orders — and breaks when a customer changes their email.
 */

import 'server-only';

import { supabase, mapRowToOrder } from '@/lib/supabase/service';
import type { Order } from './types';

/**
 * Returns the orders belonging to the customer linked to `authUserId`.
 * Returns [] when no customer is linked (fail closed).
 */
export async function getOrdersByCustomerAuthUserId(
  authUserId: string,
): Promise<Order[]> {
  if (!supabase) throw new Error('Supabase client missing');

  // 1. Resolve the customer(s) linked to this Supabase auth user.
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', authUserId);

  if (custError || !customers || customers.length === 0) return [];

  const customerIds = customers.map((c) => c.id);

  // 2. Return their orders, newest first.
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .in('customer_id', customerIds)
    .order('created_at', { ascending: false });

  if (orderError || !orders) return [];

  return orders.map(mapRowToOrder);
}
