// frontend/src/components/BranchSelector.tsx

import React, { useState, useEffect } from 'react';
import { useOrder } from '../contexts/OrderContext';
import { getStores } from '../services/api';
import type { Store } from '../types/domain'; // Store is used only as a type here

export const BranchSelector: React.FC = () => {
  const { state, dispatch } = useOrder();
  const { selectedStore } = state;

  const [stores, setStores] = useState<Store[]>([]); // Store[] is a type annotation
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedStores: Store[] = await getStores(); // fetchedStores is typed as Store[]
        setStores(fetchedStores);
      } catch (err) {
        console.error("Failed to fetch stores:", err);
        setError(err instanceof Error ? err.message : 'Failed to load branches.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, []);

  const handleStoreSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const storeId = event.target.value;
    const store: Store | null = stores.find(s => s.id === storeId) || null; // store is typed as Store | null
    dispatch({ type: 'SELECT_STORE', payload: store });
  };

  const cardBaseClasses = "p-4 md:p-6 bg-white rounded-lg shadow-lg";
  const labelClasses = "block text-sm font-medium text-brand-green mb-1";
  const selectClasses = 
    "mt-1 block w-full pl-3 pr-10 py-2 text-brand-text-on-light border-gray-300 rounded-md " +
    "focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow " + 
    "sm:text-sm bg-white";

  return (
    <div className={cardBaseClasses}>
      <label htmlFor="branch-select" className={labelClasses}>
        Select Branch:
      </label>
      {isLoading && <p className="text-gray-500 py-2">Loading branches...</p>}
      {error && <p className="text-red-600 py-2">Error: {error}</p>}
      {!isLoading && !error && (
        <div className="relative">
          <select
            id="branch-select"
            value={selectedStore?.id ?? ''}
            onChange={handleStoreSelect}
            className={selectClasses}
            disabled={stores.length === 0}
          >
            <option value="" disabled>-- Select a Branch --</option>
            {stores.map((storeOption: Store) => ( // storeOption is typed as Store
              <option key={storeOption.id} value={storeOption.id} className="text-brand-text-on-light">
                {storeOption.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {selectedStore && (
         <p className="mt-2 text-xs text-brand-green">Selected: <span className="font-semibold">{selectedStore.name}</span></p>
       )}
    </div>
  );
};