import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SalaryInput { basicSalary: number; hra?: number; da?: number; ta?: number; specialAllowance?: number; }

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // ─── Salary Calculators ─────────────────────────────────────────────────

  calculateGrossSalary(input: SalaryInput) {
    const basic    = input.basicSalary;
    const hra      = input.hra      ?? Math.round(basic * 0.40);
    const da       = input.da       ?? Math.round(basic * 0.10);
    const ta       = input.ta       ?? Math.round(basic * 0.05);
    const special  = input.specialAllowance ?? Math.round(basic * 0.05);
    const pf       = Math.round(basic * 0.12);           // Employee PF 12%
    const esi      = basic <= 21000 ? Math.round(basic * 0.0075) : 0; // ESI 0.75%
    const pt       = basic > 15000 ? 200 : basic > 10000 ? 150 : 0;   // Professional Tax (Karnataka/TN)
    const gross    = basic + hra + da + ta + special;
    const totalDeductions = pf + esi + pt;
    return { basic, hra, da, ta, special, pf, esi, pt, gross, totalDeductions, ctc: gross + pf };
  }

  calculateTax(annualGross: number) {
    // ── New Regime FY 2026-27 ──
    const newSlabs = [
      { upto: 400000,  rate: 0 },
      { upto: 800000,  rate: 0.05 },
      { upto: 1200000, rate: 0.10 },
      { upto: 1600000, rate: 0.15 },
      { upto: 2000000, rate: 0.20 },
      { upto: 2400000, rate: 0.25 },
      { upto: Infinity, rate: 0.30 },
    ];
    // ── Old Regime ──
    const oldSlabs = [
      { upto: 250000,  rate: 0 },
      { upto: 500000,  rate: 0.05 },
      { upto: 1000000, rate: 0.20 },
      { upto: Infinity, rate: 0.30 },
    ];
    const std80c = 150000; // Standard deduction old regime

    const calcTax = (income: number, slabs: typeof newSlabs) => {
      let tax = 0, prev = 0;
      for (const s of slabs) {
        if (income <= prev) break;
        const taxable = Math.min(income, s.upto) - prev;
        tax += taxable * s.rate;
        prev = s.upto;
      }
      return Math.round(tax);
    };

    const newTax = calcTax(annualGross, newSlabs);
    const oldTax = calcTax(Math.max(0, annualGross - std80c), oldSlabs);
    const surcharge = (g: number, t: number) => {
      if (g > 5000000) return Math.round(t * 0.25);
      if (g > 1000000) return Math.round(t * 0.15);
      return 0;
    };
    const cess = (t: number) => Math.round(t * 0.04);

    const newTotal = newTax + surcharge(annualGross, newTax) + cess(newTax + surcharge(annualGross, newTax));
    const oldTotal = oldTax + surcharge(annualGross, oldTax) + cess(oldTax + surcharge(annualGross, oldTax));

    return {
      annualGross,
      newRegime: { annualTax: newTotal, monthlyTax: Math.round(newTotal/12) },
      oldRegime: { annualTax: oldTotal, monthlyTax: Math.round(oldTotal/12), deductionUsed: std80c },
      recommended: newTotal <= oldTotal ? 'NEW' : 'OLD',
      saving: Math.abs(oldTotal - newTotal),
    };
  }

  // ─── Payrun Workflow ─────────────────────────────────────────────────────

  async runPayroll(period: string, processedBy: string) {
    const employees = await this.prisma.user.findMany({ where: { isActive: true }, select: { id: true, department: true } });
    const results: any[] = [];
    for (const emp of employees) {
      const lastPayslip = await this.prisma.payslip.findFirst({ where: { userId: emp.id }, orderBy: { date: 'desc' } });
      const basic = lastPayslip?.basicSalary ?? 50000;
      const { gross, pf, esi, pt, hra, da: _da, ta: _ta, special } = this.calculateGrossSalary({ basicSalary: basic });
      const tax = this.calculateTax(gross * 12);
      const monthlyTax = tax.newRegime.monthlyTax;
      const deductions = pf + esi + pt;
      const net = gross - deductions - monthlyTax;
      const payslip = await this.prisma.payslip.create({
        data: {
          userId: emp.id, period, basicSalary: basic, hra,
          allowances: special, deductions, taxAmount: monthlyTax,
          netAmount: net, status: 'DRAFT', date: new Date(),
        },
      });
      results.push(payslip);
    }
    return { period, processed: results.length, status: 'DRAFT', message: 'Payrun created. Pending manager approval.' };
  }

  async approvePayrun(period: string) {
    await this.prisma.payslip.updateMany({ where: { period, status: 'DRAFT' }, data: { status: 'APPROVED' } });
    return { period, status: 'APPROVED' };
  }

  async processPayrun(period: string) {
    await this.prisma.payslip.updateMany({ where: { period, status: 'APPROVED' }, data: { status: 'PAID' } });
    return { period, status: 'PAID' };
  }

  async getUserPayslips(userId: string) {
    return this.prisma.payslip.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  }

  validateBankDetails(ifsc: string, accountNumber: string, pan: string) {
    const errors: string[] = [];
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))            errors.push('Invalid IFSC code (format: ABCD0123456)');
    if (!/^\d{9,18}$/.test(accountNumber))               errors.push('Account number must be 9-18 digits');
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase())) errors.push('Invalid PAN format (ABCDE1234F)');
    return { valid: errors.length === 0, errors };
  }
}
