import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { 
  Building2, Briefcase, Percent, Calendar, Hourglass, HelpCircle,
  Coins, FileText, ToggleLeft, ToggleRight, Trash2, Plus, RefreshCw, 
  Map, UserPlus, ListOrdered, CheckCircle2, ChevronRight, Calculator,
  Lock, Settings, ShieldAlert, Award, FileSpreadsheet, Users, Edit
} from 'lucide-react';
import { Bank, ProductAcceptance, SectorId, ProductId, MilitaryRank, MarginRule, DsrRule, CalculationStatus, PersonalFinanceRules, SupportType } from '../../types';
import NumericInput from '../calculator/NumericInput';

const formBanksList = [
  { id: 'alahli', nameAr: 'البنك الأهلي السعودي' },
  { id: 'rajhi', nameAr: 'مصرف الراجحي' },
  { id: 'alinma', nameAr: 'مصرف الإنماء' },
  { id: 'fransi', nameAr: 'البنك السعودي الفرنسي' },
  { id: 'bidaya', nameAr: 'بداية لتمويل المنازل' },
  { id: 'albilad', nameAr: 'بنك البلاد' },
  { id: 'alarabi', nameAr: 'البنك العربي الوطني' }
];

const productTypesList = [
  { id: 'real_estate_only', nameAr: 'عقاري فقط' },
  { id: 'personal_only', nameAr: 'شخصي فقط' },
  { id: 'real_estate_with_new_personal', nameAr: 'عقاري + شخصي جديد' },
  { id: 'real_estate_with_existing_personal', nameAr: 'عقاري مع شخصي قائم' }
];

const sectorsList = [
  { id: 'government_civilian', nameAr: 'حكومي مدني' },
  { id: 'military', nameAr: 'عسكري' },
  { id: 'private', nameAr: 'قطاع خاص' },
  { id: 'retired', nameAr: 'متقاعد' }
];

