// frontend/src/services/api.ts

// Import types using 'import type' where they are only used for type annotations
import type { Store, Charge, ProductWithRelations } from '../types/domain';
import type { CreateOrderPayload, CreatedOrderResponse } from '../types/api';

// Base URL of your backend API
const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3001/api' // For local development
  : '/api';                     // For Vercel deployment

/**
 * Helper function to handle fetch responses and errors.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignore if response body is not JSON
    }
    const errorMessage = errorData?.error || errorData?.message || response.statusText;
    const error = new Error(`API Error (${response.status}): ${errorMessage}`);
    console.error('API Error Details:', errorData);
    throw error;
  }
  if (response.status === 204) {
      return undefined as T; 
  }
  return response.json() as Promise<T>;
}

/**
 * Fetches the list of stores (branches) from the backend.
 */
export const getStores = async (): Promise<Store[]> => {
  const response = await fetch(`${API_BASE_URL}/stores`);
  return handleResponse<Store[]>(response);
};

/**
 * Fetches the list of active products, including their variants and categories.
 */
export const getProducts = async (): Promise<ProductWithRelations[]> => {
  const response = await fetch(`${API_BASE_URL}/products`);
  return handleResponse<ProductWithRelations[]>(response);
};

/**
 * Fetches the list of available charges from the backend.
 */
export const getCharges = async (): Promise<Charge[]> => {
    const response = await fetch(`${API_BASE_URL}/charges`);
    return handleResponse<Charge[]>(response);
};

/**
 * Sends the details of a new order to the backend to be created.
 */
export const createOrder = async (orderPayload: CreateOrderPayload): Promise<CreatedOrderResponse> => {
  console.log('Sending order payload to:', `${API_BASE_URL}/orders`, JSON.stringify(orderPayload, null, 2));
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });
  return handleResponse<CreatedOrderResponse>(response);
};