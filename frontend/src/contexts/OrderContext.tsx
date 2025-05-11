// frontend/src/contexts/OrderContext.tsx

import React, { createContext, useReducer, useContext, useMemo, ReactNode } from 'react';
import {
    Store,
    Product, // Make sure Product is imported
    ProductVariant,
    Charge,
    PaymentMethod,
    OrderItemState,
    AppliedChargeState
} from '../types/domain'; // Import necessary types from domain.ts

// --- State Shape ---
interface OrderState {
    selectedStore: Store | null;
    items: Map<string, OrderItemState>; // Key is ProductVariant ID
    appliedCharges: Map<string, AppliedChargeState>; // Key is Charge ID
    customerName: string;
    customerPhone: string;
    aggregatorId: string;
    notes: string;
    paymentMethod: PaymentMethod | null;
    cashAmountReceived: number | null;
}

// --- Action Types ---
type Action =
    | { type: 'SELECT_STORE'; payload: Store | null }
    // MODIFIED: ADD_ITEM payload now includes both product and variant
    | { type: 'ADD_ITEM'; payload: { product: Product; variant: ProductVariant } }
    | { type: 'REMOVE_ITEM'; payload: { variantId: string } }
    | { type: 'UPDATE_QUANTITY'; payload: { variantId: string; quantity: number } }
    | { type: 'APPLY_CHARGE'; payload: Charge }
    | { type: 'REMOVE_CHARGE'; payload: { chargeId: string } }
    | { type: 'UPDATE_APPLIED_CHARGE_AMOUNT'; payload: { chargeId: string; amount: number } }
    | { type: 'UPDATE_CUSTOMER_DETAIL'; payload: { field: keyof OrderState; value: string } }
    | { type: 'SELECT_PAYMENT_METHOD'; payload: PaymentMethod | null }
    | { type: 'UPDATE_CASH_RECEIVED'; payload: number | null }
    | { type: 'RESET_ORDER' };

// --- Initial State ---
const initialState: OrderState = {
    selectedStore: null,
    items: new Map<string, OrderItemState>(),
    appliedCharges: new Map<string, AppliedChargeState>(),
    customerName: '',
    customerPhone: '',
    aggregatorId: '',
    notes: '',
    paymentMethod: null,
    cashAmountReceived: null,
};

// --- Reducer Function ---
// Handles state updates based on dispatched actions
const orderReducer = (state: OrderState, action: Action): OrderState => {
    switch (action.type) {
        case 'SELECT_STORE':
            // Reset order if store changes
            return { ...initialState, selectedStore: action.payload };

        case 'ADD_ITEM': {
            // Destructure product and variant from the updated payload
            const { product, variant } = action.payload;
            const existingItem = state.items.get(variant.id);
            const newItems = new Map(state.items);

            if (existingItem) {
                // Increment quantity if item already exists
                newItems.set(variant.id, {
                    ...existingItem,
                    quantity: existingItem.quantity + 1,
                    total_price: (existingItem.quantity + 1) * existingItem.unit_price,
                });
            } else {
                // Add new item with quantity 1
                // Use details from both product and variant
                newItems.set(variant.id, {
                    variantId: variant.id,
                    productId: product.id,      // Get productId from product
                    productName: product.name,  // Get productName from product
                    variantName: variant.name,  // Get variantName from variant
                    quantity: 1,
                    unit_price: variant.price,
                    total_price: variant.price * 1,
                });
            }
            return { ...state, items: newItems };
        }

        case 'REMOVE_ITEM': {
            const newItems = new Map(state.items);
            newItems.delete(action.payload.variantId);
            return { ...state, items: newItems };
        }

        case 'UPDATE_QUANTITY': {
            const { variantId, quantity } = action.payload;
            const existingItem = state.items.get(variantId);
            const newItems = new Map(state.items);

            if (existingItem) {
                if (quantity <= 0) {
                    // Remove item if quantity is zero or less
                    newItems.delete(variantId);
                } else {
                    // Update quantity and total price
                    newItems.set(variantId, {
                        ...existingItem,
                        quantity: quantity,
                        total_price: quantity * existingItem.unit_price,
                    });
                }
            }
            return { ...state, items: newItems };
        }

         case 'APPLY_CHARGE': {
            const charge = action.payload;
            const newCharges = new Map(state.appliedCharges);
            // Avoid adding the same charge twice; use UPDATE_APPLIED_CHARGE_AMOUNT if needed
            if (!newCharges.has(charge.id)) {
                 newCharges.set(charge.id, {
                    chargeId: charge.id,
                    name: charge.name,
                    amount_charged: charge.amount, // Use default amount initially
                    is_taxable: charge.is_taxable,
                });
            }
            return { ...state, appliedCharges: newCharges };
        }

        case 'REMOVE_CHARGE': {
            const newCharges = new Map(state.appliedCharges);
            newCharges.delete(action.payload.chargeId);
            return { ...state, appliedCharges: newCharges };
        }

         case 'UPDATE_APPLIED_CHARGE_AMOUNT': {
            const { chargeId, amount } = action.payload;
            const existingCharge = state.appliedCharges.get(chargeId);
            const newCharges = new Map(state.appliedCharges);
            if (existingCharge) {
                 newCharges.set(chargeId, {
                    ...existingCharge,
                    amount_charged: amount >= 0 ? amount : 0, // Ensure amount isn't negative
                });
            }
            return { ...state, appliedCharges: newCharges };
        }


        case 'UPDATE_CUSTOMER_DETAIL': {
            // Only update allowed fields to prevent incorrect state updates
            if (['customerName', 'customerPhone', 'aggregatorId', 'notes'].includes(action.payload.field)) {
                 return { ...state, [action.payload.field]: action.payload.value };
            }
            return state; // Return unchanged state if field is not allowed
        }

        case 'SELECT_PAYMENT_METHOD':
            // Reset cash amount if method changes from Cash
            const resetCash = state.paymentMethod === PaymentMethod.Cash && action.payload !== PaymentMethod.Cash;
            return {
                ...state,
                paymentMethod: action.payload,
                cashAmountReceived: resetCash ? null : state.cashAmountReceived,
             };

        case 'UPDATE_CASH_RECEIVED':
            // Ensure cash received is only set for Cash payment method
            if (state.paymentMethod === PaymentMethod.Cash) {
                 return { ...state, cashAmountReceived: action.payload };
            }
             return state; // Otherwise, don't update it


        case 'RESET_ORDER':
             // Keep selected store, reset everything else
            return { ...initialState, selectedStore: state.selectedStore };

        default:
             // If the action type doesn't match anything, return the current state unchanged
             // This handles potential exhaustiveness checks if you configure TypeScript strictly
             // const exhaustiveCheck: never = action; 
            return state;
    }
};

