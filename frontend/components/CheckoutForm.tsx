// src/components/CheckoutForm.tsx
"use client";

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Button from './Button';

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
}

export default function CheckoutForm({ onSuccess, onCancel, amount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    // Confirm the payment using Stripe
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // We aren't using a redirect page, we want it to stay in the modal
        return_url: window.location.origin + '/dashboard',
      },
      redirect: 'if_required', 
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    } else {
      // Payment Successful!
      setIsProcessing(false);
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex justify-between items-center font-bold text-lg mb-6">
        <span>Total Fare:</span>
        <span>${amount.toFixed(2)}</span>
      </div>

      {/* Stripe securely injects the credit card inputs here */}
      <PaymentElement />

      {errorMessage && (
        <div className="text-red-600 bg-red-50 p-3 rounded-md text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!stripe || isProcessing} isLoading={isProcessing}>
          Pay Now
        </Button>
      </div>
    </form>
  );
}