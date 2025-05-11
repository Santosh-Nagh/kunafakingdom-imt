// frontend/src/components/SubmitOrderButton.tsx

import React, { useState } from 'react';
import { useOrder } from '../contexts/OrderContext';
import { createOrder } from '../services/api';
import { PaymentMethod } from '../types/domain';
import { 
    ApiOrderItemPayload, 
    ApiAppliedChargePayload, 
    CreateOrderPayload, 
    CreatedOrderResponse 
} from '../types/api';
import { InvoiceModal } from './InvoiceModal';

export const SubmitOrderButton: React.FC = () => {
  const { state, dispatch, grandTotal } = useOrder();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<CreatedOrderResponse | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const canSubmitOrder = (): boolean => {
    if (!state.selectedStore || state.items.size === 0 || !state.paymentMethod) {
      return false;
    }
    if (state.paymentMethod === PaymentMethod.Cash) {
      if (state.cashAmountReceived === null || state.cashAmountReceived < grandTotal) {
        return false;
      }
      // Also check if change due is not negative (already handled by cashAmountReceived < grandTotal)
      // Or if change is too large (e.g. received 10000 for a 100 order - optional validation)
    }
    return true;
  };

  const handleCloseInvoiceAndReset = () => {
    setShowInvoiceModal(false);
    setConfirmedOrder(null);
    dispatch({ type: 'RESET_ORDER' });
  };

  const handleSubmitOrder = async () => {
    if (!canSubmitOrder() || !state.selectedStore || !state.paymentMethod) {
      setSubmitError("Order is not complete or valid for submission.");
      setTimeout(() => setSubmitError(null), 5000);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const orderItemsPayload: ApiOrderItemPayload[] = Array.from(state.items.values()).map(item => ({
      variantId: item.variantId,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const appliedChargesPayload: ApiAppliedChargePayload[] = Array.from(state.appliedCharges.values()).map(charge => ({
        chargeId: charge.chargeId,
        amount_charged: charge.amount_charged,
    }));

    const orderPayload: CreateOrderPayload = {
      storeId: state.selectedStore.id,
      customer_name: state.customerName || undefined,
      customer_phone: state.customerPhone || undefined,
      aggregator_id: state.aggregatorId || undefined,
      notes: state.notes || undefined,
      payment_method: state.paymentMethod,
      amount_received: state.paymentMethod === PaymentMethod.Cash ? state.cashAmountReceived ?? undefined : undefined,
      items: orderItemsPayload,
      applied_charges: appliedChargesPayload.length > 0 ? appliedChargesPayload : undefined,
    };

    try {
      const createdOrderData: CreatedOrderResponse = await createOrder(orderPayload);
      console.log('Order created:', createdOrderData);
      setConfirmedOrder(createdOrderData);
      setShowInvoiceModal(true);      
      
    } catch (err) {
      console.error('Failed to submit order:', err);
      const apiError = err as any; 
      let errorMessage = apiError instanceof Error ? apiError.message : 'An unknown error occurred.';
      
      if (apiError.details && Array.isArray(apiError.details)) {
          errorMessage = apiError.details.map((detail: any) => `${detail.path?.join('.') || 'Error'}: ${detail.message}`).join('; ');
      } else if (apiError.error) { 
          errorMessage = apiError.error;
      }
      setSubmitError(`Error: ${errorMessage}`);
      setTimeout(() => setSubmitError(null), 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = !canSubmitOrder() || isSubmitting;

  return (
    <>
      {/* Error message displayed above the button */}
      {submitError && (
        <p className="mb-3 text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{submitError}</p>
      )}
      
      <button
        type="button"
        onClick={handleSubmitOrder}
        disabled={isButtonDisabled}
        className={`w-full px-6 py-3.5 text-base font-semibold rounded-md shadow-md transition-all duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 
          ${isButtonDisabled
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-brand-green text-brand-yellow hover:bg-green-700 focus:ring-brand-yellow' 
            // Alternative: bg-brand-yellow text-brand-green hover:bg-yellow-400 focus:ring-yellow-300
          }`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Order'}
      </button>

      {showInvoiceModal && confirmedOrder && (
        <InvoiceModal 
          order={confirmedOrder} 
          onClose={handleCloseInvoiceAndReset} 
        />
      )}
    </>
  );
};