// frontend/src/contexts/OrderContext.tsx

import React, { createContext, useReducer, useContext, useMemo } from 'react';
import type { ReactNode } from 'react'; // ReactNode is a type

// Import enums that are used as VALUES
import { PaymentMethod } from '../types/domain'; 

// Import interfaces/types that are used only as TYPE ANNOTATIONS
import type {
    Store,
    Product,
    ProductVariant,
    Charge,
    OrderItemState,
    AppliedChargeState
} from '../types/domain';

// --- State Shape ---
interface OrderState {
    selectedStore: Store | null;
    items: Map<string, OrderItemState>; // Key is ProductVariant ID
    appliedCharges: Map<string, AppliedChargeState>; // Key is Charge ID
    customerName: string;
    customerPhone: string;
    aggregatorId: string;
    notes: string;
    paymentMethod: PaymentMethod | null; // Uses PaymentMethod enum as a type here
    cashAmountReceived: number | null;
}

// --- Action Types ---
type Action =
    | { type: 'SELECT_STORE'; payload: Store | null }
    | { type: 'ADD_ITEM'; payload: { product: Product; variant: ProductVariant } }
    | { type: 'REMOVE_ITEM'; payload: { variantId: string } }
    | { type: 'UPDATE_QUANTITY'; payload: { variantId: string; quantity: number } }
    | { type: 'APPLY_CHARGE'; payload: Charge }
    | { type: 'REMOVE_CHARGE'; payload: { chargeId: string } }
    | { type: 'UPDATE_APPLIED_CHARGE_AMOUNT'; payload: { chargeId: string; amount: number } }
    | { type: 'UPDATE_CUSTOMER_DETAIL'; payload: { field: keyof OrderState; value: string } }
    | { type: 'SELECT_PAYMENT_METHOD'; payload: PaymentMethod | null } // Uses PaymentMethod enum as a type
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
const orderReducer = (state: OrderState, action: Action): OrderState => {
    switch (action.type) {
        case 'SELECT_STORE':
            return { ...initialState, selectedStore: action.payload };

        case 'ADD_ITEM': {
            const { product, variant } = action.payload;
            const existingItem = state.items.get(variant.id);
            const newItems = new Map(state.items);
            if (existingItem) {
                newItems.set(variant.id, {
                    ...existingItem,
                    quantity: existingItem.quantity + 1,
                    total_price: (existingItem.quantity + 1) * existingItem.unit_price,
                });
            } else {
                newItems.set(variant.id, {
                    variantId: variant.id,
                    productId: product.id,
                    productName: product.name,
                    variantName: variant.name,
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
                    newItems.delete(variantId);
                } else {
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
            if (!newCharges.has(charge.id)) {
                 newCharges.set(charge.id, {
                    chargeId: charge.id,
                    name: charge.name,
                    amount_charged: charge.amount,
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
                    amount_charged: amount >= 0 ? amount : 0,
                });
            }
            return { ...state, appliedCharges: newCharges };
        }

        case 'UPDATE_CUSTOMER_DETAIL': {
            if (['customerName', 'customerPhone', 'aggregatorId', 'notes'].includes(action.payload.field)) {
                 return { ...state, [action.payload.field]: action.payload.value };
            }
            return state;
        }

        case 'SELECT_PAYMENT_METHOD':
            // Here PaymentMethod.Cash is a VALUE comparison
            const resetCash = state.paymentMethod === PaymentMethod.Cash && action.payload !== PaymentMethod.Cash;
            return {
                ...state,
                paymentMethod: action.payload,
                cashAmountReceived: resetCash ? null : state.cashAmountReceived,
             };

        case 'UPDATE_CASH_RECEIVED':
            // Here PaymentMethod.Cash is a VALUE comparison
            if (state.paymentMethod === PaymentMethod.Cash) {
                 return { ...state, cashAmountReceived: action.payload };
            }
             return state;

        case 'RESET_ORDER':
            return { ...initialState, selectedStore: state.selectedStore };

        default:
            return state;
    }
};

// --- Context Definition ---
interface OrderContextProps {
    state: OrderState;
    dispatch: React.Dispatch<Action>;
    subtotal: number;
    taxableTotal: number;
    appliedChargesTaxableTotal: number;
    appliedChargesNonTaxableTotal: number;
    cgst: number;
    sgst: number;
    grandTotal: number;
    changeDue: number | null;
}

const OrderContext = createContext<OrderContextProps>(null!);

// --- Context Provider Component ---
interface OrderProviderProps {
  children: ReactNode; // ReactNode used as a type
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(orderReducer, initialState);

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
        // console.log('Applied Charges in Context:', Array.from(state.appliedCharges.values())); // Keep for debugging if needed
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
        const currentTaxableTotal = currentSubtotal + currentAppliedChargesTaxable;
        const currentCgst = parseFloat((currentTaxableTotal * 0.09).toFixed(2));
        const currentSgst = parseFloat((currentTaxableTotal * 0.09).toFixed(2));
        const currentGrandTotal = parseFloat(
            (currentTaxableTotal + currentCgst + currentSgst + currentAppliedChargesNonTaxable).toFixed(2)
        );
        let currentChangeDue: number | null = null;
        // Here PaymentMethod.Cash is a VALUE comparison
        if (state.paymentMethod === PaymentMethod.Cash && typeof state.cashAmountReceived === 'number' && state.cashAmountReceived !== null) {
             currentChangeDue = parseFloat((state.cashAmountReceived - currentGrandTotal).toFixed(2));
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
export const useOrder = (): OrderContextProps => {
    const context = useContext(OrderContext);
    if (context === null) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
};