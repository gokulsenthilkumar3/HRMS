import { Injectable } from '@nestjs/common';

@Injectable()
export class DepreciationService {
  
  /**
   * Calculates straight-line depreciation for an asset.
   * Formula: (Cost - Salvage Value) / Lifespan
   */
  calculateDepreciation(purchasePrice: number, purchaseDate: Date, lifespanYears: number) {
    const now = new Date();
    const ageInMonths = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
    const lifespanMonths = lifespanYears * 12;
    
    const salvageValue = purchasePrice * 0.1;
    if (ageInMonths >= lifespanMonths) {
      return {
        currentValue: salvageValue,
        monthlyDepreciation: 0,
        totalDepreciated: purchasePrice - salvageValue,
        remainingMonths: 0,
      };
    }
    
    // Assume 10% salvage value for enterprise hardware
    const depreciableAmount = purchasePrice - salvageValue;
    const monthlyDepreciation = depreciableAmount / lifespanMonths;
    
    const currentValue = purchasePrice - (monthlyDepreciation * ageInMonths);
    
    return {
      currentValue: Math.max(currentValue, salvageValue),
      monthlyDepreciation,
      totalDepreciated: purchasePrice - currentValue,
      remainingMonths: lifespanMonths - ageInMonths,
    };
  }
}
