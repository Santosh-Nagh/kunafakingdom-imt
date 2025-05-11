// frontend/src/types/domain.ts

// Enums (Match Prisma Enums)
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
  
  // Models (Simplified for Frontend Use initially)
  export interface Store {
    id: string;
    name: string;
    address?: string | null;
    phone_number?: string | null;
    gstin?: string | null;
    // created_at: Date; // Often not needed directly in frontend state
    // updated_at: Date;
  }
  
  export interface Category {
    id: string;
    name: string;
  }
  
  export interface ProductVariant {
    id: string;
    name: string; // e.g., "Small", "Large"
    price: number;
    sku?: string | null;
    productId: string;
    // We might add product details here if fetched together
    product?: Product; // If included in API response
  }
  
  export interface Product {
    id: string;
    name: string;
    description?: string | null;
    image_url?: string | null;
    is_active: boolean;
    categoryId: string;
    category?: Category; // If included in API response
    variants: ProductVariant[]; // Always include variants based on API
  }
  
  export interface Charge {
      id: string;
      name: string;
      amount: number;
      is_taxable: boolean;
  }
  
  // Interface for an item within the frontend order state
  export interface OrderItemState {
      variantId: string;
      productId: string; // Helpful for grouping/display
      productName: string;
      variantName: string;
      quantity: number;
      unit_price: number;
      total_price: number;
  }
  
   // Interface for applied charges within the frontend order state
   export interface AppliedChargeState {
      chargeId: string;
      name: string; // Helpful for display
      amount_charged: number;
      is_taxable: boolean; // Important for calculation
  }
  
  // Add other types as needed (e.g., full Order details for invoice)
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
      created_at: string; // Prisma DateTime maps to string in JSON
      updated_at: string;
      store?: Store; // Include if needed from API response
      items?: OrderItem[]; // Type for actual OrderItem from DB needed
      applied_charges?: OrderAppliedCharge[]; // Type for actual AppliedCharge from DB needed
  }
  
  // These might differ slightly from OrderItemState if needed
  export interface OrderItem {
      id: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      orderId: string;
      variantId: string;
      variant?: ProductVariant; // Include if needed from API response
  }
  
  export interface OrderAppliedCharge {
      id: string;
      amount_charged: number;
      orderId: string;
      chargeId: string;
      charge?: Charge; // Include if needed from API response
  }