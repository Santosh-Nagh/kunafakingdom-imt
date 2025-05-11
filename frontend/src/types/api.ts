// frontend/src/types/api.ts

// Import enums that might be used as values in payloads
import { PaymentMethod } from './domain';

// Import types that are extended or used as part of API shapes
// These are type-only imports as they define structure, not runtime values from this file.
import type { 
    Order, 
    OrderItem, 
    ProductVariant, 
    Product, 
    OrderAppliedCharge, 
    Charge, 
    Store 
} from './domain';

export interface ApiOrderItemPayload {
  variantId: string;
  quantity: number;
  unit_price: number;
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
  payment_method: PaymentMethod; // Enum used as value
  amount_received?: number;
  notes?: string;
  items: ApiOrderItemPayload[];
  applied_charges?: ApiAppliedChargePayload[];
}

// Response from creating or fetching a full order
export type CreatedOrderResponse = Order & { // Extends base Order type
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