// --- Context Definition ---
// Define what values the context will provide
interface OrderContextProps {
    state: OrderState;
    dispatch: React.Dispatch<Action>;
    // Computed values derived from state
    subtotal: number;
    taxableTotal: number;
    appliedChargesTaxableTotal: number;
    appliedChargesNonTaxableTotal: number;
    cgst: number;
    sgst: number;
    grandTotal: number;
    changeDue: number | null;
}

// Create the context with a default value (usually null or an initial shape)
// We assert non-null with '!' because the Provider will always supply a value.
const OrderContext = createContext<OrderContextProps>(null!);

// --- Context Provider Component ---
// This component wraps parts of your app, providing the order state and dispatch function
interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(orderReducer, initialState);

    // Calculate derived values using useMemo for efficiency
    const {
        subtotal,
        taxableTotal,
        appliedChargesTaxableTotal,
        appliedChargesNonTaxableTotal,
        cgst,
        sgst,
        grandTotal,
        changeDue
     } = useMemo(() => {
        const currentSubtotal = Array.from(state.items.values()).reduce(
            (sum, item) => sum + item.total_price, 0
        );

        let currentAppliedChargesTaxable = 0;
        let currentAppliedChargesNonTaxable = 0;
        state.appliedCharges.forEach(charge => {
            if (charge.is_taxable) {
                currentAppliedChargesTaxable += charge.amount_charged;
            } else {
                currentAppliedChargesNonTaxable += charge.amount_charged;
            }
        });

        // Assuming no discounts yet as per Phase 1 description, taxable amount is subtotal + taxable charges
        // If discounts are added later, they need to be factored in here
        const currentTaxableTotal = currentSubtotal + currentAppliedChargesTaxable;
        const currentCgst = parseFloat((currentTaxableTotal * 0.09).toFixed(2));
        const currentSgst = parseFloat((currentTaxableTotal * 0.09).toFixed(2));
        const currentGrandTotal = parseFloat(
            (currentTaxableTotal + currentCgst + currentSgst + currentAppliedChargesNonTaxable).toFixed(2)
        );

        let currentChangeDue: number | null = null;
        if (state.paymentMethod === PaymentMethod.Cash && typeof state.cashAmountReceived === 'number' && state.cashAmountReceived !== null) {
             currentChangeDue = parseFloat((state.cashAmountReceived - currentGrandTotal).toFixed(2));
             // Optionally, handle cases where change might be negative if validation elsewhere fails
             // if (currentChangeDue < 0) currentChangeDue = 0; // Or handle as error
        }

        return {
            subtotal: currentSubtotal,
            taxableTotal: currentTaxableTotal,
            appliedChargesTaxableTotal: currentAppliedChargesTaxable,
            appliedChargesNonTaxableTotal: currentAppliedChargesNonTaxable,
            cgst: currentCgst,
            sgst: currentSgst,
            grandTotal: currentGrandTotal,
            changeDue: currentChangeDue
        };
    }, [state.items, state.appliedCharges, state.paymentMethod, state.cashAmountReceived]);


    // Value provided by the context
    const value = {
        state,
        dispatch,
        subtotal,
        taxableTotal,
        appliedChargesTaxableTotal,
        appliedChargesNonTaxableTotal,
        cgst,
        sgst,
        grandTotal,
        changeDue
    };

    return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

// --- Custom Hook for easy context access ---
// Provides a convenient way to use the context's value in components
export const useOrder = (): OrderContextProps => {
    const context = useContext(OrderContext);
    if (context === null) {
        // This error means you tried to use the context outside of a component wrapped by OrderProvider
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
};