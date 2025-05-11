// frontend/src/services/api.ts

import type { Store, Charge, ProductWithRelations } from '../types/domain';
import type { CreateOrderPayload, CreatedOrderResponse } from '../types/api';

// Get the base URL from Vite's environment variables
// For local 'npm run dev' in frontend, set VITE_API_BASE_URL in 'frontend/.env.development' or 'frontend/.env.local'
// e.g., VITE_API_BASE_URL=http://localhost:3001/api
// For 'vercel dev' and Vercel deployments, if VITE_API_BASE_URL is not set, it defaults to '/api'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

console.log("API_BASE_URL set to:", API_BASE_URL); // For debugging

async function handleResponse<T>(response: Response): Promise<T> {
  // ... (keep existing handleResponse function exactly as it was)
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) { /* Ignore */ }
    const errorMessage = errorData?.error || errorData?.message || response.statusText;
    const error = new Error(`API Error (${response.status}): ${errorMessage}`);
    console.error('API Error Details:', errorData);
    throw error;
  }
  if (response.status === 204) { return undefined as T; }
  return response.json() as Promise<T>;
}

export const getStores = async (): Promise<Store[]> => {
  const response = await fetch(`${API_BASE_URL}/stores`);
  return handleResponse<Store[]>(response);
};

export const getProducts = async (): Promise<ProductWithRelations[]> => {
  const response = await fetch(`${API_BASE_URL}/products`);
  return handleResponse<ProductWithRelations[]>(response);
};

export const getCharges = async (): Promise<Charge[]> => {
    const response = await fetch(`${API_BASE_URL}/charges`);
    return handleResponse<Charge[]>(response);
};

export const createOrder = async (orderPayload: CreateOrderPayload): Promise<CreatedOrderResponse> => {
  console.log('Sending order payload to:', `${API_BASE_URL}/orders`, JSON.stringify(orderPayload, null, 2));
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', },
    body: JSON.stringify(orderPayload),
  });
  return handleResponse<CreatedOrderResponse>(response);
};