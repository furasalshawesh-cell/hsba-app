import { MarginOutput, ProductId, SupportType, SectorId, MarginRule } from '../../types';

export function calculateMargin(params: {
  bankId: string;
  productId: ProductId;
  supportType: SupportType;
  sectorId: SectorId;
  termMonths: number;
  marginRules: MarginRule[];
}): MarginOutput {
  const { bankId, productId, supportType, sectorId, termMonths, marginRules } = params;

  // Filter margins for the current bank and product
  let rules = marginRules.filter(
    r => r.bankId === bankId &&
         r.productId === productId &&
         (r.supportType === 'all' || r.supportType === supportType) &&
         (r.sectorId === 'all' || r.sectorId === sectorId) &&
         r.isActive
  );

  // If no bank-specific rule, look for general rules
  if (rules.length === 0) {
    rules = marginRules.filter(
      r => r.bankId === 'all' &&
           r.productId === productId &&
           r.isActive
    );
  }

  // Find the bracket that contains our termMonths
  const matchedRule = rules.find(
    r => termMonths >= r.fromTermMonths && termMonths <= r.toTermMonths
  );

  if (!matchedRule) {
    // Return last rule or general default
    if (rules.length > 0) {
      const lastRule = rules[rules.length - 1];
      return {
        annualMargin: lastRule.endMargin,
        marginType: 'fixed',
        ruleUsed: `أقصى هامش متاح للبنك: ${lastRule.endMargin}%`
      };
    }
    return {
      annualMargin: 3.50,
      marginType: 'fixed',
      ruleUsed: 'الهامش القياسي الافتراضي للمنصة (3.5%).'
    };
  }

  if (matchedRule.calcType === 'fixed') {
    return {
      annualMargin: matchedRule.startMargin,
      marginType: 'fixed',
      ruleUsed: `هامش ثابت معتمد للتمويل حتى ${matchedRule.toTermMonths} شهرًا بمعدل ${matchedRule.startMargin}%.`
    };
  }

  // Linear Interpolation:
  // margin = startMargin + ((term - fromTerm) / (toTerm - fromTerm)) * (endMargin - startMargin)
  const t = termMonths;
  const tStart = matchedRule.fromTermMonths;
  const tEnd = matchedRule.toTermMonths;
  const mStart = matchedRule.startMargin;
  const mEnd = matchedRule.endMargin;

  let annualMargin = mStart;
  if (tEnd > tStart) {
    annualMargin = mStart + ((t - tStart) / (tEnd - tStart)) * (mEnd - mStart);
  }

  // Round margin to 2 decimal places
  annualMargin = Number(annualMargin.toFixed(3));

  return {
    annualMargin,
    marginType: 'linear',
    ruleUsed: 'تدرج خطي ذكي وفقاً لمدة التمويل الدقيقة.',
    interpolationDetails: `حُسب التدرج الخطي بناءً على المدة المستهدفة (${t} شهرًا)، تدرجاً من هامش ${mStart}% (عند ${tStart} شهرًا) إلى هامش ${mEnd}% (عند ${tEnd} شهرًا).`
  };
}
