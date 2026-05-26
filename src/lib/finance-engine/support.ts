import { HousingSupportOutput, SupportType, SupportSettings, SupportMonthlyBracket, SupportDownpaymentBracket } from '../../types';

/**
 * دالة تبحث عن الشريحة الصحيحة للدعم السكني الشهري بناءً على صافي الراتب
 */
export function getMonthlyHousingSupport(netSalary: number, monthlyBrackets: SupportMonthlyBracket[]): number {
  const bracket = getMonthlyHousingSupportBracket(netSalary, monthlyBrackets);
  return bracket ? bracket.supportAmount : 0;
}

/**
 * دالة تبحث عن الشريحة الصحيحة للدعم السكني الشهري بناءً على صافي الراتب لترجع الشريحة بالكامل
 */
export function getMonthlyHousingSupportBracket(netSalary: number, monthlyBrackets: SupportMonthlyBracket[]): SupportMonthlyBracket | null {
  if (!monthlyBrackets || monthlyBrackets.length === 0) {
    return null;
  }
  return monthlyBrackets.find(b => {
    const toSalaryVal = b.toSalary;
    const hasNoLimit = toSalaryVal === null || toSalaryVal === undefined || toSalaryVal === 999999 || toSalaryVal === 0;
    return netSalary >= b.fromSalary && (hasNoLimit || netSalary <= toSalaryVal);
  }) || null;
}

/**
 * دالة تبحث عن الشريحة الصحيحة لدعم الدفعة بناءً على صافي الراتب
 */
export function getDownPaymentSupport(netSalary: number, downPaymentBrackets: SupportDownpaymentBracket[]): number {
  const bracket = getDownPaymentSupportBracket(netSalary, downPaymentBrackets);
  return bracket ? bracket.supportAmount : 0;
}

/**
 * دالة تبحث عن الشريحة الصحيحة لدعم الدفعة بناءً على صافي الراتب لترجع الشريحة بالكامل
 */
export function getDownPaymentSupportBracket(netSalary: number, downPaymentBrackets: SupportDownpaymentBracket[]): SupportDownpaymentBracket | null {
  if (!downPaymentBrackets || downPaymentBrackets.length === 0) {
    return null;
  }
  return downPaymentBrackets.find(b => {
    const toSalaryVal = b.toSalary;
    const hasNoLimit = toSalaryVal === null || toSalaryVal === undefined || toSalaryVal === 999999 || toSalaryVal === 0;
    return netSalary >= b.fromSalary && (hasNoLimit || netSalary <= toSalaryVal);
  }) || null;
}

export function calculateHousingSupport(params: {
  netSalary: number;
  supportType: SupportType | 'down_payment';
  settings: SupportSettings;
}): HousingSupportOutput {
  const { netSalary, supportType, settings } = params;

  // توحيد نوع الدعم لدعم كلتا الحالتين
  const normalizedSupportType = (supportType === 'down_payment' || supportType === 'downpayment') ? 'downpayment' : supportType;

  if (normalizedSupportType === 'none') {
    return {
      monthlySupport: 0,
      downPaymentSupport: 0,
      supportType: 'none',
      appliedRule: 'بدون دعم سكني'
    };
  }

  if (normalizedSupportType === 'monthly') {
    const bracket = getMonthlyHousingSupportBracket(netSalary, settings.monthlyBrackets);
    const amount = bracket ? bracket.supportAmount : 416;
    const bracketLabel = bracket 
      ? `من ${bracket.fromSalary} إلى ${bracket.toSalary === 999999 || !bracket.toSalary ? 'فأكثر' : bracket.toSalary}` 
      : 'شريحة غير محددة';
    
    return {
      monthlySupport: amount,
      downPaymentSupport: 0,
      supportType: 'monthly',
      appliedRule: `تم اختيار دعم شهري ${amount} ريال لأن صافي الراتب ${netSalary} يقع في شريحة ${bracketLabel}.`
    };
  }

  if (normalizedSupportType === 'downpayment') {
    const bracket = getDownPaymentSupportBracket(netSalary, settings.downpaymentBrackets);
    const amount = bracket ? bracket.supportAmount : 100000;
    const bracketLabel = bracket 
      ? `من ${bracket.fromSalary} إلى ${bracket.toSalary === 999999 || !bracket.toSalary ? 'فأكثر' : bracket.toSalary}` 
      : 'شريحة غير محددة';

    return {
      monthlySupport: 0,
      downPaymentSupport: amount,
      supportType: 'downpayment',
      appliedRule: `تم اختيار دعم دفعة بقيمة ${amount.toLocaleString('ar-SA')} ريال لأن صافي الراتب ${netSalary} يقع في شريحة ${bracketLabel}.`
    };
  }

  return {
    monthlySupport: 0,
    downPaymentSupport: 0,
    supportType: 'none',
    appliedRule: 'فشلت المطابقة مع شروط الدعم.'
  };
}
