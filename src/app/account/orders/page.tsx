import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronRight, LogOut, Search } from 'lucide-react';
import { createAuthServerClient } from '@/lib/supabase/auth';
import { commerceRepository } from '@/lib/commerce/repository';
import { Price, Badge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CustomerOrdersPage() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/account/login');
  }

  // Look up customer by email to get customerId and fetch orders via repository
  const orders = await commerceRepository.getOrdersByCustomerEmail(user.email);

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Your Orders</h1>
            <p className="text-neutral-500 mt-1">Signed in as <span className="font-semibold text-neutral-900">{user.email}</span></p>
          </div>
          
          <form action="/api/auth/signout" method="POST">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-neutral-100 shadow-sm">
            <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No orders found</h3>
            <p className="text-neutral-500 text-sm max-w-sm mx-auto mb-6">
              You haven't placed any orders with this email address yet.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : [];
              const date = new Date(order.createdAt || (order as any).created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-neutral-50/50 px-6 py-4 border-b border-neutral-200/80 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Placed</span>
                        <span className="font-medium text-neutral-900">{date}</span>
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Total</span>
                        <Price amount={order.totalAmount || (order as any).total_amount} className="font-medium text-neutral-900" />
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <span className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Order #</span>
                      <span className="font-medium text-neutral-900 truncate max-w-[150px] inline-block">{order.id}</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-neutral-400" />
                          <Badge variant={order.status === 'CONFIRMED' ? 'success' : 'default'}>
                            {order.status}
                          </Badge>
                        </div>
                        <ul className="space-y-3">
                          {items.map((item: any, i: number) => (
                            <li key={i} className="flex items-center justify-between text-sm">
                              <span className="text-neutral-700 font-medium">{item.name}</span>
                              <span className="text-neutral-500">Qty: {item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
