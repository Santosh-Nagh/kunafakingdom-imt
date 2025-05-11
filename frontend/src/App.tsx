// frontend/src/App.tsx

import './App.css';
import { BranchSelector } from './components/BranchSelector';
import { ProductList } from './components/ProductList';
import { OrderSummary } from './components/OrderSummary';
import { ChargesInput } from './components/ChargesInput';
import { OrderDetailsInput } from './components/OrderDetailsInput';
import { PaymentSection } from './components/PaymentSection';
import { SubmitOrderButton } from './components/SubmitOrderButton';
import { useOrder } from './contexts/OrderContext';
import KKLlogo from './assets/kunafa-kingdom-logo.png'; // Assuming logo is in src/assets

function App() {
  const { state } = useOrder();

  return (
    <div className="min-h-screen flex flex-col">

      {/* App Header - Adjusted for larger logo */}
      <header className="bg-white text-brand-green shadow-md sticky top-0 z-40">
        {/* Increased py slightly to accommodate a larger logo */}
        <div className="container mx-auto px-4 py-3 flex items-center justify-between"> 
          <div className="flex items-center">
            <img 
              src={KKLlogo} 
              alt="Kunafa Kingdom Logo" 
              className="h-16 w-16 mr-4" // <<<--- INCREASED SIZE to h-16 w-16 (64px)
            /> 
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-green">
              Kunafa Kingdom - POS
            </h1>
          </div>
          {/* Placeholder for other header items */}
        </div>
      </header>

      {/* Main Content Area (page background is still brand-cream) */}
      <main className="container mx-auto p-4 flex-grow">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Column: Selections and Inputs */}
          <div className="lg:w-3/5 space-y-6">
            <section className="branch-selection-section">
              <BranchSelector />
            </section>

            {state.selectedStore ? (
              <>
                <section className="product-list-section">
                  <ProductList />
                </section>
                <section className="charges-input-section">
                  <ChargesInput />
                </section>
                <section className="order-details-input-section">
                  <OrderDetailsInput />
                </section>
              </>
            ) : (
              <div className="mt-6 p-6 bg-white rounded-lg shadow text-center">
                <p className="text-gray-500 font-medium">
                  Please select a branch to start a new order.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary, Payment, and Submit Button */}
          <div className="lg:w-2/5 space-y-6"> 
            <section className="order-summary-section">
              <OrderSummary />
            </section>
            
            {state.selectedStore && (state.items.size > 0 || state.appliedCharges.size > 0) ? (
              <>
                <section className="payment-section">
                  <PaymentSection />
                </section>
                
                <section className="submit-order-section">
                  <SubmitOrderButton />
                </section>
              </>
            ) : (
              <div className="p-4 bg-white rounded-lg shadow text-center">
                 <p className="text-gray-400 text-sm">(Payment & Submit actions will appear here)</p>
              </div>
            )}
          </div>

        </div> {/* End flex container */}
      </main>

      {/* Optional Footer - Kept dark for contrast with cream page */}
      <footer className="bg-brand-green text-brand-text-on-dark text-center p-3 text-xs mt-auto">
        © {new Date().getFullYear()} Kunafa Kingdom. All rights reserved.
      </footer>

    </div>
  );
}

export default App;