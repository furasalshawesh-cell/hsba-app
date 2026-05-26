import { NetSalaryOutput, SectorId, NetSalaryRule } from '../../types';

export function calculateNetSalary(params: {
  sectorId: SectorId;
  basicSalary?: number;
  housingAllowance?: number;
  otherAllowances?: number;
  method: 'direct' | 'details';
  directNetSalary?: number;
  rules: NetSalaryRule[];
}): NetSalaryOutput {
  const { sectorId, basicSalary = 0, housingAllowance = 0, otherAllowances = 0, method, directNetSalary = 0, rules } = params;

  if (method === 'direct' || sectorId === 'retired') {
    return {
      grossSalary: directNetSalary,
      deductionAmount: 0,
      netSalary: directNetSalary,
      calculationMethod: 'direct'
    };
  }

  // Find the rule
  const rule = rules.find(r => r.sectorId === sectorId && r.isActive) || {
    deductionPercentage: 9.0,
    deductionBase: 'basic_housing' as const,
    roundResult: true
  };

  const gross = basicSalary + housingAllowance + otherAllowances;
  let deductionBaseAmount = 0;

  if (rule.deductionBase === 'basic_housing') {
    deductionBaseAmount = basicSalary + housingAllowance;
  } else if (rule.deductionBase === 'basic_only') {
    deductionBaseAmount = basicSalary;
  } else {
    deductionBaseAmount = gross;
  }

  const deductionPct = rule.deductionPercentage || 0;
  let deductionAmount = (deductionBaseAmount * deductionPct) / 100;
  
  if (rule.roundResult) {
    deductionAmount = Math.round(deductionAmount);
  }

  let netSalary = gross - deductionAmount;
  if (netSalary < 0) netSalary = 0;

  return {
    grossSalary: gross,
    deductionAmount: deductionAmount,
    netSalary: rule.roundResult ? Math.round(netSalary) : netSalary,
    calculationMethod: 'details'
  };
}
