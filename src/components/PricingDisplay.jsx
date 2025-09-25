import React from 'react';

const PricingDisplay = ({ classData, participantCount }) => {
  if (!classData || participantCount === 0) {
    return null;
  }

  const pricePerParticipant = classData.price || classData.Price;
  const totalAmount = pricePerParticipant * participantCount;

  return (
    <div className="pricing-display bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-gray-800 mb-2">Pricing Breakdown</h4>

      <div className="space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>${pricePerParticipant} per participant</span>
          <span>× {participantCount}</span>
        </div>

        <div className="border-t border-gray-300 pt-2">
          <div className="flex justify-between font-bold text-lg text-gray-900">
            <span>Total:</span>
            <span>${totalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingDisplay;