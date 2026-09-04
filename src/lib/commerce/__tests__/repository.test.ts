import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commerceRepository } from '../repository';
import { supabase } from '@/lib/supabase/service';

vi.mock('@/lib/supabase/service', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('commerceRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch orders by customer email', async () => {
    // Mock implementation for getOrdersByCustomerEmail
    const mockCustomers = [{ id: 'cust-123' }];
    const mockOrders = [{ id: 'order-123', total_amount: 100, created_at: new Date().toISOString() }];

    const mockEq = vi.fn().mockResolvedValue({ data: mockCustomers, error: null });
    const mockSelectCustomer = vi.fn().mockReturnValue({ eq: mockEq });

    const mockOrder = vi.fn().mockResolvedValue({ data: mockOrders, error: null });
    const mockIn = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelectOrder = vi.fn().mockReturnValue({ in: mockIn });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'customers') return { select: mockSelectCustomer };
      if (table === 'orders') return { select: mockSelectOrder };
      return { select: vi.fn() };
    });

    const result = await commerceRepository.getOrdersByCustomerEmail('test@example.com');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('order-123');
    expect(supabase.from).toHaveBeenCalledWith('customers');
    expect(supabase.from).toHaveBeenCalledWith('orders');
  });
});
