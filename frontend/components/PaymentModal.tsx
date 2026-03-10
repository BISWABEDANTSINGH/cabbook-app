// src/components/PaymentModal.tsx
"use client";

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';

// Load Stripe outside the component to avoid recreating the object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

interface PaymentModalProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentModal({ clientSecret, amount, onSuccess, onCancel }: PaymentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* THE FIX IS HERE: 
        1. Added max-h-[90vh] to limit the height to 90% of the screen.
        2. Added flex and flex-col to properly structure the header vs the scrollable body.
      */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Modal Header (Fixed at top) */}
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Complete Your Payment</h2>
          <p className="text-sm text-gray-500 mt-1">Powered securely by Stripe</p>
        </div>
        
        {/* Modal Body (Scrollable!) */}
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} amount={amount} />
          </Elements>
        </div>
        
      </div>
    </div>
  );
}