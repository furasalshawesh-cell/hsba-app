import { PersonalFinanceOutput, PersonalFinanceRules, SectorId } from '../../types';

export function getPersonalFinanceRule(params: {
  bankId: string;
  pathType: 'personal_only' | 'real_estate_with_new_personal';
  customerStatus: 'active_employee' | 'retired';
  rules: PersonalFinanceRules[];
}): PersonalFinanceRules {
  const { bankId, pathType, customerStatus, rules } = params;

  // 1. Find specific rule for bank + pathType + customerStatus
  let rule = rules.find(
    r => r.bankId === bankId &&
    r.pathType === pathType &&
    r.customerStatus === customerStatus &&
    r.isActive
  );

  // 2. If not found, find rule for 'all'/default + pathType + customerStatus
  if (!rule) {
    rule = rules.find(
      r => r.bankId === 'all' &&
      r.pathType === pathType &&
      r.customerStatus === customerStatus &&
      r.isActive
    );
  }

  // Safe fallback if still not found
  if (!rule) {
    return {
      bankId: 'all',
      sectorId: 'all',
      dsrPercentage: customerStatus === 'retired' ? 25 : 33,
      termMonths: 60,
      financeCoefficient: 50.42,
      annualMargin: 2.50,
      minSalary: 4000,
      minAge: 18,
      maxAge: 65,
      retireeDsrPercentage: 25,
      isActive: true,
      calculationMethod: 'multiplier',
      pathType,
      customerStatus
    };
  }

  return rule;
}

export function calculatePersonalFinance(params: {
  netSalary: number;
  obligations: number;
  sectorId: SectorId;
  bankId: string;
  rules: PersonalFinanceRules[];
  productId?: string; // To detect pathType or handle legacy
}): PersonalFinanceOutput {
  const { netSalary, obligations, sectorId, bankId, rules, productId } = params;

  // Map sectorId to customerStatus
  const customerStatus: 'active_employee' | 'retired' = sectorId === 'retired' ? 'retired' : 'active_employee';

  // Map productId to pathType
  let pathType: 'personal_only' | 'real_estate_with_new_personal' = 'personal_only';
  if (productId === 'both' || productId === 'real_estate_with_new_personal') {
    pathType = 'real_estate_with_new_personal';
  }

  // Get matching rule
  const rule = getPersonalFinanceRule({
    bankId,
    pathType,
    customerStatus,
    rules
  });

  const dsrPercent = rule.dsrPercentage;
  const termMonths = rule.termMonths;
  const coeff = rule.financeCoefficient;
  const calculationMethod = rule.calculationMethod || 'multiplier';

  // Max personal installment allowed
  const maxDsrInstallment = netSalary * (dsrPercent / 100);
  
  // Installment available after subtracting other debts/obligations
  let rawInstallment = maxDsrInstallment - obligations;
  if (rawInstallment < 0) {
    rawInstallment = 0;
  }

  let personalFinanceAmount = 0;
  let totalRepayment = 0;
  let profitAmount = 0;

  if (calculationMethod === 'pmt') {
    const annualMargin = rule.annualMargin;
    const monthlyRate = annualMargin / 100 / 12;
    if (monthlyRate > 0) {
      personalFinanceAmount = rawInstallment * (1 - Math.pow(1 + monthlyRate, -termMonths)) / monthlyRate;
    } else {
      personalFinanceAmount = rawInstallment * termMonths;
    }
    totalRepayment = rawInstallment * termMonths;
    profitAmount = totalRepayment - personalFinanceAmount;
  } else {
    // multiplier (معامل التمويل)
    personalFinanceAmount = rawInstallment * coeff;
    totalRepayment = rawInstallment * termMonths;
    profitAmount = totalRepayment - personalFinanceAmount;
  }

  // "لا تقرّب القسط قبل الحساب. استخدم القسط الخام للحسابات، وقرّب فقط عند العرض"
  const roundedPersonalFinanceAmount = Math.ceil(personalFinanceAmount);
  const roundedTotalRepayment = Math.round(totalRepayment);
  const roundedProfitAmount = roundedTotalRepayment - roundedPersonalFinanceAmount;
  
  const totalProfitPercentage = roundedPersonalFinanceAmount > 0 
    ? Number(((roundedProfitAmount / roundedPersonalFinanceAmount) * 100).toFixed(2)) 
    : 0;

  return {
    personalFinanceAmount: roundedPersonalFinanceAmount,
    monthlyInstallment: Math.round(rawInstallment), // Display installment is rounded for the UI
    totalRepayment: roundedTotalRepayment,
    profitAmount: roundedProfitAmount,
    totalProfitPercentage,
    termMonths,
    calculationMethod,
    multiplier: coeff
  };
}
