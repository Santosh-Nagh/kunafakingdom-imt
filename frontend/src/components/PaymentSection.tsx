// frontend/src/components/PaymentSection.tsx

import React from 'react';
import { useOrder } from '../contexts/OrderContext';
import { PaymentMethod } from '../types/domain';

const paymentMethodOptions = Object.values(PaymentMethod);

// Define base classes for inputs for consistency (can be moved to a shared file later)
const inputBaseClasses = 
  "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm";
const normalBorderClasses = "border-gray-300 focus:ring-brand-yellow focus:border-brand-yellow";
// const errorBorderClasses = "border-red-500 focus:ring-red-500 focus:border-red-500"; // Not used here yet

export const PaymentSection: React.FC = () => {
  const { state, dispatch, grandTotal, changeDue } = useOrder();
  const { paymentMethod, cashAmountReceived } = state;

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    dispatch({ type: 'SELECT_PAYMENT_METHOD', payload: method });
  };

  const handleCashReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    inputValue = inputValue.replace(/[^0-9.]/g, '');
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    if (parts[1] && parts[1].length > 2) {
        inputValue = `${parts[0]}.${parts[1].substring(0, 2)}`;
    }

    if (inputValue === '' || inputValue === '.') {
      dispatch({ type: 'UPDATE_CASH_RECEIVED', payload: null });
    } else {
      const amount = parseFloat(inputValue);
      if (!isNaN(amount) && amount >= 0) {
        dispatch({ type: 'UPDATE_CASH_RECEIVED', payload: amount });
      }
    }
  };

  const getButtonClasses = (methodToCheck: PaymentMethod) => {
    const base = "w-full px-3 py-2.5 text-sm font-semibold rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out shadow-sm";
    if (paymentMethod === methodToCheck) {
      return `${base} bg-brand-yellow text-brand-green border-brand-yellow focus:ring-amber-400 hover:bg-yellow-400`; // Selected: Brand yellow
    }
    return `${base} bg-white text-brand-green border-gray-300 hover:bg-gray-100 focus:ring-brand-yellow`; // Not selected
  };

  return (
    // The card styling (bg-white, shadow, rounded) is applied by App.tsx's structure
    // This div just needs padding if App.tsx doesn't provide it for the section itself.
    // For now, assuming App.tsx handles the outer card structure.
    <div className="p-0"> {/* Remove padding if App.tsx <section> already has it */}
      <h3 className="text-xl font-bold mb-4 text-brand-green"> {/* Styled title */}
        Payment Method
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {paymentMethodOptions.map((methodOption) => (
          <button
            key={methodOption}
            type="button"
            onClick={() => handlePaymentMethodSelect(methodOption)}
            className={getButtonClasses(methodOption)}
          >
            {methodOption}
          </button>
        ))}
      </div>

      {paymentMethod === PaymentMethod.Cash && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div>
            <label htmlFor="cashAmountReceived" className="block text-sm font-medium text-brand-text-on-light mb-1">
              Amount Received (Cash)
            </label>
            <input
              type="text"
              inputMode="decimal"
              name="cashAmountReceived"
              id="cashAmountReceived"
              value={cashAmountReceived === null ? '' : cashAmountReceived.toString()}
              onChange={handleCashReceivedChange}
              onFocus={(e) => e.target.select()}
              placeholder={`Min. ₹${grandTotal.toFixed(2)}`}
              className={`${inputBaseClasses} ${normalBorderClasses}`}
            />
          </div>
          {typeof cashAmountReceived === 'number' && cashAmountReceived !== null && changeDue !== null && (
            <div className={`text-sm font-semibold p-2.5 rounded-md text-center ${changeDue < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-brand-green'}`}>
              {changeDue < 0 
                ? `Amount Short: ₹${Math.abs(changeDue).toFixed(2)}` 
                : `Change Due: ₹${changeDue.toFixed(2)}`}
            </div>
          )}
           {(typeof cashAmountReceived !== 'number' || cashAmountReceived === null) && grandTotal > 0 && paymentMethod === PaymentMethod.Cash &&(
            <p className="text-xs text-gray-500 mt-1">Enter amount received.</p>
          )}
        </div>
      )}

       {paymentMethod && paymentMethod !== PaymentMethod.Cash && (
         <p className="mt-4 text-sm text-brand-text-on-light py-2 text-center bg-gray-50 rounded-md">
           Selected: <span className="font-semibold">{paymentMethod}</span>
         </p>
       )}
    </div>
  );
};