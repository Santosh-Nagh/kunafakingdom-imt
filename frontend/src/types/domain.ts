// frontend/src/types/domain.ts

// --- Enums ---
// These are used as values, so they are standard exports.
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

// --- Interfaces for Domain Models ---
// These will often be imported as `import type` unless used for `instanceof` checks (rarely for interfaces).

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
  // products?: Product[]; // Relations usually handled by specific fetch types
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Small", "Large"
  price: number;
  sku?: string | null;
  productId: string;
  product?: Product; // For potential nesting
  // inventoryTrackingMethod: string; // Assuming this comes from backend correctly, map to enum if needed
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

// Type for products fetched with their full relations for display
export type ProductWithRelations = Product & {
  category: Category; // Assuming category is always included for product display
  // variants are already part of Product type
};

export interface Charge {
  id: string;
  name: string;
  amount: number;
  is_taxable: boolean;
}

// For frontend state management (OrderContext)
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

// For full order details (e.g., from API response, for invoice)
export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  orderId: string;
  variantId: string;
  variant?: ProductVariant & { product?: Product }; // Nested details for display
}

export interface OrderAppliedCharge {
  id: string;
  amount_charged: number;
  orderId: string;
  chargeId: string;
  charge?: Charge; // Nested details for display
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
  payment_method: PaymentMethod; // Enum
  amount_received?: number | null;
  change_given?: number | null;
  payment_status: OrderPaymentStatus; // Enum
  order_status: OrderProcessStatus; // Enum
  notes?: string | null;
  created_at: string; // Typically string from JSON
  updated_at: string; // Typically string from JSON
  store?: Store;
  items?: OrderItem[];
  applied_charges?: OrderAppliedCharge[];
}