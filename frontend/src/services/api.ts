// frontend/src/services/api.ts

import { Store, Product, Charge, CreatedOrderResponse } from '../types/domain'; // Import types based on Prisma schema
import { CreateOrderPayload } from '../types/api'; // Import the specific payload type

// Base URL of your backend API
// Make sure your backend server (from backend/src/index.ts) is running on port 3001
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Helper function to handle fetch responses and errors.
 * It checks if the response was successful (status 200-299).
 * If yes, it parses and returns the JSON data.
 * If not, it throws an error with the status text.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Try to get error details from the response body
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignore if response body is not JSON
    }
    const errorMessage = errorData?.error || errorData?.message || response.statusText;
    const error = new Error(`API Error (${response.status}): ${errorMessage}`);
    console.error('API Error Details:', errorData); // Log details for debugging
    throw error;
  }
  // Handle cases where the response might be empty (e.g., 204 No Content)
  if (response.status === 204) {
      return undefined as T; // Or handle as appropriate for your API
  }
  return response.json() as Promise<T>;
}

/**
 * Fetches the list of stores (branches) from the backend.
 * Corresponds to: GET /api/stores
 */
export const getStores = async (): Promise<Store[]> => {
  const response = await fetch(`${API_BASE_URL}/stores`);
  return handleResponse<Store[]>(response);
};

/**
 * Fetches the list of active products, including their variants and categories.
 * Corresponds to: GET /api/products
 * Note: The backend currently fetches ALL active products.
 * We might later add filtering by storeId if products/inventory are store-specific.
 * We define a specific return type to include nested relations fetched by the backend.
 */
export type ProductWithRelations = Product & {
    category: Category;
    variants: ProductVariant[];
};
interface Category { id: string; name: string; } // Define nested types locally if not imported
interface ProductVariant { id: string; name: string; price: number; sku?: string | null; productId: string; }

export const getProducts = async (): Promise<ProductWithRelations[]> => {
  const response = await fetch(`${API_BASE_URL}/products`);
  // We need to explicitly type the expected return shape based on the backend `include`
  return handleResponse<ProductWithRelations[]>(response);
};


/**
 * Fetches the list of available charges from the backend.
 * Corresponds to: GET /api/charges
 */
export const getCharges = async (): Promise<Charge[]> => {
    const response = await fetch(`${API_BASE_URL}/charges`);
    return handleResponse<Charge[]>(response);
};


/**
 * Sends the details of a new order to the backend to be created.
 * Corresponds to: POST /api/orders
 * @param orderPayload - The order details matching the CreateOrderPayload type.
 * @returns The newly created order object, likely including nested details.
 */
export const createOrder = async (orderPayload: CreateOrderPayload): Promise<CreatedOrderResponse> => {
  console.log('Sending order payload:', JSON.stringify(orderPayload, null, 2)); // Log payload for debugging
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });
  // Use CreatedOrderResponse which expects nested relations based on backend include
  return handleResponse<CreatedOrderResponse>(response);
};