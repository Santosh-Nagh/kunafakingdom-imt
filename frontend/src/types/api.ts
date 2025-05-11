// frontend/src/types/api.ts
import { PaymentMethod } from './domain';

// Matches backend Zod Schema for POST /api/orders payload
export interface ApiOrderItemPayload {
  variantId: string;
  quantity: number;
  unit_price: number; // Send price used at time of adding to cart
}

export interface ApiAppliedChargePayload {
    chargeId: string;
    amount_charged: number;
}

export interface CreateOrderPayload {
  storeId: string;
  customer_name?: string;
  customer_phone?: string;
  aggregator_id?: string;
  payment_method: PaymentMethod;
  amount_received?: number;
  notes?: string;
  items: ApiOrderItemPayload[];
  applied_charges?: ApiAppliedChargePayload[];
}

// Define the expected response shape when an order is created or fetched
// (This might include nested relations based on your backend include statement)
// Example - adjust based on actual API response
export type CreatedOrderResponse = Order & {
    items: (OrderItem & {
        variant: ProductVariant & {
            product: Product;
        };
    })[];
    applied_charges: (OrderAppliedCharge & {
        charge: Charge;
    })[];
    store: Store;
};