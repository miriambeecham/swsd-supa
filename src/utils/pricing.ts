// src/utils/pricing.ts

/**
 * Adjusts price to recover Stripe fees for classes on or after Jan 1, 2025
 * Only applies to classes booked through our site (Stripe)
 * Formula: ROUNDUP(price ÷ 0.9701)
 */
export function getAdjustedPrice(
  basePrice: number, 
  classDate: string, 
  bookingMethod?: string
): number {
  // Only adjust for classes booked through our site
  if (bookingMethod && bookingMethod.toLowerCase() !== 'swsd website') {
    return basePrice;
  }

  const cutoffDate = new Date('2025-01-01');
  const classDateObj = new Date(classDate);
  
  cutoffDate.setHours(0, 0, 0, 0);
  classDateObj.setHours(0, 0, 0, 0);
  
  if (classDateObj >= cutoffDate) {
    return Math.ceil(basePrice / 0.9701);
  }
  
  return basePrice;
}
