// frontend/src/components/ChargesInput.tsx

import React, { useState, useEffect } from 'react';
import { useOrder } from '../contexts/OrderContext';
import { getCharges } from '../services/api';
import { Charge } from '../types/domain';

export const ChargesInput: React.FC = () => {
  const { state, dispatch } = useOrder();
  const { appliedCharges } = state;

  const [availableCharges, setAvailableCharges] = useState<Charge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharges = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCharges = await getCharges();
        setAvailableCharges(fetchedCharges);
      } catch (err) { // <<< --- CORRECTED BLOCK START
        console.error("Failed to fetch charges:", err);
        setError(err instanceof Error ? err.message : 'Failed to load charges.');
      } finally { // <<< --- CORRECTED BLOCK END
        setIsLoading(false);
      }
    };

    fetchCharges();
  }, []);

  const handleChargeToggle = (charge: Charge, isChecked: boolean) => {
    if (isChecked) {
      dispatch({ type: 'APPLY_CHARGE', payload: charge });
    } else {
      dispatch({ type: 'REMOVE_CHARGE', payload: { chargeId: charge.id } });
    }
  };

  return (
    // Card styling consistent with other components
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-brand-green">
        Apply Additional Charges
      </h3>
      {isLoading && <p className="text-gray-500 py-2">Loading charges...</p>}
      {error && <p className="text-red-600 py-2">Error: {error}</p>}
      
      {!isLoading && !error && availableCharges.length > 0 && (
        <div className="space-y-3">
          {availableCharges.map((charge) => (
            <div key={charge.id} className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
              <input
                id={`charge-${charge.id}`}
                name={charge.name}
                type="checkbox"
                checked={appliedCharges.has(charge.id)}
                onChange={(e) => handleChargeToggle(charge, e.target.checked)}
                className="h-4 w-4 text-brand-yellow border-gray-300 rounded focus:ring-brand-yellow focus:ring-2 focus:ring-offset-1"
              />
              <label htmlFor={`charge-${charge.id}`} className="ml-3 block text-sm text-brand-text-on-light flex-grow">
                {charge.name} 
                <span className="text-xs text-gray-500 ml-1">(₹{charge.amount.toFixed(2)})</span>
              </label>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                  charge.is_taxable 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {charge.is_taxable ? "Taxable" : "Non-Taxable"}
              </span>
            </div>
          ))}
        </div>
      )}
      {!isLoading && !error && availableCharges.length === 0 && (
        <p className="text-sm text-gray-500 py-2">No additional charges available.</p>
      )}
    </div>
  );
};