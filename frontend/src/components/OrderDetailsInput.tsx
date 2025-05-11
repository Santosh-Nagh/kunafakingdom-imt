// frontend/src/components/OrderDetailsInput.tsx

import React, { useState } from 'react';
import { useOrder } from '../contexts/OrderContext';

type DetailField = 'customerName' | 'customerPhone' | 'aggregatorId' | 'notes';

const MAX_CUSTOMER_NAME_LENGTH = 50;
const MAX_AGGREGATOR_ID_LENGTH = 50;
const MAX_NOTES_LENGTH = 200;

export const OrderDetailsInput: React.FC = () => {
  const { state, dispatch } = useOrder();
  
  const [nameError, setNameError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const validateCustomerName = (name: string): string => {
    const trimmedName = name.trim();
    if (name.length > 0 && trimmedName === '') { 
      return 'Name cannot be only spaces.';
    }
    if (trimmedName.length > MAX_CUSTOMER_NAME_LENGTH) {
      return `Name cannot exceed ${MAX_CUSTOMER_NAME_LENGTH} characters.`;
    }
    const onlyNumbersRegex = /^[0-9]+$/;
    if (trimmedName.length > 0 && onlyNumbersRegex.test(trimmedName)) {
      return 'Name cannot consist only of numbers.';
    }
    return ''; // No error
  };

  const handleInputChange = (field: DetailField, value: string) => {
    let processedValue = value;

    dispatch({ type: 'UPDATE_CUSTOMER_DETAIL', payload: { field, value } }); // Update context first

    if (field === 'customerName') {
      setNameError(validateCustomerName(value));
    } else if (field === 'customerPhone') {
      processedValue = value.replace(/[^0-9]/g, '');
      if (processedValue.length > 10) {
        processedValue = processedValue.substring(0, 10);
      }
      if (value !== processedValue) {
        dispatch({ type: 'UPDATE_CUSTOMER_DETAIL', payload: { field, value: processedValue } });
      }
      
      if (processedValue === '' || validatePhoneNumber(processedValue)) {
        setPhoneError('');
      } else {
        setPhoneError('Phone number must be 10 digits.');
      }
    } else if (field === 'aggregatorId') {
        if (value.length > MAX_AGGREGATOR_ID_LENGTH) {
            processedValue = value.substring(0, MAX_AGGREGATOR_ID_LENGTH);
            dispatch({ type: 'UPDATE_CUSTOMER_DETAIL', payload: { field, value: processedValue } });
        }
    } else if (field === 'notes') {
        if (value.length > MAX_NOTES_LENGTH) {
            processedValue = value.substring(0, MAX_NOTES_LENGTH);
            dispatch({ type: 'UPDATE_CUSTOMER_DETAIL', payload: { field, value: processedValue } });
        }
    }
  };

  // Define base classes for inputs for consistency
  const inputBaseClasses = 
    "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm";
  const normalBorderClasses = "border-gray-300 focus:ring-brand-yellow focus:border-brand-yellow";
  const errorBorderClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";


  return (
    // Card styling
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-brand-green"> {/* Styled title */}
        Optional Order Details
      </h3>
      <div className="space-y-4">
        {/* Customer Name */}
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-brand-text-on-light">
            Customer Name
          </label>
          <input
            type="text"
            name="customerName"
            id="customerName"
            value={state.customerName}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            maxLength={MAX_CUSTOMER_NAME_LENGTH + 5} 
            className={`${inputBaseClasses} ${nameError ? errorBorderClasses : normalBorderClasses}`}
          />
          {nameError && (
            <p className="mt-1 text-xs text-red-600">{nameError}</p>
          )}
        </div>

        {/* Customer Phone */}
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-brand-text-on-light">
            Customer Phone
          </label>
          <input
            type="tel"
            name="customerPhone"
            id="customerPhone"
            value={state.customerPhone}
            onChange={(e) => handleInputChange('customerPhone', e.target.value)}
            placeholder="10 digits"
            className={`${inputBaseClasses} ${phoneError ? errorBorderClasses : normalBorderClasses}`}
          />
          {phoneError && state.customerPhone !== '' && (
            <p className="mt-1 text-xs text-red-600">{phoneError}</p>
          )}
        </div>

        {/* Aggregator ID */}
        <div>
          <label htmlFor="aggregatorId" className="block text-sm font-medium text-brand-text-on-light">
            Aggregator ID (Swiggy/Zomato Order ID)
          </label>
          <input
            type="text"
            name="aggregatorId"
            id="aggregatorId"
            value={state.aggregatorId}
            onChange={(e) => handleInputChange('aggregatorId', e.target.value)}
            maxLength={MAX_AGGREGATOR_ID_LENGTH}
            className={`${inputBaseClasses} ${normalBorderClasses}`} // No specific error state for this one yet
          />
           {state.aggregatorId.length >= MAX_AGGREGATOR_ID_LENGTH && (
            <p className="mt-1 text-xs text-orange-500">Max length reached.</p>
          )}
        </div>

        {/* Order Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-brand-text-on-light">
            Order Notes
          </label>
          <textarea
            name="notes"
            id="notes"
            rows={3}
            value={state.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            maxLength={MAX_NOTES_LENGTH}
            className={`${inputBaseClasses} ${normalBorderClasses}`} // No specific error state for this one yet
          />
          {state.notes.length >= MAX_NOTES_LENGTH && (
            <p className="mt-1 text-xs text-orange-500">Max length reached.</p>
          )}
        </div>
      </div>
    </div>
  );
};