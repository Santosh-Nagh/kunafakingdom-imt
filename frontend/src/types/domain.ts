export enum PaymentMethod {
  Cash = 'Cash',
  Card = 'Card',
  UPI = 'UPI',
  Swiggy = 'Swiggy',
  Zomato = 'Zomato',
  Other = 'Other',
}

export enum OrderPaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Failed = 'Failed',
  Refunded = 'Refunded',
}

export enum OrderProcessStatus {
  Received = 'Received',
  Preparing = 'Preparing',
  ReadyForPickup = 'ReadyForPickup',
  OutForDelivery = 'OutForDelivery',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface Store {
  id: string;
  name: string;
  address?: string | null;
  phone_number?: string | null;
  gstin?: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  sku?: string | null;
  productId: string;
  product?: Product;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  categoryId: string;
  category?: Category;
  variants: ProductVariant[];
}

export type ProductWithRelations = Product & {
  category: Category;
};

export interface Charge {
  id: string;
  name: string;
  amount: number;
  is_taxable: boolean;
}

export interface OrderItemState {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AppliedChargeState {
  chargeId: string;
  name: string;
  amount_charged: number;
  is_taxable: boolean;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  orderId: string;
  variantId: string;
  variant?: ProductVariant & { product?: Product };
}

export interface OrderAppliedCharge {
  id: string;
  amount_charged: number;
  orderId: string;
  chargeId: string;
  charge?: Charge;
}

export interface Order {
  id: string;
  storeId: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  aggregator_id?: string | null;
  subtotal: number;
  applied_charges_amount_taxable: number;
  applied_charges_amount_nontaxable: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_received?: number | null;
  change_given?: number | null;
  payment_status: OrderPaymentStatus;
  order_status: OrderProcessStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  store?: Store;
  items?: OrderItem[];
  applied_charges?: OrderAppliedCharge[];
}
