// frontend/src/components/ChargesInput.tsx

import React, { useState, useEffect } from 'react';
import { useOrder } from '../contexts/OrderContext';
import { getCharges } from '../services/api';
import type { Charge } from '../types/domain'; // Charge is used only as a type here

export const ChargesInput: React.FC = () => {
  const { state, dispatch } = useOrder();
  const { appliedCharges } = state;

  const [availableCharges, setAvailableCharges] = useState<Charge[]>([]); // Charge[] type annotation
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharges = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCharges: Charge[] = await getCharges(); // fetchedCharges typed as Charge[]
        setAvailableCharges(fetchedCharges);
      } catch (err) {
        console.error("Failed to fetch charges:", err);
        setError(err instanceof Error ? err.message : 'Failed to load charges.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharges();
  }, []);

  const handleChargeToggle = (charge: Charge, isChecked: boolean) => { // charge parameter typed as Charge
    if (isChecked) {
      dispatch({ type: 'APPLY_CHARGE', payload: charge });
    } else {
      dispatch({ type: 'REMOVE_CHARGE', payload: { chargeId: charge.id } });
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-brand-green">
        Apply Additional Charges
      </h3>
      {isLoading && <p className="text-gray-500 py-2">Loading charges...</p>}
      {error && <p className="text-red-600 py-2">Error: {error}</p>}
      
      {!isLoading && !error && availableCharges.length > 0 && (
        <div className="space-y-3">
          {availableCharges.map((chargeOption: Charge) => ( // chargeOption typed as Charge
            <div key={chargeOption.id} className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
              <input
                id={`charge-${chargeOption.id}`}
                name={chargeOption.name}
                type="checkbox"
                checked={appliedCharges.has(chargeOption.id)}
                onChange={(e) => handleChargeToggle(chargeOption, e.target.checked)}
                className="h-4 w-4 text-brand-yellow border-gray-300 rounded focus:ring-brand-yellow focus:ring-2 focus:ring-offset-1"
              />
              <label htmlFor={`charge-${chargeOption.id}`} className="ml-3 block text-sm text-brand-text-on-light flex-grow">
                {chargeOption.name} 
                <span className="text-xs text-gray-500 ml-1">(₹{chargeOption.amount.toFixed(2)})</span>
              </label>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                  chargeOption.is_taxable 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {chargeOption.is_taxable ? "Taxable" : "Non-Taxable"}
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