export default function AdminDashboard() {
  const {
    banks, setBanks,
    products, setProducts,
    militaryRanks, setMilitaryRanks,
    salaryRules, setSalaryRules,
    pensionRules, setPensionRules,
    marginRules, setMarginRules,
    dsrRules, setDsrRules,
    supportSettings, setSupportSettings,
    personalRules, setPersonalRules,
    advancedRules, setAdvancedRules,
    calculationLogs, setCalculationLogs,
    userSubscriptions, setUserSubscriptions,
    adminSubPage, setAdminSubPage,
    hasUnsavedChanges, saveChanges, cancelChanges
  } = useAppState();

  // Sidebar navigations
  const menuItems = [
    { id: 'banks', label: 'البنوك المرخصة', icon: Building2 },
    { id: 'products', label: 'المنتجات والقبول', icon: Settings },
    { id: 'sectors', label: 'القطاعات والرتب', icon: Briefcase },
    { id: 'salary', label: 'الراتب الصافي والخصم', icon: Percent },
    { id: 'pension', label: 'صندوق التقاعد والمعاش', icon: Calendar },
    { id: 'terms', label: 'مدد التمويل والحدود', icon: Hourglass },
    { id: 'margins', label: 'هوامش الأرباح البنكية', icon: FileSpreadsheet },
    { id: 'dsr', label: 'حدود الاستقطاع DSR', icon: Calculator },
    { id: 'support', label: 'الدعم السكني (سكني)', icon: Map },
    { id: 'personal', label: 'عقود التمويل الشخصي', icon: Coins },
    { id: 'advanced', label: 'صفحة القواعد المتقدمة', icon: ShieldAlert },
    { id: 'logs', label: 'التشخيص وسجل المعالجة', icon: FileText },
    { id: 'users', label: 'المستخدمون والاشتراكات', icon: UserPlus }
  ];

  // Common UI State helpers
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPension, setEditingPension] = useState<{
    sectorId: SectorId;
    retirementAge: string;
    pensionMultiplier: string;
    isActive: boolean;
  } | null>(null);
  const [editingBankTerm, setEditingBankTerm] = useState<{
    id: string;
    nameAr: string;
    maxTermMonths: string;
    maxAgeAtEnd: string;
    monthsAfterRetirement: string;
    allowAfterRetirement: boolean;
    calendarType: 'hijri' | 'gregorian';
    isActive: boolean;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'refuse' } | null>(null);
  const showToast = (message: string, type: 'success' | 'refuse' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // States to facilitate adding new entries easily in margins
  const [newMarginBank, setNewMarginBank] = useState('alahli');
  const [newMarginStart, setNewMarginStart] = useState(2.5);
  const [newMarginEnd, setNewMarginEnd] = useState(3.5);
  const [newMarginFrom, setNewMarginFrom] = useState(1);
  const [newMarginTo, setNewMarginTo] = useState(300);

  // Filter margins
  const [filterMarginBank, setFilterMarginBank] = useState('all');

  // --- Bank Margin Rules States & Management ---
  const [selectedMarginBank, setSelectedMarginBank] = useState<string>('alahli');
  const [selectedMarginProduct, setSelectedMarginProduct] = useState<ProductId>('real_estate_only');
  const [selectedMarginSupport, setSelectedMarginSupport] = useState<SupportType>('none');
  const [localMargins, setLocalMargins] = useState<Record<number, string>>({
    5: '3.80',
    10: '3.98',
    15: '4.25',
    20: '4.60',
    25: '4.95',
    30: '5.25'
  });
  const [localCalcMethod, setLocalCalcMethod] = useState<'linear' | 'fixed'>('linear');

  // Copy-from states for Cloning inside the same bank
  const [cloningFromProduct, setCloningFromProduct] = useState<ProductId>('real_estate_only');
  const [cloningFromSupport, setCloningFromSupport] = useState<SupportType>('none');

  // Synchronize local states when selection changes or marginRules are canceled/refreshed
  useEffect(() => {
    const relevantRules = marginRules.filter(r => 
      r.bankId === selectedMarginBank && 
      r.productId === selectedMarginProduct && 
      (r.supportType === selectedMarginSupport || r.supportType === 'all')
    );

    let p5 = '3.80';
    let p10 = '3.98';
    let p15 = '4.25';
    let p20 = '4.60';
    let p25 = '4.95';
    let p30 = '5.25';
    let method: 'linear' | 'fixed' = 'linear';

    if (relevantRules.length > 0) {
      const r60 = relevantRules.find(r => r.toTermMonths === 60);
      const r120 = relevantRules.find(r => r.toTermMonths === 120);
      const r180 = relevantRules.find(r => r.toTermMonths === 180);
      const r240 = relevantRules.find(r => r.toTermMonths === 240);
      const r300 = relevantRules.find(r => r.toTermMonths === 300);
      const r360 = relevantRules.find(r => r.toTermMonths === 360);

      if (r60) p5 = r60.endMargin.toString();
      if (r120) {
        p10 = r120.endMargin.toString();
        method = r120.calcType;
      }
      if (r180) p15 = r180.endMargin.toString();
      if (r240) p20 = r240.endMargin.toString();
      if (r300) p25 = r300.endMargin.toString();
      if (r360) p30 = r360.endMargin.toString();
    } else {
      // Fallback matching logic for legacy rule structure ('real_estate' rule format)
      const oldRules = marginRules.filter(r => 
        r.bankId === selectedMarginBank && 
        r.productId === 'real_estate' && 
        (r.supportType === selectedMarginSupport || r.supportType === 'all')
      );
      if (oldRules.length > 0) {
        const r60 = oldRules.find(r => r.toTermMonths === 60);
        const r120 = oldRules.find(r => r.toTermMonths === 120);
        const r180 = oldRules.find(r => r.toTermMonths === 180);
        const r240 = oldRules.find(r => r.toTermMonths === 240);
        const r300 = oldRules.find(r => r.toTermMonths === 300);
        const r360 = oldRules.find(r => r.toTermMonths === 360);

        if (r60) p5 = r60.endMargin.toString();
        if (r120) {
          p10 = r120.endMargin.toString();
          method = r120.calcType;
        }
        if (r180) p15 = r180.endMargin.toString();
        if (r240) p20 = r240.endMargin.toString();
        if (r300) p25 = r300.endMargin.toString();
        if (r360) p30 = r360.endMargin.toString();
      }
    }

    setLocalMargins({
      5: p5,
      10: p10,
      15: p15,
      20: p20,
      25: p25,
      30: p30
    });
    setLocalCalcMethod(method);
  }, [selectedMarginBank, selectedMarginProduct, selectedMarginSupport, marginRules]);

  // General update helper to map 5-30 year points to standard ranges for the calculation engine
  const updateGlobalRulesFromLocal = (marginsRecord: Record<number, string>, method: 'linear' | 'fixed') => {
    const p5 = parseFloat(marginsRecord[5]) || 0;
    const p10 = parseFloat(marginsRecord[10]) || 0;
    const p15 = parseFloat(marginsRecord[15]) || 0;
    const p20 = parseFloat(marginsRecord[20]) || 0;
    const p25 = parseFloat(marginsRecord[25]) || 0;
    const p30 = parseFloat(marginsRecord[30]) || 0;

    const productIdsToFilter = [selectedMarginProduct];
    if (selectedMarginProduct === 'real_estate_with_new_personal') {
      productIdsToFilter.push('real_estate');
      productIdsToFilter.push('both');
    } else if (selectedMarginProduct === 'real_estate_with_existing_personal') {
      productIdsToFilter.push('real_estate_with_personal_existing');
    } else if (selectedMarginProduct === 'real_estate_only') {
      productIdsToFilter.push('real_estate');
    }

    const normSupport = selectedMarginSupport === 'down_payment' ? 'downpayment' : selectedMarginSupport;

    // Filter out existing rules matching this combination to allow clean overwrite
    const remainingRules = marginRules.filter(r => {
      const matchesTarget = r.bankId === selectedMarginBank &&
                            productIdsToFilter.includes(r.productId) &&
                            (r.supportType === normSupport || r.supportType === 'all');
      return !matchesTarget;
    });

    const newRulesForThisCombo: MarginRule[] = [];
    
    // Generate rules for each of the products we want to map for this selection
    productIdsToFilter.forEach(pId => {
      const definitions = [
        { from: 0, to: 60, start: p5, end: p5, calcType: 'fixed' as const },
        { from: 61, to: 120, start: p5, end: p10, calcType: method },
        { from: 121, to: 180, start: p10, end: p15, calcType: method },
        { from: 181, to: 240, start: p15, end: p20, calcType: method },
        { from: 241, to: 300, start: p20, end: p25, calcType: method },
        { from: 301, to: 360, start: p25, end: p30, calcType: method },
        { from: 361, to: 9999, start: p30, end: p30, calcType: 'fixed' as const }
      ];

      definitions.forEach((def, index) => {
        newRulesForThisCombo.push({
          id: `gen_margin_${selectedMarginBank}_${pId}_${normSupport}_t${def.from}_${def.to}_${index}`,
          bankId: selectedMarginBank,
          productId: pId as ProductId,
          supportType: normSupport as any,
          sectorId: 'all',
          fromTermMonths: def.from,
          toTermMonths: def.to,
          startMargin: def.start,
          endMargin: def.end,
          calcType: def.calcType,
          isActive: true
        });
      });
    });

    setMarginRules([...remainingRules, ...newRulesForThisCombo]);
  };

  const handleMarginLocalChange = (year: number, value: string) => {
    setLocalMargins(prev => ({ ...prev, [year]: value }));
  };

  const handleMarginBlur = (year: number, textValue: string) => {
    updateGlobalRulesFromLocal({
      ...localMargins,
      [year]: textValue
    }, localCalcMethod);
  };

  const handleCalcMethodChange = (method: 'linear' | 'fixed') => {
    setLocalCalcMethod(method);
    updateGlobalRulesFromLocal(localMargins, method);
  };

  const handleCloneLocal = () => {
    if (cloningFromProduct === selectedMarginProduct && cloningFromSupport === selectedMarginSupport) {
      showToast("لا يمكن النسخ من وإلى نفس الحالة الحالية.", "refuse");
      return;
    }

    const confirmCopy = window.confirm("سيتم استبدال قيم الجدول الحالي بقيم الجدول المصدر. هل أنت متأكد؟");
    if (!confirmCopy) return;

    // Look up the rules for the source product and supportType inside the SAME bank
    const sourceRules = marginRules.filter(r => 
      r.bankId === selectedMarginBank && 
      r.productId === cloningFromProduct && 
      (r.supportType === cloningFromSupport || r.supportType === 'all')
    );

    let p5 = '3.80';
    let p10 = '3.98';
    let p15 = '4.25';
    let p20 = '4.60';
    let p25 = '4.95';
    let p30 = '5.25';
    let method: 'linear' | 'fixed' = 'linear';

    if (sourceRules.length > 0) {
      const r60 = sourceRules.find(r => r.toTermMonths === 60);
      const r120 = sourceRules.find(r => r.toTermMonths === 120);
      const r180 = sourceRules.find(r => r.toTermMonths === 180);
      const r240 = sourceRules.find(r => r.toTermMonths === 240);
      const r300 = sourceRules.find(r => r.toTermMonths === 300);
      const r360 = sourceRules.find(r => r.toTermMonths === 360);

      if (r60) p5 = r60.endMargin.toString();
      if (r120) {
        p10 = r120.endMargin.toString();
        method = r120.calcType;
      }
      if (r180) p15 = r180.endMargin.toString();
      if (r240) p20 = r240.endMargin.toString();
      if (r300) p25 = r300.endMargin.toString();
      if (r360) p30 = r360.endMargin.toString();
    }

    const newCopiedMargins = {
      5: p5,
      10: p10,
      15: p15,
      20: p20,
      25: p25,
      30: p30
    };

    setLocalMargins(newCopiedMargins);
    setLocalCalcMethod(method);

    // Apply instantly to the global rules of the current selected state to cause reactive save state
    updateGlobalRulesFromLocal(newCopiedMargins, method);

    showToast("تم استنساخ الجدول بنجاح", "success");
  };

  // --- DSR Rules States & Management ---
  const [filterDsrBank, setFilterDsrBank] = useState<string>('all');
  const [filterDsrProduct, setFilterDsrProduct] = useState<string>('all');
  const [filterDsrSupport, setFilterDsrSupport] = useState<string>('all');
  const [filterDsrStage, setFilterDsrStage] = useState<string>('all');
  const [filterDsrStatus, setFilterDsrStatus] = useState<string>('all');

  const [isDsrModalOpen, setIsDsrModalOpen] = useState(false);
  const [editingDsrRule, setEditingDsrRule] = useState<DsrRule | null>(null);

  // Form states for adding/editing a DSR Rule
  const [formDsrBankId, setFormDsrBankId] = useState<string>('default');
  const [formDsrProductType, setFormDsrProductType] = useState<'real_estate_only' | 'real_estate_with_new_personal' | 'real_estate_with_existing_personal' | 'personal_only'>('real_estate_only');
  const [formDsrSupportType, setFormDsrSupportType] = useState<'none' | 'monthly' | 'down_payment'>('none');
  const [formDsrCustomerStage, setFormDsrCustomerStage] = useState<'before_retirement' | 'after_retirement'>('before_retirement');
  const [formDsrPercentStr, setFormDsrPercentStr] = useState<string>('');
  const [formDsrDeductExisting, setFormDsrDeductExisting] = useState<boolean>(true);
  const [formDsrActive, setFormDsrActive] = useState<boolean>(true);
  const [formDsrError, setFormDsrError] = useState<string>('');

  const DSR_BANKS = [
    { id: 'default', nameAr: 'الافتراضي العام (default)' },
    { id: 'alahli', nameAr: 'البنك الأهلي السعودي (alahli)' },
    { id: 'rajhi', nameAr: 'مصرف الراجحي (rajhi)' },
    { id: 'alinma', nameAr: 'مصرف الإنماء (alinma)' },
    { id: 'fransi', nameAr: 'البنك السعودي الفرنسي (fransi)' },
    { id: 'bidaya', nameAr: 'بداية لتمويل المنازل (bidaya)' },
    { id: 'albilad', nameAr: 'بنك البلاد (albilad)' },
    { id: 'alarabi', nameAr: 'البنك العربي الوطني (alarabi)' }
  ];

  const DSR_PRODUCT_TYPES = [
    { id: 'real_estate_only', nameAr: 'عقاري فقط' },
    { id: 'real_estate_with_new_personal', nameAr: 'عقاري + شخصي جديد' },
    { id: 'real_estate_with_existing_personal', nameAr: 'عقاري مع شخصي قائم' },
    { id: 'personal_only', nameAr: 'شخصي فقط' }
  ];

  const DSR_SUPPORT_TYPES = [
    { id: 'none', nameAr: 'غير مدعوم' },
    { id: 'monthly', nameAr: 'دعم شهري' },
    { id: 'down_payment', nameAr: 'دعم دفعة' }
  ];

  const DSR_CUSTOMER_STAGES = [
    { id: 'before_retirement', nameAr: 'موظف نشط (قبل التقاعد)' },
    { id: 'after_retirement', nameAr: 'متقاعد (بعد التقاعد)' }
  ];

  const handleOpenAddDsrModal = () => {
    setEditingDsrRule(null);
    setFormDsrBankId('default');
    setFormDsrProductType('real_estate_only');
    setFormDsrSupportType('none');
    setFormDsrCustomerStage('before_retirement');
    setFormDsrPercentStr('');
    setFormDsrDeductExisting(true);
    setFormDsrActive(true);
    setFormDsrError('');
    setIsDsrModalOpen(true);
  };

  const handleOpenEditDsrModal = (rule: DsrRule) => {
    setEditingDsrRule(rule);
    setFormDsrBankId(rule.bankId);
    setFormDsrProductType(rule.productType);
    setFormDsrSupportType(rule.supportType);
    setFormDsrCustomerStage(rule.customerStage);
    setFormDsrPercentStr(String(rule.dsrPercent));
    setFormDsrDeductExisting(rule.deductExistingObligations);
    setFormDsrActive(rule.active);
    setFormDsrError('');
    setIsDsrModalOpen(true);
  };

  const handleDeleteDsrRule = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف قاعدة الاستقطاع هذه؟')) {
      setDsrRules(prev => prev.filter(r => r.id !== id));
      showToast('تم حذف قاعدة الاستقطاع بنجاح!', 'success');
    }
  };

  const handleToggleDsrRuleActive = (id: string) => {
    setDsrRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    showToast('تم تحديث حالة تفعيل القاعدة بنجاح!', 'success');
  };

  const handleSaveDsrForm = () => {
    const val = parseFloat(formDsrPercentStr);
    if (isNaN(val) || val < 0 || val > 100) {
      setFormDsrError('يرجى إدخال نسبة استقطاع صحيحة بين 0 و 100 %');
      return;
    }

    if (formDsrProductType === 'personal_only' && formDsrSupportType !== 'none') {
      setFormDsrError('تنبيه: لا يمكن اختيار دعم سكني مع منتج التمويل الشخصي فقط.');
      return;
    }

    const ruleId = editingDsrRule ? editingDsrRule.id : `dsr_rule_${Date.now()}`;
    const newRule: DsrRule = {
      id: ruleId,
      bankId: formDsrBankId,
      productType: formDsrProductType,
      supportType: formDsrSupportType,
      customerStage: formDsrCustomerStage,
      dsrPercent: val,
      deductExistingObligations: formDsrDeductExisting,
      active: formDsrActive
    };

    if (editingDsrRule) {
      setDsrRules(prev => prev.map(r => r.id === editingDsrRule.id ? newRule : r));
      showToast('تم تعديل قاعدة DSR بنجاح!', 'success');
    } else {
      setDsrRules(prev => [newRule, ...prev]);
      showToast('تم إضافة قاعدة DSR جديدة بنجاح!', 'success');
    }

    setIsDsrModalOpen(false);
  };

  // --- Products Acceptance Rules States & Management ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductAcceptance | null>(null);

  const [formBankId, setFormBankId] = useState('alahli');
  const [formProductId, setFormProductId] = useState<ProductId>('real_estate_only');
  const [formMinSalary, setFormMinSalary] = useState('');
  const [formMinAge, setFormMinAge] = useState('');
  const [formMaxAge, setFormMaxAge] = useState('');
  const [formMinServiceMonths, setFormMinServiceMonths] = useState('');
  
  const [formAllowUnsupported, setFormAllowUnsupported] = useState(true);
  const [formAllowMonthlySupport, setFormAllowMonthlySupport] = useState(true);
  const [formAllowDownpaymentSupport, setFormAllowDownpaymentSupport] = useState(true);
  
  const [formAllowedSectors, setFormAllowedSectors] = useState<SectorId[]>(['government_civilian', 'military', 'private']);
  const [formRejectionMessage, setFormRejectionMessage] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  // --- Personal Finance Rules States & Management ---
  const [isPfModalOpen, setIsPfModalOpen] = useState(false);
  const [editingPfRule, setEditingPfRule] = useState<PersonalFinanceRules | null>(null);

  const [formPfBankId, setFormPfBankId] = useState('all');
  const [formPfPathType, setFormPfPathType] = useState<'personal_only' | 'real_estate_with_new_personal'>('personal_only');
  const [formPfCustomerStatus, setFormPfCustomerStatus] = useState<'active_employee' | 'retired'>('active_employee');
  const [formPfDsr, setFormPfDsr] = useState('33');
  const [formPfTerm, setFormPfTerm] = useState('60');
  const [formPfCoeff, setFormPfCoeff] = useState('50.42');
  const [formPfMargin, setFormPfMargin] = useState('2.50');
  const [formPfMinSalary, setFormPfMinSalary] = useState('4000');
  const [formPfCalcMethod, setFormPfCalcMethod] = useState<'multiplier' | 'pmt'>('multiplier');
  const [formPfActive, setFormPfActive] = useState(true);
  const [pfError, setPfError] = useState('');

  const openAddPfModal = () => {
    setEditingPfRule(null);
    setFormPfBankId('all');
    setFormPfPathType('personal_only');
    setFormPfCustomerStatus('active_employee');
    setFormPfDsr('33');
    setFormPfTerm('60');
    setFormPfCoeff('50.42');
    setFormPfMargin('2.50');
    setFormPfMinSalary('4000');
    setFormPfCalcMethod('multiplier');
    setFormPfActive(true);
    setPfError('');
    setIsPfModalOpen(true);
  };

  const openEditPfModal = (rule: PersonalFinanceRules) => {
    setEditingPfRule(rule);
    setFormPfBankId(rule.bankId || 'all');
    setFormPfPathType(rule.pathType || 'personal_only');
    setFormPfCustomerStatus(rule.customerStatus || 'active_employee');
    setFormPfDsr(String(rule.dsrPercentage ?? ''));
    setFormPfTerm(String(rule.termMonths ?? ''));
    setFormPfCoeff(String(rule.financeCoefficient ?? ''));
    setFormPfMargin(String(rule.annualMargin ?? ''));
    setFormPfMinSalary(String(rule.minSalary ?? ''));
    setFormPfCalcMethod(rule.calculationMethod || 'multiplier');
    setFormPfActive(rule.isActive !== false);
    setPfError('');
    setIsPfModalOpen(true);
  };

  const savePfRule = () => {
    // 1. Clean input
    const cleanDsrStr = parseArabicAndEnglishNumber(formPfDsr).replace(/,/g, '').trim();
    const cleanTermStr = parseArabicAndEnglishNumber(formPfTerm).replace(/,/g, '').trim();
    const cleanCoeffStr = parseArabicAndEnglishNumber(formPfCoeff).replace(/,/g, '').trim();
    const cleanMarginStr = parseArabicAndEnglishNumber(formPfMargin).replace(/,/g, '').trim();
    const cleanSalaryStr = parseArabicAndEnglishNumber(formPfMinSalary).replace(/,/g, '').trim();

    if (!cleanDsrStr || !cleanTermStr || !cleanCoeffStr || !cleanMarginStr || !cleanSalaryStr) {
      setPfError('جميع الحقول الرقمية مطلوبة.');
      return;
    }

    const dsrNum = Number(cleanDsrStr);
    const termNum = Number(cleanTermStr);
    const coeffNum = Number(cleanCoeffStr);
    const marginNum = Number(cleanMarginStr);
    const salaryNum = Number(cleanSalaryStr);

    if (isNaN(dsrNum) || isNaN(termNum) || isNaN(coeffNum) || isNaN(marginNum) || isNaN(salaryNum)) {
      setPfError('الرجاء التأكد من إدخال قيم رقمية صحيحة.');
      return;
    }

    const ruleData: PersonalFinanceRules = {
      id: editingPfRule?.id || `rule-${formPfBankId}-${formPfPathType}-${formPfCustomerStatus}-${Date.now()}`,
      bankId: formPfBankId,
      sectorId: formPfCustomerStatus === 'retired' ? 'retired' : 'all',
      dsrPercentage: dsrNum,
      termMonths: termNum,
      financeCoefficient: coeffNum,
      annualMargin: marginNum,
      minSalary: salaryNum,
      minAge: editingPfRule?.minAge ?? 18,
      maxAge: editingPfRule?.maxAge ?? 65,
      retireeDsrPercentage: formPfCustomerStatus === 'retired' ? dsrNum : 25,
      isActive: formPfActive,
      calculationMethod: formPfCalcMethod,
      pathType: formPfPathType,
      customerStatus: formPfCustomerStatus
    };

    if (editingPfRule) {
      // Editing Mode
      setPersonalRules(prev => prev.map(r => (r.id === editingPfRule.id || (!r.id && r.bankId === editingPfRule.bankId && r.pathType === editingPfRule.pathType && r.customerStatus === editingPfRule.customerStatus)) ? ruleData : r));
      showToast('تم تحديث قاعدة التمويل الشخصي بنجاح!', 'success');
    } else {
      // Adding Mode - check for duplicate first to prevent issues
      const exists = personalRules.some(r => r.bankId === formPfBankId && r.pathType === formPfPathType && r.customerStatus === formPfCustomerStatus);
      if (exists) {
        setPfError('توجد بالفعل قاعدة مسجلة لنفس البنك، المسار، وحالة العميل.');
        return;
      }
      setPersonalRules(prev => [...prev, ruleData]);
      showToast('تم إضافة قاعدة التمويل الشخصي بنجاح!', 'success');
    }

    setIsPfModalOpen(false);
    setEditingPfRule(null);
  };

  const deletePfRule = (ruleId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه القاعدة للتمويل الشخصي؟')) {
      setPersonalRules(prev => prev.filter(r => r.id !== ruleId));
      showToast('تم حذف القاعدة بنجاح!', 'success');
    }
  };

  // --- Sectors States & Management ---
  const [sectors, setSectors] = useState([
    { id: 'government_civilian', nameAr: 'حكومي مدني', isActive: true, notes: 'لا يحتاج رتبة' },
    { id: 'military', nameAr: 'عسكري', isActive: true, notes: 'يحتاج اختيار رتبة' },
    { id: 'private', nameAr: 'قطاع خاص', isActive: true, notes: 'لا يحتاج رتبة' },
    { id: 'retired', nameAr: 'متقاعد', isActive: true, notes: 'لا يحتاج رتبة' }
  ]);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<{ id: string; nameAr: string; isActive: boolean; notes: string } | null>(null);
  const [formSectorNameAr, setFormSectorNameAr] = useState('');
  const [formSectorIsActive, setFormSectorIsActive] = useState(true);

  const openEditSectorModal = (sec: { id: string; nameAr: string; isActive: boolean; notes: string }) => {
    setEditingSector(sec);
    setFormSectorNameAr(sec.nameAr);
    setFormSectorIsActive(sec.isActive);
    setIsSectorModalOpen(true);
  };

  const saveSector = () => {
    if (!formSectorNameAr.trim()) {
      showToast('يرجى إدخال اسم القطاع', 'refuse');
      return;
    }
    setSectors(prev => prev.map(s => s.id === editingSector?.id ? { ...s, nameAr: formSectorNameAr, isActive: formSectorIsActive } : s));
    setIsSectorModalOpen(false);
    showToast('تم تحديث القطاع بنجاح!', 'success');
  };

  // --- Military Ranks States & Management ---
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<MilitaryRank | null>(null);
  const [formRankNameAr, setFormRankNameAr] = useState('');
  const [formRankId, setFormRankId] = useState('');
  const [formRankRetirementAge, setFormRankRetirementAge] = useState('');
  const [formRankDisplayOrder, setFormRankDisplayOrder] = useState('');
  const [formRankIsActive, setFormRankIsActive] = useState(true);
  const [rankError, setRankError] = useState('');

  const openEditRankModal = (rank: MilitaryRank) => {
    setEditingRank(rank);
    setFormRankNameAr(rank.nameAr);
    setFormRankId(rank.id);
    setFormRankRetirementAge(String(rank.retirementAge ?? ''));
    setFormRankDisplayOrder(String(rank.displayOrder ?? ''));
    setFormRankIsActive(rank.isActive !== false);
    setRankError('');
    setIsRankModalOpen(true);
  };

  const saveRank = () => {
    if (!formRankNameAr.trim()) {
      setRankError('اسم الرتبة مطلوب.');
      return;
    }
    const ageStr = parseArabicAndEnglishNumber(formRankRetirementAge).trim();
    const orderStr = parseArabicAndEnglishNumber(formRankDisplayOrder).trim();

    if (!ageStr || !orderStr) {
      setRankError('سن التقاعد وترتيب العرض حقول مطلوبة.');
      return;
    }

    const ageNum = Number(ageStr);
    const orderNum = Number(orderStr);

    if (isNaN(ageNum) || isNaN(orderNum)) {
      setRankError('الرجاء إدخال أرقام صحيحة لسن التقاعد وترتيب العرض.');
      return;
    }

    const updatedRank: MilitaryRank = {
      ...editingRank!,
      nameAr: formRankNameAr,
      id: formRankId,
      retirementAge: ageNum,
      displayOrder: orderNum,
      isActive: formRankIsActive
    };

    setMilitaryRanks(prev => prev.map(r => r.id === editingRank?.id ? updatedRank : r));
    setIsRankModalOpen(false);
    showToast('تم تحديث الرتبة العسكرية بنجاح!', 'success');
  };

  // Filtering states for admin table
  const [filterBank, setFilterBank] = useState('all');
  const [filterProductType, setFilterProductType] = useState('all');
  const [filterActiveStatus, setFilterActiveStatus] = useState('all');
  const [filterSupport, setFilterSupport] = useState('all');

  const openAddProductModal = () => {
    try {
      setEditingProduct(null);
      setFormBankId('alahli');
      setFormProductId('real_estate_only');
      setFormMinSalary('');
      setFormMinAge('');
      setFormMaxAge('');
      setFormMinServiceMonths('');
      setFormAllowUnsupported(true);
      setFormAllowMonthlySupport(true);
      setFormAllowDownpaymentSupport(true);
      setFormAllowedSectors(['government_civilian', 'military', 'private', 'retired']);
      setFormRejectionMessage('');
      setFormIsActive(true);
      setFormError('');
      setIsProductModalOpen(true);
    } catch (e) {
      console.error("حدث خطأ أثناء فتح نموذج الإضافة:", e);
    }
  };

  const parseArabicAndEnglishNumber = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return "";
    let str = String(value).trim();
    // Convert Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) to english
    const arabicIndic = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    for (let i = 0; i < 10; i++) {
      str = str.replace(arabicIndic[i], i.toString());
    }
    // Convert Persian numerals (۰۱۲۳۴۵۶۷۸۹) to english
    const persian = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /٩/g];
    for (let i = 0; i < 10; i++) {
      str = str.replace(persian[i], i.toString());
    }
    return str;
  };

  const openEditProductModal = (rule: ProductAcceptance) => {
    try {
      console.log("Safe copy initialization starting for edit...");
      const selectedRule = { ...rule };

      const minSalaryVal = selectedRule.minSalary !== undefined && selectedRule.minSalary !== null ? String(selectedRule.minSalary) : "";
      const minAgeVal = selectedRule.minAge !== undefined && selectedRule.minAge !== null ? String(selectedRule.minAge) : "";
      const maxAgeVal = selectedRule.maxAge !== undefined && selectedRule.maxAge !== null ? String(selectedRule.maxAge) : "";
      const minServiceVal = selectedRule.minServiceMonths !== undefined && selectedRule.minServiceMonths !== null ? String(selectedRule.minServiceMonths) : "";

      let allowedSectors: SectorId[] = [];
      if (Array.isArray(selectedRule.allowedSectors)) {
        allowedSectors = [...selectedRule.allowedSectors];
      } else if (typeof selectedRule.allowedSectors === 'string') {
        try {
          const parsed = JSON.parse(selectedRule.allowedSectors);
          if (Array.isArray(parsed)) allowedSectors = parsed;
        } catch {
          allowedSectors = [selectedRule.allowedSectors as any];
        }
      }

      // Safe fallback definitions based on User Intent Checklist:
      const minSalary = parseArabicAndEnglishNumber(minSalaryVal);
      const minAge = parseArabicAndEnglishNumber(minAgeVal);
      const maxAge = parseArabicAndEnglishNumber(maxAgeVal);
      const minServiceMonths = parseArabicAndEnglishNumber(minServiceVal);
      const rejectionMessage = selectedRule.defaultRejectionMessage || "";
      const active = selectedRule.isActive !== false;

      // Unused check but defined to fulfill checklist Requirement 8
      const allowedSupportTypes = Array.isArray((selectedRule as any).allowedSupportTypes) ? (selectedRule as any).allowedSupportTypes : [];

      setEditingProduct(selectedRule);
      setFormBankId(selectedRule.bankId || 'alahli');
      setFormProductId(selectedRule.productId || 'real_estate_only');
      setFormMinSalary(minSalary);
      setFormMinAge(minAge);
      setFormMaxAge(maxAge);
      setFormMinServiceMonths(minServiceMonths);
      setFormAllowUnsupported(selectedRule.allowUnsupported !== false);
      setFormAllowMonthlySupport(selectedRule.allowMonthlySupport !== false);
      setFormAllowDownpaymentSupport(selectedRule.allowDownpaymentSupport !== false);
      setFormAllowedSectors(allowedSectors);
      setFormRejectionMessage(rejectionMessage);
      setFormIsActive(active);
      setFormError('');
      setIsProductModalOpen(true);
      console.log("Edit product modal successfully opened without changing the original rule reference.");
    } catch (e) {
      console.error("Critical error in openEditProductModal:", e);
      setFormError("حدث خطأ غير متوقع أثناء تحميل بيانات التعديل.");
    }
  };

  const closeProductModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(false);
  };

  const deleteProduct = (id: string) => {
    try {
      if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه القاعدة؟')) {
        setProducts(prev => prev.filter(p => p.id !== id));
        showToast('تم حذف قاعدة القبول بنجاح!', 'success');
      }
    } catch (e) {
      console.error("Error deleting product:", e);
    }
  };

  const saveProductRule = () => {
    try {
      if (!formBankId) {
        setFormError('يرجى اختيار البنك.');
        return;
      }
      if (!formProductId) {
        setFormError('يرجى اختيار نوع المنتج.');
        return;
      }

      // Safe clean input reading - converting Arabic numbers and commas
      const cleanSalaryStr = parseArabicAndEnglishNumber(formMinSalary).replace(/,/g, '').trim();
      const cleanMinAgeStr = parseArabicAndEnglishNumber(formMinAge).replace(/,/g, '').trim();
      const cleanMaxAgeStr = parseArabicAndEnglishNumber(formMaxAge).replace(/,/g, '').trim();
      const cleanServiceStr = parseArabicAndEnglishNumber(formMinServiceMonths).replace(/,/g, '').trim();

      if (cleanSalaryStr === '') {
        setFormError('الحد الأدنى للراتب مطلوب.');
        return;
      }
      if (cleanMinAgeStr === '') {
        setFormError('الحد الأدنى للعمر مطلوب.');
        return;
      }
      if (cleanMaxAgeStr === '') {
        setFormError('الحد الأقصى للعمر مطلوب.');
        return;
      }
      if (cleanServiceStr === '') {
        setFormError('الحد الأدنى لخدمة الأشهر مطلوب.');
        return;
      }

      const salaryNum = Number(cleanSalaryStr);
      const minAgeNum = Number(cleanMinAgeStr);
      const maxAgeNum = Number(cleanMaxAgeStr);
      const serviceNum = Number(cleanServiceStr);

      if (isNaN(salaryNum) || salaryNum < 0) {
        setFormError('يرجى إدخال قيمة صحيحة للراتب الأدنى (0 أو أكبر).');
        return;
      }
      if (isNaN(minAgeNum) || minAgeNum < 18) {
        setFormError('الحد الأدنى للعمر يجب ألا يقل عن 18 سنة.');
        return;
      }
      if (isNaN(maxAgeNum) || maxAgeNum < minAgeNum) {
        setFormError('الحد الأقصى للعمر يجب أن يكون أكبر من أو يساوي الحد الأدنى.');
        return;
      }
      if (isNaN(serviceNum) || serviceNum < 0) {
        setFormError('أقل مدة خدمة يجب ألا تقل عن 0.');
        return;
      }

      const safeAllowedSectors = Array.isArray(formAllowedSectors) ? formAllowedSectors : [];
      if (safeAllowedSectors.length === 0) {
        setFormError('يرجى اختيار قطاع واحد مسموح به على الأقل.');
        return;
      }
      if (!formRejectionMessage.trim()) {
        setFormError('رسالة الرفض لا يمكن أن تكون فارغة.');
        return;
      }

      const payload: ProductAcceptance = {
        id: editingProduct ? editingProduct.id : `prod_rule_${Date.now()}`,
        bankId: formBankId,
        productId: formProductId,
        minSalary: salaryNum,
        minAge: minAgeNum,
        maxAge: maxAgeNum,
        minServiceMonths: serviceNum,
        allowUnsupported: formAllowUnsupported,
        allowMonthlySupport: formAllowMonthlySupport,
        allowDownpaymentSupport: formAllowDownpaymentSupport,
        allowedSectors: safeAllowedSectors,
        defaultRejectionMessage: formRejectionMessage,
        isActive: formIsActive,
        allowAfterRetirement: safeAllowedSectors.includes('retired')
      };

      if (editingProduct) {
        setProducts(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          return arr.map(p => p.id === editingProduct.id ? payload : p);
        });
        showToast('تم تعديل قاعدة القبول بنجاح!', 'success');
      } else {
        setProducts(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          return [payload, ...arr];
        });
        showToast('تم إضافة قاعدة القبول بنجاح!', 'success');
      }

      setEditingProduct(null);
      setIsProductModalOpen(false);
    } catch (e) {
      console.error("Critical error in saveProductRule:", e);
      setFormError("حدث خطأ غير متوقع أثناء حفظ قاعدة القبول.");
    }
  };

  // --- ACTIONS ---

  // Toggle active helper
  const toggleBankActive = (id: string) => {
    setBanks(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
  };

  const toggleProductActive = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const toggleMarginActive = (id: string) => {
    setMarginRules(prev => prev.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
  };

  const deleteMargin = (id: string) => {
    setMarginRules(prev => prev.filter(m => m.id !== id));
  };

  const addMarginRule = () => {
    const newRule: MarginRule = {
      id: `m_rule_${Date.now()}`,
      bankId: newMarginBank,
      productId: 'real_estate',
      supportType: 'all',
      sectorId: 'all',
      fromTermMonths: newMarginFrom,
      toTermMonths: newMarginTo,
      startMargin: newMarginStart,
      endMargin: newMarginEnd,
      calcType: 'linear',
      isActive: true
    };
    setMarginRules(prev => [newRule, ...prev]);
    showToast('تم إضافة نطاق الفائدة ومعدل الهامش بنجاح!', 'success');
  };

  const cloneMargins = (fromBank: string, toBank: string) => {
    const parentRules = marginRules.filter(m => m.bankId === fromBank);
    const clonedRules = parentRules.map((r, i) => ({
      ...r,
      id: `cloned_${r.id}_${Date.now()}_${i}`,
      bankId: toBank
    }));
    setMarginRules(prev => [...clonedRules, ...prev]);
    showToast(`تم نسخ جدول هوامش الفائدة من ${fromBank} إلى ${toBank} بنجاح!`, 'success');
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 ${hasUnsavedChanges ? 'pb-32' : ''}`}>
      
      {/* 1. RIGHT SIDEBAR */}
      <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-[#E5E7EB] p-4 h-fit">
        <h3 className="font-extrabold text-sm text-[#111827] px-3 pb-3 mb-3 border-b border-[#F1F5F9] flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#0057B8]" />
          <span>إعدادات النظام والحسبة</span>
        </h3>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`admin-nav-${item.id}`}
                onClick={() => {
                  if (hasUnsavedChanges) {
                    const confirmLeave = window.confirm("لديك تغييرات غير محفوظة، هل تريد المتابعة؟");
                    if (confirmLeave) {
                      setAdminSubPage(item.id);
                    }
                  } else {
                    setAdminSubPage(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right text-xs font-semibold cursor-pointer transition-all ${
                  adminSubPage === item.id
                    ? 'bg-[#0057B8]/5 text-[#0057B8] font-bold border-r-4 border-[#0057B8]'
                    : 'text-[#6B7280] hover:bg-slate-50 hover:text-[#111827]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 2. MAIN SUB-PAGE VIEWPORT */}
      <main className="flex-1 bg-white rounded-3xl border border-gray-200 p-6 shadow-xs overflow-x-hidden min-h-[500px]">
        
        {toast && (
          <div className={`mb-6 p-4 border rounded-xl text-xs font-bold flex justify-between items-center transition-all animate-fade-in ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="font-extrabold text-sm px-1.5 opacity-75 hover:opacity-100 cursor-pointer">×</button>
          </div>
        )}

        {/* Unsaved Changes Banner Bar */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-white py-4 px-6 md:px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-50 animate-fade-in">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-bold font-sans text-right">لديك تغييرات غير محفوظة في الإعدادات الحالية</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  id="admin-cancel-btn"
                  onClick={() => {
                    cancelChanges();
                    showToast('تم إلغاء التعديلات بنجاح واستعادة القيم السابقة', 'success');
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-500"
                >
                  إلغاء التعديلات
                </button>
                <button
                  type="button"
                  id="admin-save-btn"
                  onClick={() => {
                    saveChanges();
                    showToast('تم حفظ التغييرات بنجاح', 'success');
                  }}
                  className="px-5 py-2 bg-[#0057B8] hover:bg-[#004bb0] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer border border-[#0057B8]"
                >
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* VIEW 1: BANKS MANAGE */}
        {adminSubPage === 'banks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">البنوك السعودية النشطة</h2>
                <p className="text-xs text-[#6B7280]">إدارة معايير السن الأقصى لجهات الإقراض ومدة التمويل.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs font-semibold text-[#111827]">
                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-gray-500">
                  <tr>
                    <th className="p-3">اسم البنك</th>
                    <th className="p-3">الترميز (ID)</th>
                    <th className="p-3">أقصى تمويل بالشهور</th>
                    <th className="p-3">أقصى عمر لانتهاء التمويل</th>
                    <th className="p-3 text-center">خدمة المتقاعدين</th>
                    <th className="p-3 text-center">حالة البنك</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {banks.map((bank) => (
                    <tr key={bank.id} className="hover:bg-slate-50/50">
                      <td className="p-3 flex items-center gap-3 font-bold">
                        <div className={`w-8 h-8 rounded bg-gradient-to-br ${bank.logoColor} text-white flex items-center justify-center font-bold text-[10px]`}>
                          {bank.logoText}
                        </div>
                        <span>{bank.nameAr}</span>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-gray-500">{bank.id}</td>
                      <td className="p-3">
                        <NumericInput
                          id={`bank-term-${bank.id}`}
                          value={bank.maxTermMonths}
                          onChange={(val) => setBanks(prev => prev.map(b => b.id === bank.id ? { ...b, maxTermMonths: val } : b))}
                          allowDecimals={false}
                          className="w-20 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-center font-semibold"
                        />
                      </td>
                      <td className="p-3">
                        <NumericInput
                          id={`bank-age-${bank.id}`}
                          value={bank.maxAgeAtEnd}
                          onChange={(val) => setBanks(prev => prev.map(b => b.id === bank.id ? { ...b, maxAgeAtEnd: val } : b))}
                          allowDecimals={false}
                          className="w-16 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-center font-semibold"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${bank.allowAfterRetirement ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {bank.allowAfterRetirement ? 'متاح' : 'غير متاح'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          id={`bank-toggle-${bank.id}`}
                          onClick={() => toggleBankActive(bank.id)}
                          className="text-[#0057B8] hover:opacity-80 transition cursor-pointer"
                        >
                          {bank.isActive ? (
                            <ToggleRight className="w-8 h-8 text-[#0057B8]" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: PRODUCTS ACCEPTANCE */}
        {adminSubPage === 'products' && (
          <div className="space-y-6 animate-fade-in text-right" dir="rtl">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900">المنتجات والقبول</h2>
                <p className="text-xs text-gray-500">
                  إدارة منتجات البنوك وشروط قبول العملاء حسب الراتب والعمر والخدمة والدعم.
                </p>
              </div>
              <button
                id="btn-add-product-rule"
                onClick={openAddProductModal}
                className="inline-flex items-center gap-2 bg-[#0057B8] hover:bg-[#00418A] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm shadow-[#0057B8]/20 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قاعدة قبول</span>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filter Bank */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">تصفية حسب البنك:</label>
                <select
                  id="filter-bank-select"
                  value={filterBank}
                  onChange={(e) => setFilterBank(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                >
                  <option value="all">كل البنوك</option>
                  {formBanksList.map(b => (
                    <option key={b.id} value={b.id}>{b.nameAr}</option>
                  ))}
                </select>
              </div>

              {/* Filter Product Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">نوع المنتج:</label>
                <select
                  id="filter-product-select"
                  value={filterProductType}
                  onChange={(e) => setFilterProductType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                >
                  <option value="all">كل المنتجات</option>
                  {productTypesList.map(type => (
                    <option key={type.id} value={type.id}>{type.nameAr}</option>
                  ))}
                </select>
              </div>

              {/* Filter Active Status */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">الحالة:</label>
                <select
                  id="filter-status-select"
                  value={filterActiveStatus}
                  onChange={(e) => setFilterActiveStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">مفعل فقط</option>
                  <option value="inactive">غير مفعل</option>
                </select>
              </div>

              {/* Filter Support Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-600">نوع الدعم المسموح:</label>
                <select
                  id="filter-support-select"
                  value={filterSupport}
                  onChange={(e) => setFilterSupport(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                >
                  <option value="all">كل قنوات الدعم</option>
                  <option value="none">غير مدعوم متاح</option>
                  <option value="monthly">دعم شهري متاح</option>
                  <option value="downpayment">دعم دفعة متاح</option>
                </select>
              </div>
            </div>

            {/* Rules Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs text-[#111827]">
                  <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="p-4 font-bold">البنك</th>
                      <th className="p-4 font-bold">نوع المنتج</th>
                      <th className="p-4 font-bold text-center">أقل راتب مقبول</th>
                      <th className="p-4 font-bold text-center">أقل عمر</th>
                      <th className="p-4 font-bold text-center">أعلى عمر</th>
                      <th className="p-4 font-bold text-center">أقل خدمة</th>
                      <th className="p-4 font-bold">الدعم المسموح</th>
                      <th className="p-4 font-bold">القطاعات المسموحة</th>
                      <th className="p-4 font-bold text-center">الحالة</th>
                      <th className="p-4 font-bold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(() => {
                      const filteredList = products.filter(p => {
                        if (filterBank !== 'all' && p.bankId !== filterBank) return false;
                        if (filterProductType !== 'all' && p.productId !== filterProductType) return false;
                        if (filterActiveStatus === 'active' && !p.isActive) return false;
                        if (filterActiveStatus === 'inactive' && p.isActive) return false;
                        if (filterSupport === 'none' && !p.allowUnsupported) return false;
                        if (filterSupport === 'monthly' && !p.allowMonthlySupport) return false;
                        if (filterSupport === 'downpayment' && !p.allowDownpaymentSupport) return false;
                        return true;
                      });

                      if (filteredList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-gray-400 font-medium">
                              لا توجد قواعد قبول مسجلة تطابق التصفية الحالية.
                            </td>
                          </tr>
                        );
                      }

                      return filteredList.map((prod) => {
                        const matchedBank = banks.find(b => b.id === prod.bankId);
                        const displayProduct = productTypesList.find(pt => pt.id === prod.productId)?.nameAr || prod.productId;
                        
                        // Supports lists
                        const supports: string[] = [];
                        if (prod.allowUnsupported !== false) supports.push('غير مدعوم');
                        if (prod.allowMonthlySupport) supports.push('دعم شهري');
                        if (prod.allowDownpaymentSupport) supports.push('دعم دفعة');

                        return (
                          <tr key={prod.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4 font-bold text-gray-900">{matchedBank?.nameAr || prod.bankId}</td>
                            <td className="p-4">
                              <span className="inline-flex font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-[#475569] text-[10px]">
                                {displayProduct}
                              </span>
                            </td>
                            <td className="p-4 text-center font-bold text-[#0057B8]">
                              {(prod.minSalary ?? 0).toLocaleString('en-US')} <span className="text-[10px] font-normal text-gray-400">ريـال</span>
                            </td>
                            <td className="p-4 text-center font-semibold text-gray-700">
                              {prod.minAge} <span className="text-[10px] font-normal text-gray-400">سنة</span>
                            </td>
                            <td className="p-4 text-center font-semibold text-gray-700">
                              {prod.maxAge} <span className="text-[10px] font-normal text-gray-400">سنة</span>
                            </td>
                            <td className="p-4 text-center font-semibold text-gray-700">
                              {prod.minServiceMonths} <span className="text-[10px] font-normal text-gray-400">شهر</span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {supports.map((s, idx) => (
                                  <span key={idx} className="bg-blue-50 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                    {s}
                                  </span>
                                ))}
                                {supports.length === 0 && (
                                  <span className="text-red-500 text-[9px] font-bold">لا يوجد دعم متاح</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {(Array.isArray(prod.allowedSectors) ? prod.allowedSectors : []).map(sec => {
                                  const secAr = sec === 'government_civilian' ? 'حكومي' :
                                                sec === 'military' ? 'عسكري' :
                                                sec === 'private' ? 'خاص' : 'متقاعد';
                                  return (
                                    <span key={sec} className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-semibold">
                                      {secAr}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                aria-label="تبديل الحالة"
                                onClick={() => toggleProductActive(prod.id)}
                                className="cursor-pointer inline-flex transition-transform hover:scale-105"
                              >
                                {prod.isActive ? (
                                  <ToggleRight className="w-8 h-8 text-[#0057B8]" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                                )}
                              </button>
                            </td>
                            <td className="p-4 text-center">
                              <div className="inline-flex gap-2">
                                <button
                                  id={`btn-edit-rule-${prod.id}`}
                                  onClick={() => openEditProductModal(prod)}
                                  className="text-[#0057B8] hover:bg-blue-50 p-1.5 rounded-lg transition-colors font-bold text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  تعديل
                                </button>
                                <button
                                  id={`btn-delete-rule-${prod.id}`}
                                  onClick={() => deleteProduct(prod.id)}
                                  className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  title="حذف القاعدة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PRODUCT DRAWER/MODAL POPUP */}
            {isProductModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  
                  {/* Backdrop Overlay */}
                  <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
                    onClick={closeProductModal}
                  ></div>

                  {/* Centering spacer element */}
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                  {/* Modal box */}
                  <div className="relative z-50 inline-block align-bottom bg-white rounded-3xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
                    
                    {/* Header */}
                    <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900" id="modal-title">
                        {editingProduct ? 'تعديل قاعدة قبول القرض' : 'إضافة قاعدة قبول جديدة'}
                      </h3>
                      <button
                        type="button"
                        onClick={closeProductModal}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none text-lg font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                      
                      {/* Error Alert inside popup */}
                      {formError && (
                        <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-xl text-red-700 text-xs font-bold leading-relaxed">
                          ⚠️ {formError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Bank Select */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-700">البنك الشريك *</label>
                          <select
                            id="form-bank-select"
                            value={formBankId}
                            onChange={(e) => setFormBankId(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                          >
                            {formBanksList.map(b => (
                              <option key={b.id} value={b.id}>{b.nameAr}</option>
                            ))}
                          </select>
                        </div>

                        {/* Product Type Select */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-700">نوع منتج التمويل *</label>
                          <select
                            id="form-product-select"
                            value={formProductId}
                            onChange={(e) => setFormProductId(e.target.value as ProductId)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                          >
                            {productTypesList.map(pt => (
                              <option key={pt.id} value={pt.id}>{pt.nameAr}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Min Salary Input */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-700">أقل راتب مقبول (ريال سـعودي) *</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            id="form-min-salary-input"
                            value={formMinSalary}
                            placeholder="مثال: 5000 أو 4,500"
                            onChange={(e) => setFormMinSalary(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                          />
                        </div>

                        {/* Min Service Months Input */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-700">أقل مدة خدمه للعملاء بالأشهر *</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            id="form-min-service-input"
                            value={formMinServiceMonths}
                            placeholder="مثال: 3 أو 6"
                            onChange={(e) => setFormMinServiceMonths(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Min Age Input */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-700">أقل عمر للعميل مقبول ومفعل *</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            id="form-min-age-input"
                            value={formMinAge}
                            placeholder="مثال: 18"
                            onChange={(e) => setFormMinAge(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                          />
                        </div>

                        {/* Max Age Input */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-700">أعلى عمر للعميل مقبول ومفعل *</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            id="form-max-age-input"
                            value={formMaxAge}
                            placeholder="مثال: 70 أو 75"
                            onChange={(e) => setFormMaxAge(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                          />
                        </div>
                      </div>

                      {/* Allowed Support Choices (Checks) */}
                      <div className="space-y-2 border border-gray-100 bg-gray-50/50 p-4 rounded-2xl">
                        <label className="block text-xs font-bold text-gray-800">أنواع الدعم المسكوني المسموحة:</label>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={formAllowUnsupported}
                              onChange={(e) => setFormAllowUnsupported(e.target.checked)}
                              className="rounded border-gray-300 text-[#0057B8] focus:ring-[#0057B8]"
                            />
                            <span>غير مدعوم متاح</span>
                          </label>

                          {formProductId !== 'personal_only' && formProductId !== 'personal' && (
                            <>
                              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={formAllowMonthlySupport}
                                  onChange={(e) => setFormAllowMonthlySupport(e.target.checked)}
                                  className="rounded border-gray-300 text-[#0057B8] focus:ring-[#0057B8]"
                                />
                                <span>دعم شهري متاح</span>
                              </label>

                              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={formAllowDownpaymentSupport}
                                  onChange={(e) => setFormAllowDownpaymentSupport(e.target.checked)}
                                  className="rounded border-gray-300 text-[#0057B8] focus:ring-[#0057B8]"
                                />
                                <span>دعم دفعة متاح</span>
                              </label>
                            </>
                          )}
                        </div>
                        {formProductId === 'personal_only' && (
                          <p className="text-[10px] text-amber-600 font-semibold mt-1">
                            * تنبيه: يُمنع استخدام الدعم السكني في التمويل الشخصي وفق شروط الحسبة.
                          </p>
                        )}
                      </div>

                      {/* Allowed Sectors */}
                      <div className="space-y-2 border border-gray-100 bg-gray-50/50 p-4 rounded-2xl">
                        <label className="block text-xs font-bold text-gray-800">القطاعات المقبولة والمسموحة لقاعدة الشريك: *</label>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-6">
                          {sectorsList.map(sec => {
                            const sectorsArr = Array.isArray(formAllowedSectors) ? formAllowedSectors : [];
                            const isChecked = sectorsArr.includes(sec.id as SectorId);
                            return (
                              <label key={sec.id} className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormAllowedSectors(prev => {
                                        const current = Array.isArray(prev) ? prev : [];
                                        return [...current, sec.id as SectorId];
                                      });
                                    } else {
                                      setFormAllowedSectors(prev => {
                                        const current = Array.isArray(prev) ? prev : [];
                                        return current.filter(x => x !== sec.id);
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-300 text-[#0057B8] focus:ring-[#0057B8]"
                                />
                                <span>{sec.nameAr}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Default Rejection Message */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700">رسالة الرفض عند عدم مطابقة الشروط *</label>
                        <textarea
                          id="form-rejection-msg"
                          rows={2}
                          value={formRejectionMessage}
                          onChange={(e) => setFormRejectionMessage(e.target.value)}
                          placeholder="مثال: تم رفض الطلب بسبب أن صافي الراتب أقل من الحد الأدنى المقدر لهذا البنك."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                        ></textarea>
                      </div>

                      {/* Active Status Check */}
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <input
                          type="checkbox"
                          id="form-is-active-btn"
                          checked={formIsActive}
                          onChange={(e) => setFormIsActive(e.target.checked)}
                          className="rounded border-gray-300 text-[#0057B8] w-4 h-4 focus:ring-[#0057B8] cursor-pointer"
                        />
                        <label htmlFor="form-is-active-btn" className="text-xs font-bold text-gray-800 cursor-pointer select-none">
                          تفعيل هذه القاعدة في الحسبة الحالية مباشرة
                        </label>
                      </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-row-reverse gap-3 rounded-b-3xl">
                      <button
                        type="button"
                        id="btn-save-product-rule"
                        onClick={saveProductRule}
                        className="bg-[#0057B8] hover:bg-[#00418A] text-white px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-[#0057B8]/10"
                      >
                        حفظ القاعدة
                      </button>
                      <button
                        type="button"
                        onClick={closeProductModal}
                        className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        إلغاء المعالجة
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 3: SECTORS */}
        {adminSubPage === 'sectors' && (
          <div className="space-y-8">
            {/* Header Description */}
            <div>
              <h2 className="text-lg font-bold text-[#111827]">إعدادات القطاعات الوظيفية والرتب العسكرية</h2>
              <p className="text-xs text-[#6B7280]">ترتيب وإدارة القطاعات الوظيفية، وإدارة الرتب العسكرية لتعيين سن التقاعد وضبط معايير العرض والقبول.</p>
            </div>

            {/* Section 1: Sectors Grid */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-[#111827] text-sm flex items-center gap-1.5 border-b pb-2 border-gray-100">
                <Briefcase className="w-4 h-4 text-[#0057B8]" />
                <span>القسم الأول: القطاعات الوظيفية</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sectors.map((sec) => (
                  <div key={sec.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-[#111827] text-sm">{sec.nameAr}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sec.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {sec.isActive ? 'مفعل' : 'غير مفعل'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 flex flex-col gap-1">
                        <div>
                          <span className="font-semibold text-slate-400">Sector ID:</span>{' '}
                          <code className="bg-slate-50 px-1 py-0.5 rounded font-mono text-[10px] text-slate-600">{sec.id}</code>
                        </div>
                        <p className="mt-1">ملاحظة: {sec.notes}</p>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => openEditSectorModal(sec)}
                        className="w-full text-center text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        تعديل القطاع
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Military Ranks Table */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-[#111827] text-sm flex items-center gap-1.5 border-b pb-2 border-gray-100">
                <Award className="w-4 h-4 text-[#0057B8]" />
                <span>القسم الثاني: الرتب العسكرية</span>
              </h3>
              
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs text-[#111827]">
                    <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="p-4 font-bold">الرتبة</th>
                        <th className="p-4 font-bold">Rank ID</th>
                        <th className="p-4 font-bold text-center">سن التقاعد</th>
                        <th className="p-4 font-bold text-center">ترتيب العرض</th>
                        <th className="p-4 font-bold text-center">الحالة</th>
                        <th className="p-4 font-bold text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-semibold">
                      {militaryRanks && militaryRanks.length > 0 ? (
                        militaryRanks.slice().sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99)).map((rank) => (
                          <tr key={rank.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-xs font-bold text-slate-800">{rank.nameAr}</td>
                            <td className="p-4">
                              <code className="bg-slate-50 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-500">{rank.id}</code>
                            </td>
                            <td className="p-4 text-center font-sans">
                              {rank.retirementAge} سنة
                            </td>
                            <td className="p-4 text-center font-sans">
                              {rank.displayOrder}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setMilitaryRanks(prev => prev.map(r => r.id === rank.id ? { ...r, isActive: !r.isActive } : r))}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  rank.isActive ? 'bg-[#0057B8]' : 'bg-slate-200'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    rank.isActive ? '-translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                type="button"
                                onClick={() => openEditRankModal(rank)}
                                className="text-[#0057B8] hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors text-xs font-bold cursor-pointer"
                              >
                                تعديل
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400">لا توجد رتب عسكرية مسجلة حالياً.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SECTORS MODAL POPUP */}
            {isSectorModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="sector-modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" onClick={() => setIsSectorModalOpen(false)}></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                  <div className="relative z-55 inline-block align-bottom bg-white rounded-3xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-100">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-gray-900" id="sector-modal-title">
                        تعديل بيانات القطاع الوظيفي
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsSectorModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none text-lg font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="px-6 py-6 space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600">اسم القطاع:</label>
                        <input
                          type="text"
                          value={formSectorNameAr}
                          onChange={(e) => setFormSectorNameAr(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600">ID القطاع:</label>
                        <input
                          type="text"
                          value={editingSector?.id || ''}
                          disabled
                          className="w-full bg-slate-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 cursor-not-allowed focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-xs font-bold text-gray-600">حالة التفعيل:</span>
                        <button
                          type="button"
                          onClick={() => setFormSectorIsActive(!formSectorIsActive)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formSectorIsActive ? 'bg-[#0057B8]' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              formSectorIsActive ? '-translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-100 font-bold text-xs">
                      <button
                        type="button"
                        onClick={saveSector}
                        className="bg-[#0057B8] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer"
                      >
                        حفظ التعديلات
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSectorModalOpen(false)}
                        className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MILITARY RANKS MODAL POPUP */}
            {isRankModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="rank-modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" onClick={() => setIsRankModalOpen(false)}></div>
                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                  <div className="relative z-55 inline-block align-bottom bg-white rounded-3xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-100">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-gray-900" id="rank-modal-title">
                        تعديل بيانات الرتبة العسكرية
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsRankModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none text-lg font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="px-6 py-6 space-y-4">
                      {rankError && (
                        <div className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-2xl border border-red-100 font-semibold">
                          ⚠️ {rankError}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600">اسم الرتبة:</label>
                        <input
                          type="text"
                          value={formRankNameAr}
                          onChange={(e) => setFormRankNameAr(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600">Rank ID:</label>
                        <input
                          type="text"
                          value={formRankId}
                          disabled
                          className="w-full bg-slate-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 cursor-not-allowed focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600">سن التقاعد الإلزامي:</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formRankRetirementAge}
                          onChange={(e) => setFormRankRetirementAge(e.target.value)}
                          className="text-right w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="مثال: 44"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600">ترتيب العرض:</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formRankDisplayOrder}
                          onChange={(e) => setFormRankDisplayOrder(e.target.value)}
                          className="text-right w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="مثال: 1"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-xs font-bold text-gray-600">حالة التفعيل:</span>
                        <button
                          type="button"
                          onClick={() => setFormRankIsActive(!formRankIsActive)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formRankIsActive ? 'bg-[#0057B8]' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              formRankIsActive ? '-translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-100 font-bold text-xs">
                      <button
                        type="button"
                        onClick={saveRank}
                        className="bg-[#0057B8] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer"
                      >
                        حفظ التعديلات
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRankModalOpen(false)}
                        className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: NET SALARY */}
        {adminSubPage === 'salary' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#111827]">طرق احتساب الراتب الصافي ونسب الخصم</h2>
            <p className="text-xs text-[#6B7280]">صياغة نسب التأمينات والخصومات التقاعدية من أصل المعاشات.</p>

            <div className="space-y-4">
              {salaryRules.map((rule) => {
                const sectorLabels: Record<string, string> = {
                  government_civilian: 'حكومي مدني',
                  military: 'عسكري حربي',
                  private: 'قطاع خاص',
                  retired: 'متقاعد حالي'
                };
                return (
                  <div key={rule.sectorId} className="border border-[#E5E7EB] rounded-2xl p-5 bg-white shadow-xs">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-[#0057B8] text-sm">{sectorLabels[rule.sectorId]}</h4>
                      <span className="text-[10px] text-gray-400 font-semibold">{rule.sectorId}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                      <div>
                        <span className="text-gray-500 block mb-1">نسبة الخصم المعاشية:</span>
                        <div className="relative">
                          <NumericInput
                            id={`rule-pct-${rule.sectorId}`}
                            value={rule.deductionPercentage}
                            onChange={(val) => setSalaryRules(prev => prev.map(r => r.sectorId === rule.sectorId ? { ...r, deductionPercentage: val } : r))}
                            allowDecimals={true}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none text-xs font-semibold"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 block mb-1">الأساس الخاضع للاستقطاع:</span>
                        <select
                          id={`rule-base-${rule.sectorId}`}
                          value={rule.deductionBase}
                          onChange={(e: any) => setSalaryRules(prev => prev.map(r => r.sectorId === rule.sectorId ? { ...r, deductionBase: e.target.value } : r))}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs"
                        >
                          <option value="basic_housing">الأساسي + السكن</option>
                          <option value="basic_only">الأساسي فقط</option>
                          <option value="total">إجمالي الراتب بالبدلات</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <input
                          id={`rule-direct-${rule.sectorId}`}
                          type="checkbox"
                          checked={rule.allowDirectInput}
                          onChange={(e) => setSalaryRules(prev => prev.map(r => r.sectorId === rule.sectorId ? { ...r, allowDirectInput: e.target.checked } : r))}
                          className="accent-[#0057B8] w-4 h-4"
                        />
                        <span className="text-gray-600">السماح لمدير الحسبة بالإدخال المباشر</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 5: PENSION */}
        {adminSubPage === 'pension' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">إعدادات سن التقاعد ومعامل المعاش</h2>
                <p className="text-xs text-[#6B7280]">ضبط السن القانوني للتقاعد ومعامل حساب المعاش التقاعدي لكل قطاع مهني.</p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 text-xs text-gray-700 leading-relaxed font-sans space-y-3">
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0057B8] mt-0.5 shrink-0" />
                <p><strong>قاعدة احتساب راتب المعاش التقاعدي:</strong> الراتب الأساسي × عدد أشهر الخدمة ÷ معامل المعاش (القسمة). يتم جلب سن تقاعد العسكريين ديناميكياً من الرتب العسكرية في صفحة "القطاعات والرتب".</p>
              </div>
            </div>

            {/* Simple Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-xs">
              <table className="min-w-full divide-y divide-gray-200 text-right">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-right">القطاع</th>
                    <th scope="col" className="px-6 py-4 text-right">سن التقاعد</th>
                    <th scope="col" className="px-6 py-4 text-right">معامل المعاش</th>
                    <th scope="col" className="px-6 py-4 text-right">مصدر سن التقاعد</th>
                    <th scope="col" className="px-6 py-4 text-right">الحالة</th>
                    <th scope="col" className="px-6 py-4 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs font-semibold text-gray-700">
                  {[
                    {
                      id: 'government_civilian' as SectorId,
                      nameAr: 'حكومي مدني',
                      sourceAr: 'ثابت من هذه الصفحة',
                      isMilitary: false,
                      isRetired: false
                    },
                    {
                      id: 'private' as SectorId,
                      nameAr: 'قطاع خاص',
                      sourceAr: 'ثابت من هذه الصفحة',
                      isMilitary: false,
                      isRetired: false
                    },
                    {
                      id: 'military' as SectorId,
                      nameAr: 'عسكري',
                      sourceAr: 'صفحة القطاعات والرتب / الرتب العسكرية',
                      isMilitary: true,
                      isRetired: false
                    },
                    {
                      id: 'retired' as SectorId,
                      nameAr: 'متقاعد',
                      sourceAr: 'لا ينطبق',
                      isMilitary: false,
                      isRetired: true
                    }
                  ].map((sec) => {
                    const rule = pensionRules.find(r => r.sectorId === sec.id);
                    let retirementAgeDisplay = '';
                    let multiplierDisplay = '';
                    let isActiveDisplay = true;

                    if (sec.isRetired) {
                      retirementAgeDisplay = 'لا ينطبق';
                      multiplierDisplay = 'لا ينطبق';
                      isActiveDisplay = true;
                    } else if (sec.isMilitary) {
                      retirementAgeDisplay = 'حسب الرتبة';
                      multiplierDisplay = rule ? rule.pensionMultiplier.toString() : '420';
                      isActiveDisplay = rule ? rule.isActive : true;
                    } else {
                      retirementAgeDisplay = rule ? rule.retirementAge.toString() : '60';
                      multiplierDisplay = rule ? rule.pensionMultiplier.toString() : '480';
                      isActiveDisplay = rule ? rule.isActive : true;
                    }

                    return (
                      <tr key={sec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{sec.nameAr}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono">{retirementAgeDisplay}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono">{multiplierDisplay}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{sec.sourceAr}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold ${
                            isActiveDisplay 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}>
                            {isActiveDisplay ? 'مفعل' : 'غير مفعل'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (sec.isRetired) {
                                setEditingPension({
                                  sectorId: 'retired',
                                  retirementAge: '60',
                                  pensionMultiplier: '480',
                                  isActive: true
                                });
                              } else {
                                setEditingPension({
                                  sectorId: sec.id,
                                  retirementAge: rule ? rule.retirementAge.toString() : '60',
                                  pensionMultiplier: rule ? rule.pensionMultiplier.toString() : '480',
                                  isActive: rule ? rule.isActive : true
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] hover:border-[#0057B8] hover:text-[#0057B8] text-gray-600 bg-white hover:bg-[#0057B8]/5 rounded-xl transition-all font-bold text-[11px] cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>تعديل</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Simple Modal Overlay for Editing Row */}
            {editingPension && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 w-full max-w-sm shadow-2xl animate-fade-in text-right font-sans">
                  <h3 className="text-base font-extrabold text-[#111827] border-b border-gray-100 pb-3 mb-5">
                    تعديل إعدادات سن التقاعد والمعاش
                  </h3>
                  
                  <div className="space-y-4 text-right">
                    {/* Sector Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">القطاع المهني التابع له:</label>
                      <input
                        type="text"
                        disabled
                        value={
                          editingPension.sectorId === 'government_civilian' 
                            ? 'حكومي مدني' 
                            : editingPension.sectorId === 'private' 
                            ? 'قطاع خاص' 
                            : editingPension.sectorId === 'military' 
                            ? 'عسكري' 
                            : 'متقاعد'
                        }
                        className="w-full bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none cursor-not-allowed text-right"
                      />
                    </div>

                    {/* Retirement Age */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">سن التقاعد:</label>
                      {editingPension.sectorId === 'military' ? (
                        <div className="text-xs text-[#0057B8] bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3 font-semibold text-right leading-relaxed">
                          يتم جلب سن تقاعد القطاع العسكري تلقائياً حسب الرتبة العسكرية من صفحة "القطاعات والرتب".
                        </div>
                      ) : editingPension.sectorId === 'retired' ? (
                        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-semibold text-right">
                          لا ينطبق على قطاع المتقاعدين.
                        </div>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editingPension.retirementAge}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setEditingPension(prev => prev ? { ...prev, retirementAge: val } : null);
                          }}
                          placeholder="مثال: 60"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8] focus:border-transparent text-right"
                        />
                      )}
                    </div>

                    {/* Pension Coefficient */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">معامل حساب المعاش (المقسوم عليه):</label>
                      {editingPension.sectorId === 'retired' ? (
                        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-semibold text-right">
                          لا ينطبق على قطاع المتقاعدين.
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={editingPension.pensionMultiplier}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setEditingPension(prev => prev ? { ...prev, pensionMultiplier: val } : null);
                            }}
                            placeholder="مثال: 480 أو 420"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8] focus:border-transparent text-right"
                          />
                          <span className="text-[10px] text-gray-400 block mt-1 leading-relaxed">القاسم النشط: 480 للمدنيين والخاص (40 سنة) و420 للعسكريين (35 سنة).</span>
                        </div>
                      )}
                    </div>

                    {/* Status Active Toggle */}
                    {editingPension.sectorId !== 'retired' && (
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-gray-700 mb-2">حالة تفعيل القطاع في المعاش:</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingPension(prev => prev ? { ...prev, isActive: !prev.isActive } : null)}
                            className="focus:outline-none transition-all cursor-pointer"
                          >
                            {editingPension.isActive ? (
                              <ToggleRight className="w-10 h-10 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-10 h-10 text-gray-300" />
                            )}
                          </button>
                          <span className={`text-xs font-semibold ${editingPension.isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                            {editingPension.isActive ? 'نشط ومفعل' : 'معطل مؤقتاً'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 mt-6 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingPension(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingPension.sectorId !== 'retired') {
                          const multNum = parseInt(editingPension.pensionMultiplier, 10);
                          if (isNaN(multNum) || multNum <= 0) {
                            alert("يرجى إدخال معامل معاش صحيح أكبر من الصفر");
                            return;
                          }

                          if (editingPension.sectorId !== 'military') {
                            const ageNum = parseInt(editingPension.retirementAge, 10);
                            if (isNaN(ageNum) || ageNum <= 0) {
                              alert("يرجى إدخال سن تقاعد صحيح أكبر من الصفر");
                              return;
                            }
                          }
                        }

                        if (editingPension.sectorId === 'retired') {
                          setEditingPension(null);
                          return;
                        }

                        const incomingMult = parseInt(editingPension.pensionMultiplier, 10);
                        const incomingAge = parseInt(editingPension.retirementAge, 10);

                        setPensionRules(prev => prev.map(rule => {
                          if (rule.sectorId === editingPension.sectorId) {
                            return {
                              ...rule,
                              retirementAge: isNaN(incomingAge) ? rule.retirementAge : incomingAge,
                              pensionMultiplier: incomingMult,
                              isActive: editingPension.isActive
                            };
                          }
                          return rule;
                        }));

                        setEditingPension(null);
                        showToast("تم تطبيق التعديل مؤقتاً في المسودة. لا تنسَ حفظ التغييرات أسفل الصفحة تطبيقاً كلياً.", "success");
                      }}
                      className="px-5 py-2 bg-[#0057B8] hover:bg-[#004bb0] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      تطبيق التعديل
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: TERMS */}
        {adminSubPage === 'terms' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">مدد التمويل والحدود</h2>
                <p className="text-xs text-[#6B7280]">إدارة قواعد وضوابط مدد التمويل وحدود السن والتقاويم الخاصة بكل بنك.</p>
              </div>
            </div>

            {/* 1. CHART / BRIEF LAW INFO */}
            <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 text-right font-sans">
              <h3 className="font-extrabold text-[#111827] text-sm mb-3">قانون مدة التمويل:</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                يتم حساب مدة التمويل بالأشهر حسب الأقل من:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#0057B8] block mb-1">1. أقصى مدة مسموحة للبنك</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed">الحد الأقصى الكلي لمدد التمويل المقررة في البنك.</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-600 block mb-1">2. المدة حتى أقصى عمر عند نهاية التمويل</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-sans">المدة المتبقية للوصول لعمر الحد الأقصى لنهاية التمويل بالبنك.</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 block mb-1">3. المدة حتى سن التقاعد + أشهر السماح بعد التقاعد</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-sans">المدة المتبقية لسن تقاعد القطاع مضافاً إليها أشهر السماح المتاحة بعد التقاعد.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TABLE OF BANKS TERMS */}
            <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-xs">
              <table className="min-w-full divide-y divide-gray-200 text-right">
                <thead className="bg-[#F8FAFC] text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-right">البنك</th>
                    <th scope="col" className="px-6 py-4 text-right">Bank ID</th>
                    <th scope="col" className="px-6 py-4 text-right">أقصى مدة تمويل بالأشهر</th>
                    <th scope="col" className="px-6 py-4 text-right">أقصى عمر عند نهاية التمويل</th>
                    <th scope="col" className="px-6 py-4 text-right">أشهر السماح بعد التقاعد</th>
                    <th scope="col" className="px-6 py-4 text-right">يسمح بعد التقاعد</th>
                    <th scope="col" className="px-6 py-4 text-right">نوع التقويم</th>
                    <th scope="col" className="px-6 py-4 text-right">الحالة</th>
                    <th scope="col" className="px-6 py-4 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs font-semibold text-gray-700">
                  {banks.map((bank) => (
                    <tr key={bank.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${bank.logoColor || 'from-[#0057B8] to-blue-900'} shrink-0`} />
                          <span>{bank.nameAr}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">{bank.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-mono">{bank.maxTermMonths} شهر</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-mono">{bank.maxAgeAtEnd} سنة</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono">
                        {bank.allowAfterRetirement ? `${bank.monthsAfterRetirement} شهر` : '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          bank.allowAfterRetirement 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {bank.allowAfterRetirement ? 'نعم' : 'لا'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs text-right">
                        {bank.calendarType === 'hijri' ? 'هجري' : 'ميلادي'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          bank.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          {bank.isActive ? 'مفعل' : 'غير مفعل'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBankTerm({
                                id: bank.id,
                                nameAr: bank.nameAr,
                                maxTermMonths: bank.maxTermMonths.toString(),
                                maxAgeAtEnd: bank.maxAgeAtEnd.toString(),
                                monthsAfterRetirement: bank.monthsAfterRetirement.toString(),
                                allowAfterRetirement: bank.allowAfterRetirement,
                                calendarType: bank.calendarType,
                                isActive: bank.isActive
                              });
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#E5E7EB] hover:border-[#0057B8] text-[#0057B8] hover:bg-[#0057B8]/5 rounded-lg transition-all font-bold text-[11px] cursor-pointer"
                          >
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = banks.map(b => b.id === bank.id ? { ...b, isActive: !b.isActive } : b);
                              setBanks(updated);
                              showToast(`تم تغيير حالة البنك ${bank.nameAr} في المسودة.`, "success");
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                              bank.isActive 
                                ? 'bg-rose-50 border-rose-100 hover:bg-rose-100 text-rose-800' 
                                : 'bg-[#0057B8]/5 border-[#0057B8]/10 hover:bg-[#0057B8]/10 text-[#0057B8]'
                            }`}
                          >
                            {bank.isActive ? 'تعطيل' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3. MODAL FOR EDITING BANK TERM */}
            {editingBankTerm && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 w-full max-w-sm shadow-2xl animate-fade-in text-right font-sans">
                  <h3 className="text-sm font-extrabold text-[#111827] border-b border-gray-100 pb-3 mb-5">
                    تعديل إعدادات التمويل - {editingBankTerm.nameAr}
                  </h3>

                  <div className="space-y-4 text-right">
                    {/* Bank Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">اسم البنك:</label>
                      <input
                        type="text"
                        disabled
                        value={editingBankTerm.nameAr}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 py-2.5 text-xs font-bold cursor-not-allowed text-right focus:outline-none"
                      />
                    </div>

                    {/* Bank ID */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Bank ID:</label>
                      <input
                        type="text"
                        disabled
                        value={editingBankTerm.id}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 py-2.5 text-xs font-mono font-semibold cursor-not-allowed text-right focus:outline-none"
                      />
                    </div>

                    {/* Max Term Months */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">أقصى مدة تمويل بالأشهر:</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editingBankTerm.maxTermMonths}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setEditingBankTerm(prev => prev ? { ...prev, maxTermMonths: val } : null);
                        }}
                        placeholder="أدخل عدد الأشهر"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-right"
                      />
                    </div>

                    {/* Max Age At End */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">أقصى عمر عند نهاية التمويل:</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editingBankTerm.maxAgeAtEnd}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setEditingBankTerm(prev => prev ? { ...prev, maxAgeAtEnd: val } : null);
                        }}
                        placeholder="أدخل أقصى عمر"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-right"
                      />
                    </div>

                    {/* Is Post Retirement Allowed (allowAfterRetirement) */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">يسمح بعد التقاعد:</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingBankTerm(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              allowAfterRetirement: true
                            };
                          })}
                          className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                            editingBankTerm.allowAfterRetirement
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          نعم
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBankTerm(prev => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              allowAfterRetirement: false,
                              monthsAfterRetirement: '0' // تصفير أشهر السماح عند الإلغاء
                            };
                          })}
                          className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                            !editingBankTerm.allowAfterRetirement
                              ? 'border-rose-600 bg-rose-50 text-rose-800 font-bold'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          لا
                        </button>
                      </div>
                    </div>

                    {/* Months After Retirement */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">أشهر السماح بعد التقاعد:</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={!editingBankTerm.allowAfterRetirement}
                        value={editingBankTerm.monthsAfterRetirement}
                        onChange={(e) => {
                          if (!editingBankTerm.allowAfterRetirement) return;
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setEditingBankTerm(prev => prev ? { ...prev, monthsAfterRetirement: val } : null);
                        }}
                        placeholder="أدخل عدد أشهر بعد التقاعد"
                        className={`w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none text-right ${
                          editingBankTerm.allowAfterRetirement 
                            ? 'bg-white border-gray-200 focus:ring-2 focus:ring-[#0057B8]' 
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    {/* Calendar Type */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">نوع التقويم:</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingBankTerm(prev => prev ? { ...prev, calendarType: 'hijri' } : null)}
                          className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                            editingBankTerm.calendarType === 'hijri'
                              ? 'border-[#0057B8] bg-[#0057B8]/5 text-[#0057B8] font-bold'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          هجري
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBankTerm(prev => prev ? { ...prev, calendarType: 'gregorian' } : null)}
                          className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                            editingBankTerm.calendarType === 'gregorian'
                              ? 'border-[#0057B8] bg-[#0057B8]/5 text-[#0057B8] font-bold'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          ميلادي
                        </button>
                      </div>
                    </div>

                    {/* Active State */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">مفعل / غير مفعل:</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingBankTerm(prev => prev ? { ...prev, isActive: true } : null)}
                          className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                            editingBankTerm.isActive
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-850 font-bold'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          مفعل
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBankTerm(prev => prev ? { ...prev, isActive: false } : null)}
                          className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                            !editingBankTerm.isActive
                              ? 'border-rose-600 bg-rose-50 text-rose-850 font-bold'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          غير مفعل
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 mt-6 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingBankTerm(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const maxTermVal = parseInt(editingBankTerm.maxTermMonths, 10);
                        const maxAgeVal = parseInt(editingBankTerm.maxAgeAtEnd, 10);
                        const postRetVal = parseInt(editingBankTerm.monthsAfterRetirement, 10);

                        if (isNaN(maxTermVal) || maxTermVal < 0) {
                          alert("يرجى إدخال أقصى مدة تمويل صحيحة بالأرقام الإنجليزية");
                          return;
                        }
                        if (isNaN(maxAgeVal) || maxAgeVal < 0) {
                          alert("يرجى إدخال أقصى عمر صحيح بالأرقام الإنجليزية");
                          return;
                        }
                        if (editingBankTerm.allowAfterRetirement && (isNaN(postRetVal) || postRetVal < 0)) {
                          alert("يرجى إدخال أشهر السماح بعد التقاعد بالأرقام الإنجليزية");
                          return;
                        }

                        // التحديث بمسودة البنوك في السياق
                        const updatedBanks = banks.map(b => {
                          if (b.id === editingBankTerm.id) {
                            return {
                              ...b,
                              maxTermMonths: maxTermVal,
                              maxAgeAtEnd: maxAgeVal,
                              monthsAfterRetirement: editingBankTerm.allowAfterRetirement ? postRetVal : 0,
                              allowAfterRetirement: editingBankTerm.allowAfterRetirement,
                              calendarType: editingBankTerm.calendarType,
                              isActive: editingBankTerm.isActive
                            };
                          }
                          return b;
                        });

                        setBanks(updatedBanks);
                        setEditingBankTerm(null);
                        showToast("تم تطبيق التعديلات المؤقتة بنجاح كمسودة. يرجى الضغط على حفظ التغييرات لحفظها دائمًا.", "success");
                      }}
                      className="px-5 py-2 bg-[#0057B8] hover:bg-[#004bb0] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      تطبيق التعديل
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: MARGINS - GRID & INTERPOLATION */}
        {adminSubPage === 'margins' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-[#F1F5F9] pb-4">
              <h2 className="text-xl font-extrabold text-[#111827]">هوامش الأرباح البنكية</h2>
              <p className="text-xs text-[#6B7280] mt-1">إدارة هوامش التمويل حسب البنك والمنتج ونوع الدعم والمدة.</p>
            </div>

            {/* Selection Grid */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-6">
              {/* 1. Selector dropdown of bank */}
              <div>
                <label htmlFor="margin-bank-select" className="block text-xs font-bold text-gray-700 mb-2">اختر البنك:</label>
                <div className="relative">
                  <select
                    id="margin-bank-select"
                    value={selectedMarginBank}
                    onChange={(e) => setSelectedMarginBank(e.target.value)}
                    className="w-full md:max-w-md bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs font-bold font-sans text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-right cursor-pointer"
                  >
                    {formBanksList.map(b => (
                      <option key={b.id} value={b.id}>{b.nameAr}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Selector Product (المنتج) */}
              <div>
                <span className="block text-xs font-bold text-gray-700 mb-3 font-sans">أولاً: المنتج</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'real_estate_only', nameAr: 'عقاري فقط' },
                    { id: 'real_estate_with_new_personal', nameAr: 'عقاري + شخصي جديد' },
                    { id: 'real_estate_with_existing_personal', nameAr: 'عقاري مع شخصي قائم' }
                  ].map((p) => {
                    const isSelected = selectedMarginProduct === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedMarginProduct(p.id as ProductId)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold font-sans transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0057B8] border-[#0057B8] text-white shadow-xs font-extrabold'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                        }`}
                      >
                        {p.nameAr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Selector Support (نوع الدعم) */}
              <div>
                <span className="block text-xs font-bold text-gray-700 mb-3 font-sans">ثانياً: نوع الدعم</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'none', nameAr: 'غير مدعوم' },
                    { id: 'monthly', nameAr: 'دعم شهري' },
                    { id: 'downpayment', nameAr: 'دعم دفعة' }
                  ].map((s) => {
                    const isSelected = selectedMarginSupport === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedMarginSupport(s.id as SupportType)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold font-sans transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0057B8] border-[#0057B8] text-white shadow-xs font-extrabold'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-slate-50'
                        }`}
                      >
                        {s.nameAr}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Margins Configuration Table */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-6">
              {/* Table Headline */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#F1F5F9] pb-4 gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#111827] font-sans">
                    {formBanksList.find(b => b.id === selectedMarginBank)?.nameAr || selectedMarginBank} — {' '}
                    {selectedMarginProduct === 'real_estate_only' ? 'عقاري فقط' : selectedMarginProduct === 'real_estate_with_new_personal' ? 'عقاري + شخصي جديد' : 'عقاري مع شخصي قائم'} — {' '}
                    {selectedMarginSupport === 'none' ? 'غير مدعوم' : selectedMarginSupport === 'monthly' ? 'دعم شهري' : 'دعم دفعة'}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">جدول هوامش الفوائد والنسب السنوية المعتمدة.</p>
                </div>

                {/* Calculation method */}
                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-2 flex items-center gap-4">
                  <span className="text-xs font-bold text-gray-600 font-sans">طريقة الحساب:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleCalcMethodChange('linear')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                        localCalcMethod === 'linear'
                          ? 'bg-[#0057B8] text-white font-extrabold'
                          : 'bg-white text-gray-600 border border-gray-100 hover:bg-slate-50'
                      }`}
                    >
                      تدرج خطي Linear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcMethodChange('fixed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                        localCalcMethod === 'fixed'
                          ? 'bg-[#0057B8] text-white font-extrabold'
                          : 'bg-white text-gray-600 border border-gray-100 hover:bg-slate-50'
                      }`}
                    >
                      ثابت Fixed
                    </button>
                  </div>
                </div>
              </div>

              {localCalcMethod === 'linear' && (
                <div className="bg-emerald-50/50 text-emerald-800 text-[11px] font-semibold font-sans border border-emerald-100/60 rounded-xl p-3 leading-relaxed">
                  * عند اختيار التدرج الخطي، يتم احتساب الهامش بين السنوات تلقائيًا.
                </div>
              )}

              {/* Core 5-30 Margin rates inputs */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200 text-right">
                  <thead className="bg-[#F8FAFC] text-slate-500 font-bold text-xs font-sans">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 text-right">مدة التمويل</th>
                      <th scope="col" className="px-6 py-3.5 text-right">الهامش السنوي %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white text-xs font-semibold text-gray-700">
                    {[
                      { year: 5, label: '5 سنوات' },
                      { year: 10, label: '10 سنوات' },
                      { year: 15, label: '15 سنة' },
                      { year: 20, label: '20 سنة' },
                      { year: 25, label: '25 سنة' },
                      { year: 30, label: '30 سنة' }
                    ].map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-800 font-sans">
                          {row.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={localMargins[row.year] ?? ''}
                            onChange={(e) => handleMarginLocalChange(row.year, e.target.value)}
                            onBlur={(e) => handleMarginBlur(row.year, e.target.value)}
                            className="bg-white border border-gray-300 rounded-xl px-4 py-2 w-full max-w-[200px] text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-right"
                            placeholder="0.00"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clone panel within the SAME bank */}
            <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
              <h4 className="font-extrabold text-[#111827] text-xs font-sans">استنساخ من جدول آخر</h4>
              <p className="text-[11px] text-[#6B7280] font-sans">استنساخ هوامش حالة إلى الحالة المروّسة الحالية داخل نفس البنك ({formBanksList.find(b => b.id === selectedMarginBank)?.nameAr}).</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-xs font-bold text-gray-700 font-sans">
                <div>
                  <label htmlFor="clone-from-product" className="block text-slate-500 mb-1.5 font-sans">اختر المنتج المصدر:</label>
                  <select
                    id="clone-from-product"
                    value={cloningFromProduct}
                    onChange={(e) => setCloningFromProduct(e.target.value as ProductId)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 cursor-pointer text-right"
                  >
                    {[
                      { id: 'real_estate_only', nameAr: 'عقاري فقط' },
                      { id: 'real_estate_with_new_personal', nameAr: 'عقاري + شخصي جديد' },
                      { id: 'real_estate_with_existing_personal', nameAr: 'عقاري مع شخصي قائم' }
                    ].map(p => (
                      <option key={p.id} value={p.id}>{p.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="clone-from-support" className="block text-slate-500 mb-1.5 font-sans">اختر نوع الدعم المصدر:</label>
                  <select
                    id="clone-from-support"
                    value={cloningFromSupport}
                    onChange={(e) => setCloningFromSupport(e.target.value as SupportType)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 cursor-pointer text-right"
                  >
                    {[
                      { id: 'none', nameAr: 'غير مدعوم' },
                      { id: 'monthly', nameAr: 'دعم شهري' },
                      { id: 'downpayment', nameAr: 'دعم دفعة' }
                    ].map(s => (
                      <option key={s.id} value={s.id}>{s.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleCloneLocal}
                    className="w-full py-2.5 bg-[#0057B8] hover:bg-[#004bb0] text-white rounded-xl font-extrabold text-xs transition-all shadow-xs cursor-pointer"
                  >
                    استنساخ إلى الجدول الحالي
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 8: DSR */}
        {adminSubPage === 'dsr' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#F1F5F9] pb-4 gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#111827]">حدود الاستقطاع ونسب DSR</h2>
                <p className="text-xs text-[#6B7280] mt-1">ضبط الحد الأعلى للاستقطاع حسب البنك والمنتج والدعم ومرحلة العميل.</p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddDsrModal}
                className="bg-[#0057B8] hover:bg-[#004bb0] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-start font-sans"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قاعدة DSR</span>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs grid grid-cols-2 md:grid-cols-5 gap-3.5 text-xs font-bold font-sans text-gray-700">
              <div>
                <label htmlFor="filter-dsr-bank" className="block text-slate-500 mb-1.5">البنك:</label>
                <select
                  id="filter-dsr-bank"
                  value={filterDsrBank}
                  onChange={(e) => setFilterDsrBank(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0057B8] text-right font-semibold text-gray-800"
                >
                  <option value="all">الكل (All)</option>
                  {DSR_BANKS.map(b => (
                    <option key={b.id} value={b.id}>{b.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-dsr-product" className="block text-slate-500 mb-1.5"> نوع المنتج:</label>
                <select
                  id="filter-dsr-product"
                  value={filterDsrProduct}
                  onChange={(e) => setFilterDsrProduct(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0057B8] text-right font-semibold text-gray-800"
                >
                  <option value="all">الكل (All)</option>
                  {DSR_PRODUCT_TYPES.map(p => (
                    <option key={p.id} value={p.id}>{p.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-dsr-support" className="block text-slate-500 mb-1.5">نوع الدعم:</label>
                <select
                  id="filter-dsr-support"
                  value={filterDsrSupport}
                  onChange={(e) => setFilterDsrSupport(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0057B8] text-right font-semibold text-gray-800"
                >
                  <option value="all">الكل (All)</option>
                  {DSR_SUPPORT_TYPES.map(s => (
                    <option key={s.id} value={s.id}>{s.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-dsr-stage" className="block text-slate-500 mb-1.5">المرحلة:</label>
                <select
                  id="filter-dsr-stage"
                  value={filterDsrStage}
                  onChange={(e) => setFilterDsrStage(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0057B8] text-right font-semibold text-gray-800"
                >
                  <option value="all">الكل (All)</option>
                  {DSR_CUSTOMER_STAGES.map(st => (
                    <option key={st.id} value={st.id}>{st.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-dsr-status" className="block text-slate-500 mb-1.5">الدورة / الحالة:</label>
                <select
                  id="filter-dsr-status"
                  value={filterDsrStatus}
                  onChange={(e) => setFilterDsrStatus(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0057B8] text-right font-semibold text-gray-800"
                >
                  <option value="all">الكل (All)</option>
                  <option value="active">نشط / مفعل</option>
                  <option value="inactive">غير نشط / معطل</option>
                </select>
              </div>
            </div>

            {/* DSR Table */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-right">
                  <thead className="bg-[#F8FAFC] text-slate-500 font-bold text-xs font-sans">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-right">البنك</th>
                      <th scope="col" className="px-6 py-4 text-right">نوع المنتج</th>
                      <th scope="col" className="px-6 py-4 text-right">نوع الدعم</th>
                      <th scope="col" className="px-6 py-4 text-right">مرحلة العميل</th>
                      <th scope="col" className="px-6 py-4 text-center">نسبة الاستقطاع %</th>
                      <th scope="col" className="px-6 py-4 text-center">خصم الالتزامات القائمة</th>
                      <th scope="col" className="px-6 py-4 text-center">الحالة</th>
                      <th scope="col" className="px-6 py-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white text-xs font-semibold text-gray-700">
                    {dsrRules
                      .filter(rule => {
                        if (filterDsrBank !== 'all' && rule.bankId !== filterDsrBank) return false;
                        if (filterDsrProduct !== 'all' && rule.productType !== filterDsrProduct) return false;
                        if (filterDsrSupport !== 'all' && rule.supportType !== filterDsrSupport) return false;
                        if (filterDsrStage !== 'all' && rule.customerStage !== filterDsrStage) return false;
                        if (filterDsrStatus !== 'all') {
                          const isActiveFilter = filterDsrStatus === 'active';
                          if (rule.active !== isActiveFilter) return false;
                        }
                        return true;
                      })
                      .map((rule) => {
                        const matchedBank = DSR_BANKS.find(b => b.id === rule.bankId);
                        const matchedProduct = DSR_PRODUCT_TYPES.find(p => p.id === rule.productType);
                        const matchedSupport = DSR_SUPPORT_TYPES.find(s => s.id === rule.supportType);
                        const matchedStage = DSR_CUSTOMER_STAGES.find(st => st.id === rule.customerStage);

                        return (
                          <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 font-sans">
                              {matchedBank ? matchedBank.nameAr : rule.bankId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-sans">
                              {matchedProduct ? matchedProduct.nameAr : rule.productType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-sans ${
                                rule.supportType === 'monthly'
                                  ? 'bg-blue-50 text-blue-700'
                                  : rule.supportType === 'down_payment'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {matchedSupport ? matchedSupport.nameAr : rule.supportType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-sans">
                              {matchedStage ? matchedStage.nameAr : rule.customerStage}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-900 font-mono font-bold text-sm">
                              {rule.dsrPercent}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold font-sans inline-block min-w-[50px] ${
                                rule.deductExistingObligations 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : 'bg-rose-50 text-rose-700'
                              }`}>
                                {rule.deductExistingObligations ? 'نعم' : 'لا'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${
                                rule.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${rule.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                {rule.active ? 'مفعل' : 'معطل'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  title="تعديل نسبة الاستقطاع"
                                  onClick={() => handleOpenEditDsrModal(rule)}
                                  className="p-1 px-2 border border-gray-200 rounded-lg hover:bg-slate-50 hover:text-[#0057B8] text-gray-500 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title={rule.active ? "تعطيل القاعدة" : "تفعيل القاعدة"}
                                  onClick={() => handleToggleDsrRuleActive(rule.id)}
                                  className="p-1 text-gray-500 hover:text-blue-600 cursor-pointer"
                                >
                                  {rule.active ? (
                                    <ToggleRight className="w-6 h-6 text-[#0057B8]" />
                                  ) : (
                                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  title="حذف القاعدة"
                                  onClick={() => handleDeleteDsrRule(rule.id)}
                                  className="p-1 px-2 border border-rose-100 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DSR ADD/EDIT MODAL POPUP */}
            {isDsrModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="dsr-modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" onClick={() => setIsDsrModalOpen(false)}></div>

                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                  <div className="relative z-55 inline-block align-bottom bg-white rounded-3xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-gray-100 font-sans">
                    <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-gray-900" id="dsr-modal-title">
                        {editingDsrRule ? 'تعديل قاعدة الاستقطاع DSR' : 'إضافة قاعدة استقطاع DSR جديدة'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsDsrModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none text-lg font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      {formDsrError && (
                        <div className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-2xl border border-red-100 font-semibold">
                          ⚠️ {formDsrError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Bank Select */}
                        <div className="space-y-1.5 text-right">
                          <label htmlFor="form-dsr-bank" className="block text-xs font-bold text-gray-600">البنك:</label>
                          <select
                            id="form-dsr-bank"
                            value={formDsrBankId}
                            onChange={(e) => setFormDsrBankId(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {DSR_BANKS.map(b => (
                              <option key={b.id} value={b.id}>{b.nameAr}</option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Product Type Select */}
                        <div className="space-y-1.5 text-right">
                          <label htmlFor="form-dsr-product" className="block text-xs font-bold text-gray-600">نوع المنتج:</label>
                          <select
                            id="form-dsr-product"
                            value={formDsrProductType}
                            onChange={(e) => {
                              const newProdType = e.target.value as any;
                              setFormDsrProductType(newProdType);
                              if (newProdType === 'personal_only') {
                                setFormDsrSupportType('none');
                              }
                            }}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {DSR_PRODUCT_TYPES.map(p => (
                              <option key={p.id} value={p.id}>{p.nameAr}</option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Support Type Select */}
                        <div className="space-y-1.5 text-right">
                          <label htmlFor="form-dsr-support" className="block text-xs font-bold text-gray-600">نوع الدعم السكني:</label>
                          <select
                            id="form-dsr-support"
                            value={formDsrSupportType}
                            disabled={formDsrProductType === 'personal_only'}
                            onChange={(e) => setFormDsrSupportType(e.target.value as any)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {DSR_SUPPORT_TYPES.map(s => (
                              <option key={s.id} value={s.id}>{s.nameAr}</option>
                            ))}
                          </select>
                          {formDsrProductType === 'personal_only' && (
                            <p className="text-[10px] text-amber-600 font-semibold mt-1">الدعم يكون "غير مدعوم" فقط مع الشخصي.</p>
                          )}
                        </div>

                        {/* 4. Customer Stage Select */}
                        <div className="space-y-1.5 text-right">
                          <label htmlFor="form-dsr-stage" className="block text-xs font-bold text-gray-600">مرحلة العميل:</label>
                          <select
                            id="form-dsr-stage"
                            value={formDsrCustomerStage}
                            onChange={(e) => setFormDsrCustomerStage(e.target.value as any)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {DSR_CUSTOMER_STAGES.map(st => (
                              <option key={st.id} value={st.id}>{st.nameAr}</option>
                            ))}
                          </select>
                        </div>

                        {/* 5. DSR percentage Text Input */}
                        <div className="space-y-1.5 text-right">
                          <label htmlFor="form-dsr-percent" className="block text-xs font-bold text-gray-600">نسبة الاستقطاع %:</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            id="form-dsr-percent"
                            value={formDsrPercentStr}
                            onChange={(e) => {
                              // Accept any valid text input, don't force convert to number until save
                              setFormDsrPercentStr(e.target.value);
                            }}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            placeholder="مثال: 55 أو 33.33"
                          />
                        </div>

                        {/* 6. Deduct obligations switch */}
                        <div className="space-y-1.5 text-right flex flex-col justify-end">
                          <label className="block text-xs font-bold text-gray-605 mb-2">خصم الالتزامات القائمة:</label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setFormDsrDeductExisting(!formDsrDeductExisting)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                formDsrDeductExisting ? 'bg-[#0057B8]' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  formDsrDeductExisting ? '-translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span className="text-xs font-bold text-gray-600">
                              {formDsrDeductExisting ? 'نعم (يتم خصمها)' : 'لا (تستبعد من الحسبة)'}
                            </span>
                          </div>
                        </div>

                        {/* 7. Active switch */}
                        <div className="space-y-1.5 text-right flex flex-col justify-end">
                          <label className="block text-xs font-bold text-gray-605 mb-2">الحالة (مفعل):</label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setFormDsrActive(!formDsrActive)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                formDsrActive ? 'bg-[#0057B8]' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  formDsrActive ? '-translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span className="text-xs font-bold text-gray-600">
                              {formDsrActive ? 'نشط / مفعل' : 'معطل / غير نشط'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-100 font-bold text-xs">
                      <button
                        type="button"
                        onClick={handleSaveDsrForm}
                        className="bg-[#0057B8] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer font-sans"
                      >
                        {editingDsrRule ? 'تعديل القاعدة' : 'حفظ وإضافة'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDsrModalOpen(false)}
                        className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 9: SUPPORT (SAKANI) */}
        {adminSubPage === 'support' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#111827]">جدول الدعم السكني بوزارة الإسكان (سكني)</h2>
            <p className="text-xs text-[#6B7280]">تعديل شرائح الدعم الشهري المتواصل المعتمدة بالريال السعودي بدلالة الدخل.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#E5E7EB] rounded-2xl p-5 bg-white">
                <h3 className="font-bold text-xs text-[#111827] border-b pb-2 mb-3">حوافز ودعم سكني الشهري المتواصل</h3>
                <div className="space-y-3">
                  {supportSettings.monthlyBrackets.map((br, index) => (
                    <div key={index} className="flex justify-between items-center text-xs font-semibold bg-gray-50 p-2.5 rounded-xl border border-[#F1F5F9]">
                      <span className="text-gray-500 font-sans">من {br.fromSalary.toLocaleString('ar-SA')} إلى {br.toSalary > 90000 ? 'أكثر' : br.toSalary.toLocaleString('ar-SA')} ريال:</span>
                      <div className="flex items-center gap-1.5">
                        <NumericInput
                          id={`support-monthly-bracket-${index}`}
                          value={br.supportAmount}
                          onChange={(val) => {
                            const newBrackets = [...supportSettings.monthlyBrackets];
                            newBrackets[index].supportAmount = val;
                            setSupportSettings({ ...supportSettings, monthlyBrackets: newBrackets });
                          }}
                          allowDecimals={true}
                          className="w-16 text-center bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs font-semibold"
                        />
                        <span className="text-gray-400">ريال / شهرياً</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-[#E5E7EB] rounded-2xl p-5 bg-white flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs text-[#111827] border-b pb-2 mb-3">دعم الدفعة المسبقة (غير المستردة)</h3>
                  <div className="space-y-3 text-xs">
                    {supportSettings.downpaymentBrackets.map((br, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
                        <span className="text-gray-500 font-sans">الرواتب من {br.fromSalary} إلى {br.toSalary > 90000 ? 'أكثر' : br.toSalary}:</span>
                        <span className="font-bold text-[#0EA5A4]">{(br.supportAmount).toLocaleString('ar-SA')} ريال</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-xs text-amber-800 leading-relaxed font-sans mt-4">
                  نصيحة المنظم: يوصى بعدم إضافة دعم الدفعة المسبقة إلى أصل الدين (Loan Principal)، بل احتسابه فقط في نهاية الحسبة لتكبير القدرة الشرائية لتفادي فرض فوائد البنك على منحة الدولة.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 10: PERSONAL FINANCE */}
        {adminSubPage === 'personal' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">عقود ومعاملات التمويل الشخصي</h2>
                <p className="text-xs text-[#6B7280]">تعديل الضوابط والمضاعفات والمستقطعات الخاصة بمنتجات التمويل الشخصي (الافتراضي العام والخاص بالبنوك).</p>
              </div>
              <button
                type="button"
                onClick={openAddPfModal}
                className="bg-[#0057B8] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer self-start"
              >
                + إضافة قاعدة تمويل شخصي
              </button>
            </div>

            {/* Rules Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs text-[#111827]">
                  <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="p-4 font-bold">البنك</th>
                      <th className="p-4 font-bold">نوع المسار</th>
                      <th className="p-4 font-bold">حالة العميل</th>
                      <th className="p-4 font-bold text-center">DSR الشخصي</th>
                      <th className="p-4 font-bold text-center">مدة التمويل (بالشهور)</th>
                      <th className="p-4 font-bold text-center">معامل التمويل</th>
                      <th className="p-4 font-bold">طريقة الحساب</th>
                      <th className="p-4 font-bold text-center">الهامش للعرض</th>
                      <th className="p-4 font-bold text-center">أقل راتب</th>
                      <th className="p-4 font-bold text-center">مفعل</th>
                      <th className="p-4 font-bold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-semibold">
                    {personalRules && personalRules.length > 0 ? (
                      personalRules.map((rule, idx) => {
                        const b = banks?.find(bk => bk.id === rule.bankId);
                        const bankName = rule.bankId === 'all' ? '💼 الافتراضي العام (Default)' : b?.nameAr || rule.bankId;
                        const pathLabel = rule.pathType === 'real_estate_with_new_personal' ? 'عقاري + شخصي جديد' : 'تمويل شخصي فقط';
                        const statusLabel = rule.customerStatus === 'retired' ? 'متقاعد' : 'موظف نشط';
                        const ruleId = rule.id || `rule-${rule.bankId}-${idx}`;
                        return (
                          <tr key={ruleId} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-xs font-bold text-slate-800">{bankName}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rule.pathType === 'real_estate_with_new_personal' ? 'bg-[#0E9A9B]/10 text-[#0EA5A4]' : 'bg-blue-50 text-blue-700'}`}>
                                {pathLabel}
                              </span>
                            </td>
                            <td className="p-4 text-xs">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${rule.customerStatus === 'retired' ? 'bg-amber-50 text-amber-700 font-bold' : 'bg-gray-100 text-gray-700'}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="p-4 text-center font-sans">{(rule.dsrPercentage ?? 0)}%</td>
                            <td className="p-4 text-center font-sans">{(rule.termMonths ?? 0)} شهراً</td>
                            <td className="p-4 text-center font-sans">{(rule.financeCoefficient ?? 0)}</td>
                            <td className="p-4 text-xs">
                              <span className="text-gray-500 font-sans">
                                {rule.calculationMethod === 'pmt' ? 'PMT' : 'Multiplier'}
                              </span>
                            </td>
                            <td className="p-4 text-center font-sans">{(rule.annualMargin ?? 0)}%</td>
                            <td className="p-4 text-center font-sans">{(rule.minSalary ?? 0).toLocaleString('ar-SA')} ريال</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setPersonalRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r))}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  rule.isActive ? 'bg-[#0057B8]' : 'bg-slate-200'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    rule.isActive ? '-translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditPfModal(rule)}
                                  className="text-[#0057B8] hover:bg-blue-50 px-2 py-1 rounded transition-colors text-xs font-bold cursor-pointer"
                                >
                                  تعديل
                                </button>
                                {rule.bankId !== 'all' && (
                                  <button
                                    type="button"
                                    onClick={() => rule.id && deletePfRule(rule.id)}
                                    className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                    title="حذف القاعدة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-gray-400">لا توجد قواعد سارية حالياً.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PERSONAL FINANCE MODAL POPUP */}
            {isPfModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="pf-modal-title" role="dialog" aria-modal="true">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" onClick={() => setIsPfModalOpen(false)}></div>

                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                  <div className="relative z-55 inline-block align-bottom bg-white rounded-3xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-gray-100">
                    <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-gray-900" id="pf-modal-title">
                        {editingPfRule ? 'تعديل قاعدة معالجة التمويل الشخصي' : 'إضافة قاعدة تمويل شخصي جديدة'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsPfModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none text-lg font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      {pfError && (
                        <div className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-2xl border border-red-100 font-semibold">
                          ⚠️ {pfError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Bank Choice */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600">البنك أو الافتراضي العام:</label>
                          <select
                            id="pf-form-bank"
                            value={formPfBankId}
                            onChange={(e) => setFormPfBankId(e.target.value)}
                            disabled={!!editingPfRule}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                          >
                            <option value="all">💼 الافتراضي العام (Default)</option>
                            {formBanksList.map(bk => (
                              <option key={bk.id} value={bk.id}>{bk.nameAr}</option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Path Type Choice */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600">نوع المسار:</label>
                          <select
                            id="pf-form-pathtype"
                            value={formPfPathType}
                            onChange={(e) => setFormPfPathType(e.target.value as any)}
                            disabled={!!editingPfRule}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                          >
                            <option value="personal_only">تمويل شخصي فقط</option>
                            <option value="real_estate_with_new_personal">عقاري + شخصي جديد</option>
                          </select>
                        </div>

                        {/* 3. Customer Status Choice */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600">حالة العميل:</label>
                          <select
                            id="pf-form-customerstatus"
                            value={formPfCustomerStatus}
                            onChange={(e) => setFormPfCustomerStatus(e.target.value as any)}
                            disabled={!!editingPfRule}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                          >
                            <option value="active_employee">موظف نشط</option>
                            <option value="retired">متقاعد</option>
                          </select>
                        </div>

                        {/* 4. Dsr percentage */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600">DSR التمويل الشخصي (%):</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            id="pf-form-dsr"
                            value={formPfDsr}
                            onChange={(e) => setFormPfDsr(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="مثال: 33"
                          />
                        </div>

                        {/* 5. Term Months */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600">مدة التمويل (بالشهور):</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            id="pf-form-term"
                            value={formPfTerm}
                            onChange={(e) => setFormPfTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="مثال: 60"
                          />
                        </div>

                        {/* 6. Multiplier coeff */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600">معامل التمويل (Multiplier):</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            id="pf-form-coeff"
                            value={formPfCoeff}
                            onChange={(e) => setFormPfCoeff(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="مثال: 50.42"
                          />
                        </div>

                        {/* 7. Profit method choice */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600">طريقة الحساب:</label>
                          <select
                            id="pf-form-calcmethod"
                            value={formPfCalcMethod}
                            onChange={(e) => setFormPfCalcMethod(e.target.value as any)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="multiplier">معامل التمويل (Multiplier)</option>
                            <option value="pmt">معادلة PMT</option>
                          </select>
                        </div>

                        {/* 8. Margin percentage */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600">هامش الربح للعرض (%):</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            id="pf-form-margin"
                            value={formPfMargin}
                            onChange={(e) => setFormPfMargin(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="مثال: 2.50"
                          />
                        </div>

                        {/* 9. Minimum Salary */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-gray-600">الحد الأدنى للراتب:</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            id="pf-form-minsalary"
                            value={formPfMinSalary}
                            onChange={(e) => setFormPfMinSalary(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="مثال: 4000"
                          />
                        </div>

                        {/* 10. Active */}
                        <div className="flex items-center gap-3 pt-6">
                          <span className="text-xs font-bold text-gray-600">حالة التفعيل:</span>
                          <button
                            type="button"
                            onClick={() => setFormPfActive(!formPfActive)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              formPfActive ? 'bg-[#0057B8]' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                formPfActive ? '-translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-100 font-bold text-xs">
                      <button
                        type="button"
                        onClick={savePfRule}
                        className="bg-[#0057B8] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer"
                      >
                        {editingPfRule ? 'تحديث القاعدة' : 'حفظ وإضافة'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPfModalOpen(false)}
                        className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 11: ADVANCED RULES */}
        {adminSubPage === 'advanced' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#111827]">القواعد الائتمانية المتقدمة للقبول</h2>
            <p className="text-xs text-[#6B7280]">صياغة قواعد الاستثناءات وتعديلات الهامش المباشرة بناءً على وضع العميل.</p>

            <div className="space-y-4">
              {advancedRules.map((rule) => {
                const b = banks.find(bk => bk.id === rule.bankId);
                return (
                  <div key={rule.id} className="border border-slate-200 rounded-2xl p-5 bg-white relative">
                    <div className="absolute top-4 left-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rule.actionType === 'reject' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {rule.actionType === 'reject' ? 'رفض فوري' : 'تعديل المعامل'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-[#111827] text-xs mb-1.5 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-slate-500" />
                      <span>{rule.name}</span>
                    </h4>
                    <p className="text-[11px] text-[#6B7280] leading-relaxed mb-3">صيغة الشرط: <code className="bg-slate-50 px-1 py-0.5 rounded font-mono text-gray-500">{rule.conditionFormula}</code></p>
                    
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] font-semibold text-slate-600 flex justify-between">
                      <span>إجراء الاستجابة:</span>
                      <strong className="text-slate-700">{rule.actionValue}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 12: PREVIOUS CALCULATIONS LOG */}
        {adminSubPage === 'logs' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#111827]">التشخيص وسجل معالجة الحسبات</h2>
            <p className="text-xs text-[#6B7280]">أرشيف كامل لكافّة العمليات الحسابية المتزامنة المنفذة من واجهة العميل للتشخيص والمراجعة.</p>

            <div className="space-y-4">
              {calculationLogs.map((log) => {
                const b = banks.find(bk => bk.id === log.bankId);
                const isApproved = log.status === 'approved';
                const isWarning = log.status === 'warning';

                return (
                  <div key={log.id} className="border border-[#E5E7EB] rounded-2xl p-5 bg-white hover:shadow-xs transition-all">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b border-[#F1F5F9] pb-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded bg-gradient-to-br ${b?.logoColor || 'from-slate-700 to-slate-900'} text-white flex items-center justify-center font-bold text-[10px]`}>
                          {b?.logoText || 'بنك'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-[#111827]">{b?.nameAr || log.bankId}</h4>
                          <span className="text-[10px] text-gray-400 font-sans">{new Date(log.timestamp).toLocaleString('ar-SA')}</span>
                        </div>
                      </div>

                      <div>
                        {isApproved && (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">
                            مقبول بنجاح
                          </span>
                        )}
                        {isWarning && (
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200">
                            مقبول بملاحظات
                          </span>
                        )}
                        {!isApproved && !isWarning && (
                          <span className="px-3 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-lg border border-red-200">
                            مرفوض ائتمانياً
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold select-none mb-4">
                      <div>
                        <span className="text-gray-400 block mb-0.5">صافي الراتب:</span>
                        <span className="text-slate-700">{(log.netSalary).toLocaleString('ar-SA')} ريال</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">مدة السداد العقاري:</span>
                        <span className="text-slate-700">{log.termMonths} شهر ({Math.floor(log.termMonths / 12)} سنة)</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">الهامش البنكي المحسوب:</span>
                        <span className="text-[#0057B8]">{log.margin}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">إجمالي التمويل:</span>
                        <span className="text-emerald-600">{(log.financeAmount).toLocaleString('ar-SA')} ريال</span>
                      </div>
                    </div>

                    {/* Step log trace */}
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-[#F1F5F9] text-xs">
                      <span className="font-bold text-gray-600 block mb-2">أثر التشخيص والأخطاء المستقرة:</span>
                      <ul className="space-y-1 text-gray-650 pr-4 list-decimal select-none font-sans">
                        {log.diagnosticSteps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">{step}</li>
                        ))}
                      </ul>
                      {log.rejectionReason && (
                        <div className="text-red-700 bg-red-50/70 border border-red-100 rounded-lg p-2.5 mt-3">
                          <strong>سبب الاستبعاد:</strong> {log.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 13: SUBSCRIBERS LIST */}
        {adminSubPage === 'users' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#111827]">المستخدمون وعضويات المكاتب والاشتراكات</h2>
            <p className="text-xs text-[#6B7280]">لوحة معاينة اشتراكات المكاتب العقارية المستفيدة من خدمات الحسبة التضامنية.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-[#111827]">
                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-gray-500">
                  <tr>
                    <th className="p-3">اسم المستشار / العضو</th>
                    <th className="p-3">البريد الإلكتروني</th>
                    <th className="p-3 text-center">باقة العضوية</th>
                    <th className="p-3 text-center">إجمالي المعالجات</th>
                    <th className="p-3 text-center">تاريخ الصلاحية</th>
                    <th className="p-3 text-center">حالة الحساب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] font-semibold">
                  {userSubscriptions.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0057B8]" />
                        <span>{user.username}</span>
                      </td>
                      <td className="p-3 text-gray-500 font-mono text-[11px]">{user.email}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.plan === 'enterprise' ? 'bg-indigo-50 text-indigo-700' :
                          user.plan === 'premium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-[#475569]'
                        }`}>
                          {user.plan === 'enterprise' ? 'شركات' : user.plan === 'premium' ? 'مستشار مستقل' : 'مجانية'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono">{user.calculationsCount}</td>
                      <td className="p-3 text-center font-mono text-gray-500">{user.expiryDate}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {user.isActive ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
