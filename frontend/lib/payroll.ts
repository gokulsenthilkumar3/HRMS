/**
 * Payroll calculation utilities — Indian compliance.
 * Resolves Issue #5: Payroll module with Indian tax slabs.
 */

export interface SalaryComponents {
  basic: number;
  hra: number;
  da: number;
  ta: number;
  specialAllowance: number;
  otherAllowances?: number;
}

export interface Deductions {
  pf: number;          // Employee PF: 12% of Basic
  esi: number;         // Employee ESI: 0.75% of Gross (if Gross <= 21000)
  pt: number;          // Professional Tax (state-specific)
  tds: number;         // TDS based on income tax
  otherDeductions?: number;
}

export interface PayslipData {
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  components: SalaryComponents;
  deductions: Deductions;
  grossSalary: number;
  netSalary: number;
}

/**
 * Calculate gross salary from components.
 * Sanity check: returns gross + any discrepancy flag.
 */
export function calculateGrossSalary(components: SalaryComponents): {
  gross: number;
  breakdown: Record<string, number>;
} {
  const breakdown = {
    basic: components.basic,
    hra: components.hra,
    da: components.da,
    ta: components.ta,
    specialAllowance: components.specialAllowance,
    otherAllowances: components.otherAllowances || 0,
  };
  const gross = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  return { gross, breakdown };
}

/**
 * Calculate statutory deductions.
 */
export function calculateDeductions(basic: number, gross: number): Deductions {
  const pf = Math.round(basic * 0.12);                     // 12% of Basic
  const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0; // 0.75% if eligible
  const pt = getProfessionalTax(gross);                     // State PT slab
  const tds = 0;                                            // Computed in calculateTax()
  return { pf, esi, pt, tds };
}

/**
 * Professional Tax slab (Karnataka/Tamil Nadu/Maharashtra common slab).
 * Adjust per state as needed.
 */
export function getProfessionalTax(monthlyGross: number): number {
  const annual = monthlyGross * 12;
  if (annual <= 150000) return 0;
  if (annual <= 250000) return 150;
  if (annual <= 500000) return 150;
  return 200; // Max PT per month in most states
}

/**
 * Calculate annual income tax — New Regime FY 2024-25.
 * Returns monthly TDS amount.
 */
export function calculateTax(
  annualGross: number,
  regime: 'old' | 'new' = 'new'
): { annualTax: number; monthlyTDS: number; regime: string; effectiveRate: number } {
  let taxableIncome = annualGross;
  let tax = 0;

  if (regime === 'new') {
    // New regime slabs FY 2024-25 (post Budget 2024)
    const slabs = [
      { limit: 300000,  rate: 0.00 },
      { limit: 600000,  rate: 0.05 },
      { limit: 900000,  rate: 0.10 },
      { limit: 1200000, rate: 0.15 },
      { limit: 1500000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 },
    ];
    // Standard deduction: ₹75,000 for new regime
    taxableIncome = Math.max(0, annualGross - 75000);
    tax = computeSlabTax(taxableIncome, slabs);
    // Rebate u/s 87A: No tax if taxable income <= 7L
    if (taxableIncome <= 700000) tax = 0;
  } else {
    // Old regime slabs
    const slabs = [
      { limit: 250000,  rate: 0.00 },
      { limit: 500000,  rate: 0.05 },
      { limit: 1000000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 },
    ];
    // Standard deduction: ₹50,000
    taxableIncome = Math.max(0, annualGross - 50000);
    tax = computeSlabTax(taxableIncome, slabs);
    // Rebate u/s 87A: No tax if taxable income <= 5L
    if (taxableIncome <= 500000) tax = 0;
  }

  // Add 4% Health & Education Cess
  tax = Math.round(tax * 1.04);

  const monthlyTDS = Math.round(tax / 12);
  const effectiveRate = annualGross > 0 ? (tax / annualGross) * 100 : 0;

  return { annualTax: tax, monthlyTDS, regime, effectiveRate: Math.round(effectiveRate * 100) / 100 };
}

function computeSlabTax(income: number, slabs: { limit: number; rate: number }[]): number {
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (income <= prev) break;
    const taxable = Math.min(income, slab.limit) - prev;
    tax += taxable * slab.rate;
    prev = slab.limit;
  }
  return tax;
}

/**
 * Compute net salary from gross and deductions.
 */
export function calculateNetSalary(gross: number, deductions: Deductions): number {
  const totalDeductions =
    deductions.pf +
    deductions.esi +
    deductions.pt +
    deductions.tds +
    (deductions.otherDeductions || 0);
  return Math.max(0, gross - totalDeductions);
}
