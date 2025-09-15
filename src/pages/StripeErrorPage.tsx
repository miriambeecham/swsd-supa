import React from 'react';
import { Link } from 'react-router-dom';

const StripeError = () => {
  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-red-800 mb-4">
          ❌ Payment Failed
        </h1>
        <p className="text-red-700 mb-4">
          We couldn't process your payment. Your card was not charged.
        </p>
        <Link 
          to="/classes" 
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
};

export default StripeError;