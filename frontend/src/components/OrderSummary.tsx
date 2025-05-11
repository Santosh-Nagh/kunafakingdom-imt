// frontend/src/components/OrderSummary.tsx

import React from 'react'; // React is a value import
import { useOrder } from '../contexts/OrderContext';
// OrderItemState and AppliedChargeState are used only as types
import type { OrderItemState, AppliedChargeState } from '../types/domain'; 

export const OrderSummary: React.FC = () => {
  const { 
    state, 
    dispatch,
    subtotal,
    appliedChargesTaxableTotal,
    appliedChargesNonTaxableTotal,
    taxableTotal,
    cgst,
    sgst,
    grandTotal
  } = useOrder();

  const handleIncrementQuantity = (variantId: string) => {
    const item = state.items.get(variantId);
    if (item) {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { variantId, quantity: item.quantity + 1 } });
    }
  };

  const handleDecrementQuantity = (variantId: string) => {
    const item = state.items.get(variantId);
    if (item) {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { variantId, quantity: item.quantity - 1 } });
    }
  };

  const handleRemoveItem = (variantId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { variantId } });
  };

  const orderItemsArray = Array.from(state.items.values());
  const appliedChargesArray = Array.from(state.appliedCharges.values());

  const qtyButtonClasses = "px-2.5 py-1 border border-gray-300 bg-gray-100 hover:bg-gray-200 text-brand-text-on-light rounded-md transition-colors text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-brand-yellow";
  const removeButtonClasses = 
    "px-2.5 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 " +
    "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 transition-colors";

  if (orderItemsArray.length === 0 && appliedChargesArray.length === 0) {
    return (
      <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg h-full">
        <h2 className="text-xl font-bold mb-3 text-brand-green">Order Summary</h2>
        <p className="text-brand-text-on-light">Your order is empty. Add items from the menu.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-brand-green border-b border-gray-200 pb-2">
        Order Summary
      </h2>
      
      {orderItemsArray.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-semibold text-brand-text-on-light mb-2">Items:</h3>
          <ul className="space-y-2">
            {orderItemsArray.map((item: OrderItemState) => ( // item typed as OrderItemState
              <li key={item.variantId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-grow pr-2">
                  <p className="font-medium text-brand-text-on-light">{item.productName}</p>
                  <p className="text-sm text-gray-500">{item.variantName} (₹{item.unit_price.toFixed(2)})</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button 
                    onClick={() => handleDecrementQuantity(item.variantId)}
                    className={`${qtyButtonClasses} ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`} // Disable if qty is 1, as next is remove
                    disabled={item.quantity <= 1 && item.quantity !==0 } // Or just handle in reducer
                    aria-label={`Decrease quantity of ${item.variantName}`}
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-brand-text-on-light font-medium tabular-nums">
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => handleIncrementQuantity(item.variantId)}
                    className={qtyButtonClasses}
                    aria-label={`Increase quantity of ${item.variantName}`}
                  >
                    +
                  </button>
                  <span className="w-20 text-right text-brand-text-on-light font-medium">₹{item.total_price.toFixed(2)}</span>
                  <button 
                    onClick={() => handleRemoveItem(item.variantId)}
                    className={removeButtonClasses}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {appliedChargesArray.length > 0 && (
        <div className="mb-4 pt-2 border-t border-gray-100">
          <h3 className="text-md font-semibold text-brand-text-on-light mt-2 mb-1">Additional Charges:</h3>
          {appliedChargesArray.map((charge: AppliedChargeState) => ( // charge typed as AppliedChargeState
            <div key={charge.chargeId} className="flex justify-between text-sm text-brand-text-on-light py-0.5">
              <span>{charge.name}</span>
              <span className="font-medium">₹{charge.amount_charged.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 space-y-1.5 text-sm">
        {/* ... Totals section ... */}
        <div className="flex justify-between text-brand-text-on-light">
          <span>Subtotal (Items):</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        {appliedChargesTaxableTotal > 0 && (
             <div className="flex justify-between text-brand-text-on-light">
                <span>(+) Taxable Charges:</span>
                <span className="font-medium">₹{appliedChargesTaxableTotal.toFixed(2)}</span>
            </div>
        )}
        <div className="flex justify-between text-brand-text-on-light font-semibold">
          <span>Taxable Amount:</span>
          <span className="font-medium">₹{taxableTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-brand-text-on-light">
          <span>CGST (9%):</span>
          <span className="font-medium">₹{cgst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-brand-text-on-light">
          <span>SGST (9%):</span>
          <span className="font-medium">₹{sgst.toFixed(2)}</span>
        </div>
        {appliedChargesNonTaxableTotal > 0 && (
             <div className="flex justify-between text-brand-text-on-light">
                <span>(+) Non-Taxable Charges:</span>
                <span className="font-medium">₹{appliedChargesNonTaxableTotal.toFixed(2)}</span>
            </div>
        )}
        <div className="flex justify-between text-2xl font-bold text-brand-green mt-3 pt-2 border-t border-dashed border-gray-300">
          <span>Grand Total:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};