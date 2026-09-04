import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commerceRepository } from './repository';
import { supabase } from '../supabase/service';

vi.mock('../supabase/service', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })),
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      })),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null })
    },
    mapRowToProduct: vi.fn((row) => ({ ...row })),
    mapProductToRow: vi.fn((product) => ({ ...product })),
    mapRowToVariant: vi.fn((row) => ({ ...row })),
    mapVariantToRow: vi.fn((variant) => ({ ...variant })),
    mapRowToMedia: vi.fn((row) => ({ ...row })),
    mapMediaToRow: vi.fn((media) => ({ ...media })),
    mapRowToCustomer: vi.fn((row) => ({ ...row })),
    mapCustomerToRow: vi.fn((customer) => ({ ...customer })),
    mapRowToOrderIntent: vi.fn((row) => ({ ...row })),
    mapOrderIntentToRow: vi.fn((intent) => ({ ...intent })),
    mapRowToOrder: vi.fn((row) => ({ ...row })),
    mapOrderToRow: vi.fn((order) => ({ ...order })),
    mapRowToPayment: vi.fn((row) => ({ ...row })),
    mapPaymentToRow: vi.fn((payment) => ({ ...payment })),
    mapRowToLensRequest: vi.fn((row) => ({ ...row })),
    mapLensRequestToRow: vi.fn((request) => ({ ...request }))
  };
});

describe('CommerceRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Customers', () => {
    it('should find a customer by id', async () => {
      const mockCustomer = { id: 'test-id', phone: '1234567890', name: 'Test User' };
      
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockCustomer, error: null });
      
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock,
      } as any));

      const customer = await commerceRepository.getCustomerById('test-id');

      expect(supabase.from).toHaveBeenCalledWith('customers');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('id', 'test-id');
      expect(customer).toEqual(mockCustomer);
    });

    it('should return null if customer not found by id', async () => {
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
      
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock,
      } as any));

      const customer = await commerceRepository.getCustomerById('test-id');

      expect(customer).toBeNull();
    });
  });

  describe('Payments & Atomicity', () => {
    it('should invoke process_confirmed_payment RPC and return success', async () => {
      const mockResult = {
        payment_id: 'pay-123',
        order_id: 'ord-123',
        status: 'SUCCESS',
        success: true,
        message: 'Success'
      };

      vi.mocked(supabase.rpc).mockResolvedValue({ data: [mockResult], error: null } as any);

      const result = await commerceRepository.processConfirmedPayment({
        paymentReference: 'test-ref',
        amount: 1000,
        currency: 'NGN',
        channel: 'card',
        gatewayResponse: { status: 'Approved' },
        customerId: 'cust-123',
        items: [{ variantId: 'var-1', quantity: 2 }],
        subtotal: 1000,
        shippingFee: 0,
        totalAmount: 1000
      });

      expect(supabase.rpc).toHaveBeenCalledWith('process_confirmed_payment', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
    });

    it('should handle RPC failure and return success: false', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('RPC Failed') } as any);

      await expect(commerceRepository.processConfirmedPayment({
        paymentReference: 'test-ref',
        amount: 1000,
        currency: 'NGN',
        channel: 'card',
        gatewayResponse: { status: 'Approved' },
        customerId: 'cust-123',
        items: [{ variantId: 'var-1', quantity: 2 }],
        subtotal: 1000,
        shippingFee: 0,
        totalAmount: 1000
      })).rejects.toThrow('Payment processing failed: RPC Failed');

      expect(supabase.rpc).toHaveBeenCalledWith('process_confirmed_payment', expect.any(Object));
    });
  });
});
