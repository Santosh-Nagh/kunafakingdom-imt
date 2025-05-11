import { PaymentMethod } from './domain';
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
  payment_method: PaymentMethod;
  amount_received?: number;
  notes?: string;
  items: ApiOrderItemPayload[];
  applied_charges?: ApiAppliedChargePayload[];
}

export type CreatedOrderResponse = Order & {
  items: (OrderItem & {
    variant: ProductVariant & { product: Product; };
  })[];
  applied_charges: (OrderAppliedCharge & {
    charge: Charge;
  })[];
  store: Store;
};

export type { OrderItem, OrderAppliedCharge };
