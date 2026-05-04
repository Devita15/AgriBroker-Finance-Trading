// src/services/pricingEngine.js
class PricingEngine {
    calculateLineTotal(pricingType, data) {
      let billedQty = 0;
      let lineTotal = 0;
      
      switch (pricingType) {
        case 'kg':
          // For KG: bags × weight per bag or direct kg entry
          if (data.bagsCount && data.weightPerBag) {
            billedQty = data.bagsCount * data.weightPerBag;
          } else if (data.actualQty) {
            billedQty = data.actualQty;
          }
          // Subtract quality deduction
          billedQty = billedQty - (data.qualityDeductionQty || 0);
          lineTotal = billedQty * data.rate;
          break;
          
        case 'quintal':
          billedQty = data.actualQty - (data.qualityDeductionQty || 0);
          lineTotal = billedQty * data.rate;
          break;
          
        case 'piece':
        case 'bunch':
        case 'crate':
        case 'dozen':
          billedQty = data.actualQty - (data.qualityDeductionQty || 0);
          lineTotal = billedQty * data.rate;
          break;
          
        case 'flat':
          billedQty = 1;
          lineTotal = data.rate;
          break;
          
        default:
          throw new Error(`Unknown pricing type: ${pricingType}`);
      }
      
      return {
        billedQty,
        lineTotal,
        actualQtyUnit: this.getUnitForPricingType(pricingType),
      };
    }
    
    getUnitForPricingType(pricingType) {
      const units = {
        'kg': 'kg',
        'quintal': 'quintal',
        'piece': 'pieces',
        'bunch': 'bunches',
        'crate': 'crates',
        'dozen': 'dozens',
        'flat': 'lot',
      };
      return units[pricingType] || 'units';
    }
    
    calculateFinalPayable(grossTotal, deductions, advanceAdjusted, returnValue) {
      const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
      return grossTotal - totalDeductions - (advanceAdjusted || 0) - (returnValue || 0);
    }
  }
  
  module.exports = new PricingEngine();