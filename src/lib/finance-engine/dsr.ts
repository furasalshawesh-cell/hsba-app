import { DsrOutput, DsrRule } from '../../types';

export function mapProductIdToType(productId: string): 'real_estate_only' | 'real_estate_with_new_personal' | 'real_estate_with_existing_personal' | 'personal_only' {
  if (productId === 'personal' || productId === 'personal_only') {
    return 'personal_only';
  }
  if (productId === 'both' || productId === 'real_estate_with_new_personal') {
    return 'real_estate_with_new_personal';
  }
  if (productId === 'real_estate_with_personal_existing' || productId === 'real_estate_with_existing_personal') {
    return 'real_estate_with_existing_personal';
  }
  return 'real_estate_only';
}

export function mapSupportType(supportType: string): 'none' | 'monthly' | 'down_payment' {
  if (supportType === 'monthly') return 'monthly';
  if (supportType === 'down_payment' || supportType === 'downpayment') return 'down_payment';
  return 'none';
}

export function mapCustomerStage(phase: string): 'before_retirement' | 'after_retirement' {
  if (phase === 'after_retirement' || phase === 'retired') return 'after_retirement';
  return 'before_retirement';
}

export function getDsrRule(params: {
  bankId: string;
  productType: 'real_estate_only' | 'real_estate_with_new_personal' | 'real_estate_with_existing_personal' | 'personal_only';
  supportType: 'none' | 'monthly' | 'down_payment';
  customerStage: 'before_retirement' | 'after_retirement';
  dsrRules: DsrRule[];
}): DsrRule {
  const { bankId, productType, supportType, customerStage, dsrRules } = params;

  // 1. Search for a specific rule matching this bank
  let rule = dsrRules.find(
    r => r.bankId === bankId &&
         r.productType === productType &&
         r.supportType === supportType &&
         r.customerStage === customerStage &&
         r.active
  );

  // 2. If not found, use the 'default' rule
  if (!rule) {
    rule = dsrRules.find(
      r => r.bankId === 'default' &&
           r.productType === productType &&
           r.supportType === supportType &&
           r.customerStage === customerStage &&
           r.active
    );
  }

  // 3. If still not found, throw error
  if (!rule) {
    throw new Error(
      `لم يتم العثور على قاعدة DSR مناسبة للمدخلات التالية: البنك (${bankId})، المنتج (${productType})، الدعم (${supportType})، المرحلة (${customerStage}).`
    );
  }

  return rule;
}

export function calculateDSR(params: {
  bankId: string;
  productId: any;
  sectorId: any;
  supportType: any;
  phase: 'before_retirement' | 'after_retirement' | 'retired';
  netSalary: number;
  dsrRules: DsrRule[];
}): DsrOutput {
  const { bankId, productId, supportType, phase, netSalary, dsrRules } = params;

  const productType = mapProductIdToType(productId);
  const normalizedSupport = mapSupportType(supportType);
  const customerStage = mapCustomerStage(phase);

  try {
    const matchedRule = getDsrRule({
      bankId,
      productType,
      supportType: normalizedSupport,
      customerStage,
      dsrRules
    });

    const dsrPercent = matchedRule.dsrPercent;
    const maxInstallment = Math.round(netSalary * (dsrPercent / 100));

    return {
      dsrPercentage: dsrPercent,
      maxInstallment,
      ruleUsed: `تم تطبيق قاعدة الاستقطاع (${matchedRule.bankId === 'default' ? 'الافتراضية العامة' : 'الخاصة بالجهة'}) ونسبة ${dsrPercent}% لمنتج ${productType === 'real_estate_only' ? 'عقاري فقط' : productType === 'real_estate_with_new_personal' ? 'عقاري وشخصي جديد' : productType === 'real_estate_with_existing_personal' ? 'عقاري وشخصي قائم' : 'شخصي فقط'} (${customerStage === 'before_retirement' ? 'موظف نشط' : 'بعد التقاعد'}).`
    };
  } catch (err: any) {
    const defaultDsr = productType === 'personal_only' ? 33 : 55;
    return {
      dsrPercentage: defaultDsr,
      maxInstallment: Math.round(netSalary * (defaultDsr / 100)),
      ruleUsed: `تنبيه: ${err.message || 'لم تتوفر قاعدة محددة'}. تم استخدام نسبة افتراضية مُؤَمَّنَة (${defaultDsr}%).`
    };
  }
}
