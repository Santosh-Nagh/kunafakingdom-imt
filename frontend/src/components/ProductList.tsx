// frontend/src/components/ProductList.tsx

import React, { useState, useEffect } from 'react'; // React is a value import
import { useOrder } from '../contexts/OrderContext';
import { getProducts } from '../services/api';
// Product, ProductVariant, Category are used only as types
import type { Product, ProductVariant, Category } from '../types/domain'; 

// FetchedProduct is a type alias
type FetchedProduct = Product & {
    category?: Category;
    variants: ProductVariant[];
};

export const ProductList: React.FC = () => {
    const { dispatch, state } = useOrder();

    const [products, setProducts] = useState<FetchedProduct[]>([]); // Typed
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (state.selectedStore) {
            const fetchProducts = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const fetchedProducts = await getProducts();
                    setProducts(fetchedProducts as FetchedProduct[]);
                } catch (err) {
                    console.error("Failed to fetch products:", err);
                    setError(err instanceof Error ? err.message : 'Failed to load products.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProducts();
        } else {
            setProducts([]);
            setIsLoading(false);
        }
    }, [state.selectedStore]);

    const handleIncrementItem = (product: FetchedProduct, variant: ProductVariant) => { // Typed
        dispatch({ type: 'ADD_ITEM', payload: { product, variant } });
    };

    const handleDecrementItem = (variantId: string) => {
        const itemInOrder = state.items.get(variantId);
        if (itemInOrder && itemInOrder.quantity > 0) {
            dispatch({ type: 'UPDATE_QUANTITY', payload: { variantId, quantity: itemInOrder.quantity - 1 } });
        }
    };
    
    const qtyButtonClasses = "px-2.5 py-1 border border-gray-300 bg-gray-100 hover:bg-gray-200 text-brand-text-on-light rounded-md transition-colors text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-brand-yellow";
    const qtyDisplayClasses = "w-10 text-center text-brand-text-on-light font-medium tabular-nums";

    return (
        <div className="mt-0">
            <h2 className="text-2xl font-semibold mb-4 text-brand-green">
                Products / Menu
            </h2>

            {isLoading && <p className="text-gray-500 py-4 text-center">Loading products...</p>}
            {error && <p className="text-red-600 py-4 text-center">Error: {error}</p>}
            
            {!isLoading && !error && products.length === 0 && state.selectedStore && (
                 <p className="text-gray-500 py-4 text-center">No products found for this branch or all products are inactive.</p>
            )}

            {!isLoading && !error && products.length > 0 && (
                <div className="space-y-6">
                    {(() => {
                        const productsByCategory: { [categoryName: string]: FetchedProduct[] } = {};
                        products.forEach(product => {
                            const categoryName = product.category?.name || 'Uncategorized';
                            if (!productsByCategory[categoryName]) {
                                productsByCategory[categoryName] = [];
                            }
                            productsByCategory[categoryName].push(product);
                        });

                        return Object.entries(productsByCategory).map(([categoryName, productsInGroup]) => (
                            <div key={categoryName} className="p-4 md:p-6 bg-white rounded-lg shadow-lg">
                                <h3 className="text-xl font-bold mb-4 text-brand-green border-b border-gray-200 pb-2">
                                    {categoryName}
                                </h3>
                                <div className="space-y-4">
                                    {productsInGroup.map((product) => ( // product is FetchedProduct
                                        <div key={product.id} className="pl-0">
                                            <p className="font-semibold text-lg text-brand-text-on-light mb-1">{product.name}</p>
                                            <div className="space-y-2 pl-2">
                                                {product.variants.map((variant) => { // variant is ProductVariant
                                                    const itemInOrder = state.items.get(variant.id);
                                                    const currentQuantity = itemInOrder?.quantity || 0;
                                                    return (
                                                        <div key={variant.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-b-0">
                                                            <span className="text-brand-text-on-light">
                                                                {variant.name} - 
                                                                <span className="font-medium"> ₹{variant.price.toFixed(2)}</span>
                                                            </span>
                                                            <div className="flex items-center space-x-2 ml-4">
                                                                <button
                                                                    onClick={() => handleDecrementItem(variant.id)}
                                                                    className={`${qtyButtonClasses} ${currentQuantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    disabled={currentQuantity === 0}
                                                                    aria-label={`Decrease quantity of ${variant.name}`}
                                                                >-</button>
                                                                <span className={qtyDisplayClasses}>
                                                                    {currentQuantity > 0 ? currentQuantity : '-'}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleIncrementItem(product, variant)}
                                                                    className={qtyButtonClasses}
                                                                    aria-label={`Increase quantity of ${variant.name}`}
                                                                >+</button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            )}
        </div>
    );
};