// frontend/src/main.tsx

import { StrictMode } from 'react'; // Changed import from 'react' to get StrictMode directly
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Make sure this path is correct for your index.css file
import { OrderProvider } from './contexts/OrderContext'; // Import the OrderProvider

// Get the root element
const rootElement = document.getElementById('root');

// Ensure the root element exists before trying to create the root
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <OrderProvider> {/* Wrap the App component with the OrderProvider */}
        <App />
      </OrderProvider>
    </StrictMode>,
  );
} else {
  console.error("Failed to find the root element with ID 'root'");
}