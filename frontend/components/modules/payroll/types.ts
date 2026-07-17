export interface Payslip {
  id: string;
  period: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  taxAmount: number;
  netAmount: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  date: string;
}

export interface TaxResult {
  annualGross: number;
  newRegime: { annualTax: number; monthlyTax: number };
  oldRegime: { annualTax: number; monthlyTax: number; deductionUsed: number };
  recommended: 'NEW' | 'OLD';
  saving: number;
}
