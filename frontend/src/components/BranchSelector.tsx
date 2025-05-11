// frontend/src/components/BranchSelector.tsx

import React, { useState, useEffect } from 'react';
import { useOrder } from '../contexts/OrderContext';
import { getStores } from '../services/api';
import { Store } from '../types/domain';

export const BranchSelector: React.FC = () => {
  const { state, dispatch } = useOrder();
  const { selectedStore } = state;

  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedStores = await getStores();
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
    const store = stores.find(s => s.id === storeId) || null;
    dispatch({ type: 'SELECT_STORE', payload: store });
  };

  // Define base classes for reuse
  const cardBaseClasses = "p-4 md:p-6 bg-white rounded-lg shadow-lg"; // White card on cream background
  const labelClasses = "block text-sm font-medium text-brand-green mb-1"; // Dark green label
  const selectClasses = 
    "mt-1 block w-full pl-3 pr-10 py-2 text-brand-text-on-light border-gray-300 rounded-md " +
    "focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow " + 
    "sm:text-sm bg-white"; // Select with yellow focus

  return (
    <div className={cardBaseClasses}>
      <label htmlFor="branch-select" className={labelClasses}>
        Select Branch:
      </label>
      {isLoading && <p className="text-gray-500 py-2">Loading branches...</p>}
      {error && <p className="text-red-600 py-2">Error: {error}</p>}
      {!isLoading && !error && (
        <div className="relative"> {/* Relative container for custom arrow if added later */}
          <select
            id="branch-select"
            value={selectedStore?.id ?? ''}
            onChange={handleStoreSelect}
            className={selectClasses}
            disabled={stores.length === 0}
          >
            <option value="" disabled>-- Select a Branch --</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id} className="text-brand-text-on-light">
                {store.name}
              </option>
            ))}
          </select>
          {/* Placeholder for custom arrow styling if needed later
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div> 
          */}
        </div>
      )}
      {selectedStore && (
         <p className="mt-2 text-xs text-brand-green">Selected: <span className="font-semibold">{selectedStore.name}</span></p>
       )}
    </div>
  );
};