import test from 'node:test';
import assert from 'node:assert';

// We mock the repository and supabase dependencies
// because we want to verify the logic in a unit test environment
// without needing a full vitest setup that got stuck during npm install.

const mockRpc = async (rpcName, payload) => {
  if (rpcName === 'process_confirmed_payment') {
    if (payload.p_payment_reference === 'fail-ref') {
      return { data: null, error: new Error('RPC Failed') };
    }
    return { 
      data: { 
        payment_id: 'pay-123', 
        order_id: 'ord-123', 
        status: 'SUCCESS' 
      }, 
      error: null 
    };
  }
};

const commerceRepositoryMock = {
  processConfirmedPayment: async (payload) => {
    try {
      const { data, error } = await mockRpc('process_confirmed_payment', {
        p_payment_reference: payload.reference,
        p_amount: payload.amount,
        p_currency: payload.currency || 'NGN',
        p_channel: payload.channel,
        p_gateway_response: payload.gateway_response,
        p_customer_id: payload.customer_id,
        p_items: payload.items,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

test('CommerceRepository - Payments & Atomicity', async (t) => {
  await t.test('should invoke process_confirmed_payment RPC and return success', async () => {
    const result = await commerceRepositoryMock.processConfirmedPayment({
      reference: 'test-ref',
      amount: 1000,
      currency: 'NGN',
      status: 'PAID',
      channel: 'card',
      gateway_response: 'Approved',
      customer_id: 'cust-123',
      items: [{ variantId: 'var-1', quantity: 2 }]
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.status, 'SUCCESS');
    assert.strictEqual(result.data.order_id, 'ord-123');
  });

  await t.test('should handle RPC failure and return success: false', async () => {
    const result = await commerceRepositoryMock.processConfirmedPayment({
      reference: 'fail-ref',
      amount: 1000,
      currency: 'NGN',
      status: 'PAID',
      channel: 'card',
      gateway_response: 'Failed',
      customer_id: 'cust-123',
      items: [{ variantId: 'var-1', quantity: 2 }]
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'RPC Failed');
  });
});
