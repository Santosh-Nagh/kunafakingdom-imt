// frontend/src/components/InvoiceModal.tsx

import React from 'react';
// Import types using 'import type'
import type { CreatedOrderResponse, OrderItem, OrderAppliedCharge } from '../types/domain';
import type { Store } from '../types/domain';

interface InvoiceModalProps {
  order: CreatedOrderResponse | null; 
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const currentStore: Store | undefined = order.store; // currentStore is typed as Store | undefined
  const appTitle = "Kunafa Kingdom";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 print:bg-transparent print:p-0 print:items-start print:justify-start">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-h-full print:max-w-full print:border print:border-gray-300">
        
        <div className="text-center mb-6 border-b border-gray-300 pb-4">
          <h2 className="text-3xl font-bold text-brand-green">{appTitle}</h2>
          {currentStore?.name && <p className="text-lg font-semibold text-brand-text-on-light mt-1">{currentStore.name}</p>}
          {currentStore?.address && <p className="text-sm text-gray-600">{currentStore.address}</p>}
          {currentStore?.phone_number && <p className="text-sm text-gray-600">Phone: {currentStore.phone_number}</p>}
          {currentStore?.gstin && (
            <p className="text-sm text-gray-600 mt-1">GSTIN: {currentStore.gstin}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">Order ID: {order.id.substring(0, 18)}...</p>
          <p className="text-xs text-gray-500">Date: {new Date(order.created_at).toLocaleString()}</p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-brand-green">Items Ordered:</h3>
          <table className="w-full text-sm">
            <thead className="border-b-2 border-gray-200">
              <tr>
                <th className="text-left py-2 pr-1 font-semibold text-brand-text-on-light">Item</th>
                <th className="text-center py-2 px-1 font-semibold text-brand-text-on-light">Qty</th>
                <th className="text-right py-2 px-1 font-semibold text-brand-text-on-light">Price</th>
                <th className="text-right py-2 pl-1 font-semibold text-brand-text-on-light">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: OrderItem) => ( // item typed as OrderItem
                <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-2 pr-1 text-brand-text-on-light">
                    {item.variant?.product?.name || 'Product'} - {item.variant?.name || 'Variant'}
                  </td>
                  <td className="text-center py-2 px-1 text-brand-text-on-light">{item.quantity}</td>
                  <td className="text-right py-2 px-1 text-brand-text-on-light">₹{item.unit_price.toFixed(2)}</td>
                  <td className="text-right py-2 pl-1 text-brand-text-on-light font-medium">₹{item.total_price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {order.applied_charges && order.applied_charges.length > 0 && (
          <div className="mb-4 pt-2 border-t border-gray-200">
            <h3 className="text-md font-semibold mt-2 mb-1 text-brand-green">Additional Charges:</h3>
            {order.applied_charges.map((appliedCharge: OrderAppliedCharge) => ( // appliedCharge typed
              <div key={appliedCharge.id} className="flex justify-between text-sm text-brand-text-on-light py-0.5">
                <span>{appliedCharge.charge?.name || 'Charge'}</span>
                <span className="font-medium">₹{appliedCharge.amount_charged.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t-2 border-gray-300 space-y-1.5 text-sm">
          <div className="flex justify-between text-brand-text-on-light">
            <span>Subtotal (Items):</span>
            <span className="font-medium">₹{order.subtotal.toFixed(2)}</span>
          </div>
          {order.applied_charges_amount_taxable > 0 && (
            <div className="flex justify-between text-brand-text-on-light">
                <span>(+) Taxable Charges:</span>
                <span className="font-medium">₹{order.applied_charges_amount_taxable.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-brand-text-on-light font-semibold">
            <span>Taxable Amount:</span>
            <span className="font-medium">₹{order.taxable_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-brand-text-on-light">
            <span>CGST (9%):</span>
            <span className="font-medium">₹{order.cgst_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-brand-text-on-light">
            <span>SGST (9%):</span>
            <span className="font-medium">₹{order.sgst_amount.toFixed(2)}</span>
          </div>
           {order.applied_charges_amount_nontaxable > 0 && (
            <div className="flex justify-between text-brand-text-on-light">
                <span>(+) Non-Taxable Charges:</span>
                <span className="font-medium">₹{order.applied_charges_amount_nontaxable.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-bold text-brand-green mt-3 pt-2 border-t border-dashed border-gray-300">
            <span>Grand Total:</span>
            <span>₹{order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm">
            <div className="flex justify-between text-brand-text-on-light">
                <span>Payment Method:</span>
                <span className="font-semibold">{order.payment_method}</span>
            </div>
            {order.payment_method === 'Cash' && order.amount_received != null && (
                 <div className="flex justify-between text-brand-text-on-light">
                    <span>Amount Received:</span>
                    <span className="font-medium">₹{order.amount_received.toFixed(2)}</span>
                </div>
            )}
            {order.payment_method === 'Cash' && order.change_given != null && order.change_given >= 0 && (
                 <div className="flex justify-between text-brand-text-on-light">
                    <span>Change Given:</span>
                    <span className="font-medium">₹{order.change_given.toFixed(2)}</span>
                </div>
            )}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-300 text-center space-x-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Print Invoice
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-green text-brand-yellow text-sm font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-yellow transition-colors"
          >
            New Order
          </button>
        </div>
      </div>
    </div>
  );
};