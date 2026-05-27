import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { calculateBanksFinancing } from '../../lib/finance-engine';
import { SectorId, ProductId, SupportType, TermMode, BankCalculationResult } from '../../types';
import { 
  Home, User, Coins, Briefcase, Calendar, Scale,
  ChevronLeft, ChevronRight, HelpCircle, AlertCircle, Info, Calculator
} from 'lucide-react';
import ResultsGrid from '../results/ResultsGrid';
import NumericInput from './NumericInput';

export default function StepWizard() {
  const {
    banks,
    products,
    militaryRanks,
    salaryRules,
    pensionRules,
    marginRules,
    dsrRules,
    supportSettings,
    personalRules,
    setCalculationLogs
  } = useAppState();

  // Wizard active step (1 to 7)
  const [currentStep, setCurrentStep] = useState(1);
  const [results, setResults] = useState<BankCalculationResult[] | null>(null);

  // --- Step Form Values State ---
  const [mainFinanceType, setMainFinanceType] = useState<'real_estate' | 'personal_only' | 'real_estate_with_existing_personal'>('real_estate');
  const [realEstateSubType, setRealEstateSubType] = useState<'real_estate_only' | 'real_estate_with_new_personal'>('real_estate_only');
  const [customerStatus, setCustomerStatus] = useState<'active_employee' | 'retired'>('active_employee');

  const [productId, setProductId] = useState<ProductId>('real_estate');
  const [sectorId, setSectorId] = useState<SectorId>('government_civilian');
  const [rankId, setRankId] = useState<string>('jundi');

  // Dates
  const [birthYear, setBirthYear] = useState<number>(1990);
  const [birthMonth, setBirthMonth] = useState<number>(1);
  const [birthDay, setBirthDay] = useState<number>(1);
  const [birthCalendar, setBirthCalendar] = useState<'gregorian' | 'hijri'>('gregorian');

  const [appointmentYear, setAppointmentYear] = useState<number>(2015);
  const [appointmentMonth, setAppointmentMonth] = useState<number>(1);
  const [appointmentDay, setAppointmentDay] = useState<number>(1);
  const [appointmentCalendar, setAppointmentCalendar] = useState<'gregorian' | 'hijri'>('gregorian');

  // Salary
  const [salaryMode, setSalaryMode] = useState<'direct' | 'details'>('direct');
  const [directNetSalary, setDirectNetSalary] = useState<number>(12000);
  const [directPensionSalary, setDirectPensionSalary] = useState<number>(8000);
  const [basicSalary, setBasicSalary] = useState<number>(9000);
  const [housingAllowance, setHousingAllowance] = useState<number>(2250);
  const [otherAllowances, setOtherAllowances] = useState<number>(1500);

  // Finance details
  const [supportType, setSupportType] = useState<SupportType>('none');
  const [selectedBankId, setSelectedBankId] = useState<string>('all');
  const [termMode, setTermMode] = useState<TermMode>('max');
  const [manualTermYears, setManualTermYears] = useState<number>(25);

  const [existingPersonalLoanPayment, setExistingPersonalLoanPayment] = useState<number>(0);
  const [otherObligations, setOtherObligations] = useState<number>(0);
  const [obligations, setObligations] = useState<number>(0);

  // Validation errors
  const [errors, setErrors] = useState<string[]>([]);

  // Compute live local calculated Net salary to aid real-time UI display
  const [localCalculatedNet, setLocalCalculatedNet] = useState(12000);

  // Sync Product ID with Main/Sub choices
  useEffect(() => {
    if (mainFinanceType === 'personal_only') {
      setProductId('personal');
    } else if (mainFinanceType === 'real_estate_with_existing_personal') {
      setProductId('real_estate_with_personal_existing');
    } else {
      if (realEstateSubType === 'real_estate_only') {
        setProductId('real_estate');
      } else {
        setProductId('both');
      }
    }
  }, [mainFinanceType, realEstateSubType]);

  // Sync Obligations with inputs
  useEffect(() => {
    if (mainFinanceType === 'real_estate_with_existing_personal') {
      setObligations(existingPersonalLoanPayment + otherObligations);
    } else {
      setObligations(otherObligations);
    }
  }, [mainFinanceType, existingPersonalLoanPayment, otherObligations]);

  useEffect(() => {
    if (salaryMode === 'direct') {
      setLocalCalculatedNet(directNetSalary);
    } else {
      const rule = salaryRules.find(r => r.sectorId === sectorId && r.isActive) || {
        deductionPercentage: 9.0,
        deductionBase: 'basic_housing' as const
      };
      const gross = basicSalary + housingAllowance + otherAllowances;
      let dBase = basicSalary + housingAllowance;
      if (rule.deductionBase === 'basic_only') dBase = basicSalary;
      else if (rule.deductionBase === 'total') dBase = gross;

      const deduction = (dBase * rule.deductionPercentage) / 100;
      setLocalCalculatedNet(Math.round(gross - deduction));
    }
  }, [salaryMode, directNetSalary, basicSalary, housingAllowance, otherAllowances, sectorId, salaryRules]);

  // Dynamic step structure definition
  type StepId = 
    | 'main_type'
    | 're_sub_type'
    | 'customer_status'
    | 'sector'
    | 'personal_info'
    | 'salary'
    | 'finance_options'
    | 'results';

  const realEstateFlow: StepId[] = [
    'main_type',
    're_sub_type',
    'sector',
    'personal_info',
    'salary',
    'finance_options',
    'results'
  ];

  const personalOnlyFlow: StepId[] = [
    'main_type',
    'customer_status',
    'salary',
    'finance_options',
    'results'
  ];

  const existingPersonalFlow: StepId[] = [
    'main_type',
    'sector',
    'personal_info',
    'salary',
    'finance_options',
    'results'
  ];

  const getActiveFlow = (): StepId[] => {
    if (mainFinanceType === 'real_estate') return realEstateFlow;
    if (mainFinanceType === 'personal_only') return personalOnlyFlow;
    return existingPersonalFlow;
  };

  const flow = getActiveFlow();
  const activeStepId = flow[currentStep - 1] || 'main_type';

  const hijriToGreg = (year: number, calendar: 'gregorian' | 'hijri'): number => {
    if (calendar === 'hijri') {
      return Math.round(year * 0.9707 + 621.57);
    }
    return year;
  };

  // Handle Step validations
  const validateStep = (stepNumber: number): boolean => {
    const stepErrors: string[] = [];
    const flow = getActiveFlow();
    const stepId = flow[stepNumber - 1];

    if (stepId === 'personal_info') {
      const currentYear = new Date().getFullYear();

      // Validate birth month & year ranges
      if (!birthMonth || birthMonth < 1 || birthMonth > 12) {
        stepErrors.push('يرجى إدخال شهر ميلاد صحيح بين 1 و 12.');
      }
      const minBirthYear = birthCalendar === 'gregorian' ? 1940 : 1360;
      const maxBirthYear = birthCalendar === 'gregorian' ? 2008 : 1429;
      if (!birthYear || birthYear < minBirthYear || birthYear > maxBirthYear) {
        stepErrors.push(`يرجى إدخال سنة ميلاد صحيحة بين ${minBirthYear} و ${maxBirthYear} للتقويم المختار.`);
      }

      // Check age only if birthYear is in range
      if (birthYear && birthYear >= minBirthYear && birthYear <= maxBirthYear) {
        const ageYears = currentYear - hijriToGreg(birthYear, birthCalendar);
        if (ageYears < 18) {
          stepErrors.push('يجب ألا يقل عمر طالب التمويل عن 18 عاماً.');
        }
      }

      if (sectorId !== 'retired') {
        if (!appointmentMonth || appointmentMonth < 1 || appointmentMonth > 12) {
          stepErrors.push('يرجى إدخال شهر تعيين صحيح بين 1 و 12.');
        }
        const minAppYear = appointmentCalendar === 'gregorian' ? 1970 : 1390;
        const maxAppYear = appointmentCalendar === 'gregorian' ? 2026 : 1447;
        if (!appointmentYear || appointmentYear < minAppYear || appointmentYear > maxAppYear) {
          stepErrors.push(`يرجى إدخال سنة تعيين صحيحة بين ${minAppYear} و ${maxAppYear} للتقويم المختار.`);
        }

        if (appointmentYear && birthYear) {
          if (hijriToGreg(appointmentYear, appointmentCalendar) < hijriToGreg(birthYear, birthCalendar) + 15) {
            stepErrors.push('تاريخ التعيين لا يمكن أن يسبق السن القانوني للعمل من تاريخ الميلاد.');
          }
          if (appointmentYear > currentYear) {
            stepErrors.push('تاريخ التعيين لا يمكن أن يكون وتاريخاً مستقبلياً من اليوم.');
          }
        }
      }
    }

    if (stepId === 'salary') {
      if (salaryMode === 'direct' || sectorId === 'retired') {
        if (sectorId === 'retired' && directPensionSalary <= 0) {
          stepErrors.push('يرجى إدخال الراتب التقاعدي الصافي المستلم صحيح أكبر من الصفر.');
        } else if (sectorId !== 'retired' && directNetSalary <= 0) {
          stepErrors.push('يرجى إدخال مبلغ الراتب الصافي الكلي صحيح أكبر من الصفر.');
        }
      } else {
        if (basicSalary <= 0) {
          stepErrors.push('يرجى إدخال الراتب الأساسي الخاص بك بدقة.');
        }
      }
    }

    if (stepId === 'finance_options') {
      if (mainFinanceType !== 'personal_only') {
        if (termMode === 'manual') {
          if (!manualTermYears || manualTermYears < 1 || manualTermYears > 30) {
            stepErrors.push('يرجى إدخال مدة تمويل مستهدفة صحيحة بين 1 و 30 سنة.');
          }
        }
      }
    }

    setErrors(stepErrors);
    return stepErrors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setErrors([]);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setErrors([]);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Trigger Calculations
  const triggerCalculations = () => {
    if (!validateStep(currentStep)) return;

    const birthYearGregorian = hijriToGreg(birthYear, birthCalendar);
    const appointmentYearGregorian = hijriToGreg(appointmentYear, appointmentCalendar);

    const calcParams = {
      sectorId,
      productId,
      birthYear: birthYearGregorian,
      birthMonth,
      appointmentYear: sectorId === 'retired' ? undefined : appointmentYearGregorian,
      appointmentMonth: sectorId === 'retired' ? undefined : appointmentMonth,
      rankId: sectorId === 'military' ? rankId : undefined,
      salaryMode,
      basicSalary,
      housingAllowance,
      otherAllowances,
      directNetSalary,
      directPensionSalary,
      obligations,
      supportType,
      selectedBankId,
      termMode,
      manualTermMonths: termMode === 'manual' ? manualTermYears * 12 : undefined,

      banks,
      products,
      militaryRanks,
      salaryRules,
      pensionRules,
      marginRules,
      dsrRules,
      supportSettings,
      personalRules
    };

    const calculationResults = calculateBanksFinancing(calcParams);
    setResults(calculationResults);

    // Save calculation to logs state to populate Admin Diagnostics log history!
    const bestMatch = calculationResults[0];
    if (bestMatch) {
      const newLog = {
        id: `log_calc_${Date.now()}`,
        timestamp: new Date().toISOString(),
        bankId: bestMatch.bankId,
        productId,
        netSalary: bestMatch.netSalary,
        termMonths: bestMatch.termMonths,
        margin: bestMatch.annualMargin,
        dsrBefore: bestMatch.dsrUsed,
        financeAmount: bestMatch.totalPurchasingPower,
        status: bestMatch.status,
        rejectionReason: bestMatch.rejectionReason,
        diagnosticSteps: bestMatch.diagnosticSteps
      };
      setCalculationLogs(prev => [newLog, ...prev]);
    }

    setCurrentStep(flow.length);
  };

  const restartWizard = () => {
    setResults(null);
    setCurrentStep(1);
  };

  // Generative options range helper
  const yearsRange = (from: number, to: number) => {
    const arr = [];
    for (let i = from; i <= to; i++) {
      arr.push(i);
    }
    return arr;
  };

  return (
    <div className="w-full bg-[#F5F7FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Step Wizard visual Progress stepper indicators */}
        {currentStep < flow.length && (
          <div className="mb-8 select-none">
            <div className="flex items-center justify-between">
              {flow.slice(0, -1).map((stepId, index) => {
                const s = index + 1;
                const isActive = s === currentStep;
                const isCompleted = s < currentStep;

                let stepLabel = '';
                if (stepId === 'main_type') stepLabel = 'نوع الحسبة';
                else if (stepId === 're_sub_type') stepLabel = 'نوع العقاري';
                else if (stepId === 'sector') stepLabel = 'جهة العمل';
                else if (stepId === 'customer_status') stepLabel = 'حالة العميل';
                else if (stepId === 'personal_info') stepLabel = 'البيانات الشخصية';
                else if (stepId === 'salary') stepLabel = 'الراتب والدخل';
                else if (stepId === 'finance_options') stepLabel = 'خيارات الحسبة';

                return (
                  <div key={stepId} className="flex flex-col items-center flex-1 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                      isActive
                        ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-md scale-110'
                        : isCompleted
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}>
                      {isCompleted ? '✓' : s}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold mt-2 ${isActive ? 'text-[#0057B8] font-bold' : 'text-[#6B7280]'}`}>
                      {stepLabel}
                    </span>
                    {index < flow.length - 2 && (
                      <div className={`absolute top-5 -left-1/2 w-full h-[2px] -z-10 ${isCompleted ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Validation Alert */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-1">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>تنبيه التحقق من صحة المدخلات:</span>
            </div>
            {errors.map((err, i) => (
              <p key={i} className="list-disc pr-4">{err}</p>
            ))}
          </div>
        )}

        {/* Main Step Cards Form container */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 md:p-10 shadow-xs">
          
          {/* STEP 1: Main Type Selection */}
          {activeStepId === 'main_type' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center max-w-lg mx-auto mb-8">
                <h3 className="text-xl font-bold text-[#111827]">اختر التمويل المراد احتسابه</h3>
                <p className="text-sm text-[#6B7280] mt-1">نوفر نماذج حسابات دقيقة للمرونة العقارية أو التمويل الشخصي القصير أو الاستحقاقات المدمجة.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  id="re-type-card"
                  onClick={() => setMainFinanceType('real_estate')}
                  className={`border rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-[#0057B8] ${
                    mainFinanceType === 'real_estate' ? 'border-[#0057B8] bg-[#0057B8]/5' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 bg-[#0057B8]/10 text-[#0057B8] rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Home className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-[#111827] text-sm">تمويل عقاري</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">لحساب التمويل العقاري، مع إمكانية اختيار عقاري فقط أو عقاري مع شخصي جديد في الخطوة التالية.</p>
                </div>

                <div
                  id="pf-type-card"
                  onClick={() => setMainFinanceType('personal_only')}
                  className={`border rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-[#0057B8] ${
                    mainFinanceType === 'personal_only' ? 'border-[#0057B8] bg-[#0057B8]/5' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Coins className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-[#111827] text-sm">تمويل شخصي فقط</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">لحساب التمويل الشخصي المستقل لمدة قصيرة.</p>
                </div>

                <div
                  id="both-type-card"
                  onClick={() => setMainFinanceType('real_estate_with_existing_personal')}
                  className={`border rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-[#0057B8] ${
                    mainFinanceType === 'real_estate_with_existing_personal' ? 'border-[#0057B8] bg-[#0057B8]/5' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 bg-teal-50 text-[#0EA5A4] rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Scale className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-[#111827] text-sm">عقاري مع شخصي قائم</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">لحساب التمويل العقاري مع وجود قسط شخصي قائم يتم خصمه من الاستقطاع.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP: Customer Status Selection for Personal Only */}
          {activeStepId === 'customer_status' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center max-w-lg mx-auto mb-8">
                <h3 className="text-xl font-bold text-[#111827]">ما هي حالة العميل الوظيفية؟</h3>
                <p className="text-sm text-[#6B7280] mt-1">يرجى اختيار حالة العميل الوظيفية للبدء في توجيه الاحتساب الرياضي.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div
                  id="cs-active-card"
                  onClick={() => {
                    setCustomerStatus('active_employee');
                    if (sectorId === 'retired') {
                      setSectorId('government_civilian');
                    }
                  }}
                  className={`border rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-[#0057B8] ${
                    customerStatus === 'active_employee' ? 'border-[#0057B8] bg-[#0057B8]/5' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 bg-blue-50 text-[#0057B8] rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <User className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-[#111827] text-sm">موظف نشط</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">حكومي، عسكري، أو قطاع خاص.</p>
                </div>

                <div
                  id="cs-retired-card"
                  onClick={() => {
                    setCustomerStatus('retired');
                    setSectorId('retired');
                    setSalaryMode('direct');
                  }}
                  className={`border rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-[#0057B8] ${
                    customerStatus === 'retired' ? 'border-[#0057B8] bg-[#0057B8]/5' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Coins className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-[#111827] text-sm">متقاعد</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">يعتمد الحساب على الراتب التقاعدي الشهري فقط.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1.5: Real Estate Subtype Selection */}
          {activeStepId === 're_sub_type' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center max-w-lg mx-auto mb-8">
                <h3 className="text-xl font-bold text-[#111827]">نوع التمويل العقاري</h3>
                <p className="text-sm text-[#6B7280] mt-1">يرجى تحديد نمط التثبيت العقاري (فردي خالص أو متداخل مع برنامج تمويل شخصي استهلاكي إضافي).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div
                  id="re-sub-only-card"
                  onClick={() => setRealEstateSubType('real_estate_only')}
                  className={`border rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-[#0057B8] ${
                    realEstateSubType === 'real_estate_only' ? 'border-[#0057B8] bg-[#0057B8]/5' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Home className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-[#111827] text-sm">عقاري فقط</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">حساب التمويل العقاري بدون تمويل شخصي جديد.</p>
                </div>

                <div
                  id="re-sub-plus-personal-card"
                  onClick={() => setRealEstateSubType('real_estate_with_new_personal')}
                  className={`border rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-[#0057B8] ${
                    realEstateSubType === 'real_estate_with_new_personal' ? 'border-[#0057B8] bg-[#0057B8]/5' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Scale className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-[#111827] text-sm">عقاري + شخصي جديد</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">حساب التمويل العقاري مع تمويل شخصي جديد ضمن الحسبة.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Employment Sector & Ranks */}
          {activeStepId === 'sector' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center max-w-lg mx-auto mb-8">
                <h3 className="text-xl font-bold text-[#111827]">ما هو القطاع المهني لجهة العمل؟</h3>
                <p className="text-sm text-[#6B7280] mt-1">يحدد نوع القطاع النظير نسب الخصومات التقاعدية وسن التقاعد المهني الإلزامي ونسب الاستقطاع.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'government_civilian', label: 'حكومي مدني', icon: Briefcase },
                  { id: 'military', label: 'عسكري حربي', icon: User },
                  { id: 'private', label: 'القطاع الخاص', icon: Home },
                  { id: 'retired', label: 'متقاعد حالي', icon: Coins }
                ].map((sec) => (
                  <div
                    key={sec.id}
                    onClick={() => {
                      setSectorId(sec.id as SectorId);
                      setSalaryMode('direct'); // Default retired always to direct pension salary net
                    }}
                    className={`border rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      sectorId === sec.id
                        ? 'border-[#0057B8] bg-[#0057B8]/5'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <sec.icon className={`w-6 h-6 mx-auto mb-2 ${sectorId === sec.id ? 'text-[#0057B8]' : 'text-gray-500'}`} />
                    <span className="text-xs font-bold text-[#111827] block">{sec.label}</span>
                  </div>
                ))}
              </div>

              {/* Rank selector shown for military only */}
              {sectorId === 'military' && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mt-6 animate-fade-in">
                  <label className="block text-xs font-bold text-gray-700 mb-2">الرتبة العسكرية للعميل:</label>
                  <select
                    id="rank-select"
                    value={rankId}
                    onChange={(e) => setRankId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8] focus:border-transparent"
                  >
                    {militaryRanks.filter(r => r.isActive).map((rank) => (
                      <option key={rank.id} value={rank.id}>
                        {rank.nameAr} (سن تقاعد الرتبة: {rank.retirementAge} سنة)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Dates and Age Details */}
          {activeStepId === 'personal_info' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center max-w-lg mx-auto mb-8">
                <h3 className="text-xl font-bold text-[#111827]">تاريخ الميلاد وتاريخ مباشرة العمل</h3>
                <p className="text-sm text-[#6B7280] mt-1">تستخدم تواريخك دقيقة لحساب السن بالشهور وأشهر الخدمة النشطة لتأسيس السقف الائتماني العقاري.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dob Card */}
                <div className="border border-gray-200 rounded-2xl p-6 bg-white space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#0057B8]" />
                      <span>تاريخ الميلاد:</span>
                    </span>
                    <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setBirthCalendar('gregorian')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${birthCalendar === 'gregorian' ? 'bg-white text-[#0057B8] shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        ميلادي
                      </button>
                      <button
                        type="button"
                        onClick={() => setBirthCalendar('hijri')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${birthCalendar === 'hijri' ? 'bg-white text-[#0057B8] shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        هجري
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">الشهر (1 - 12)</label>
                      <NumericInput
                        id="birth-month-input"
                        min={1}
                        max={12}
                        allowDecimals={false}
                        placeholder="05"
                        value={birthMonth}
                        onChange={setBirthMonth}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">السنة</label>
                      <NumericInput
                        id="birth-year-input"
                        min={birthCalendar === 'gregorian' ? 1940 : 1360}
                        max={birthCalendar === 'gregorian' ? 2008 : 1429}
                        allowDecimals={false}
                        placeholder={birthCalendar === 'gregorian' ? '1990' : '1410'}
                        value={birthYear}
                        onChange={setBirthYear}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                      />
                    </div>
                  </div>
                </div>

                {/* Appointment date Card (except retiree) */}
                {sectorId !== 'retired' ? (
                  <div className="border border-gray-200 rounded-2xl p-6 bg-white space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-emerald-600" />
                        <span>تاريخ المباشرة / التعيين:</span>
                      </span>
                      <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => setAppointmentCalendar('gregorian')}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${appointmentCalendar === 'gregorian' ? 'bg-white text-[#0057B8] shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                          ميلادي
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppointmentCalendar('hijri')}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${appointmentCalendar === 'hijri' ? 'bg-white text-[#0057B8] shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                          هجري
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">الشهر (1 - 12)</label>
                        <NumericInput
                          id="appointment-month-input"
                          min={1}
                          max={12}
                          allowDecimals={false}
                          placeholder="09"
                          value={appointmentMonth}
                          onChange={setAppointmentMonth}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">السنة</label>
                        <NumericInput
                          id="appointment-year-input"
                          min={appointmentCalendar === 'gregorian' ? 1970 : 1390}
                          max={appointmentCalendar === 'gregorian' ? 2026 : 1447}
                          allowDecimals={false}
                          placeholder={appointmentCalendar === 'gregorian' ? '2015' : '1436'}
                          value={appointmentYear}
                          onChange={setAppointmentYear}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 flex flex-col justify-center animate-fade-in">
                    <p className="text-xs text-amber-800 leading-relaxed font-sans">
                      بما أن القطاع المهني المختار هو <strong>"متقاعد حالي"</strong>، فلن نطلب تاريخ مباشرة العمل ويتم الاعتماد القياسي المطلق على السن لدورة الحياة التمويلية.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Salary & Income */}
          {activeStepId === 'salary' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center max-w-lg mx-auto mb-8">
                <h3 className="text-xl font-bold text-[#111827]">الرواتب والمستحقات والبدلات</h3>
                <p className="text-sm text-[#6B7280] mt-1">يُشترط الإدخال الصحيح للراتب لتقرير عوامل الاستقطاع ونسب الملاءمة ائتمانياً لدى كافة البنوك.</p>
              </div>

              {/* Small Sector Picker for Active Employee in Personal Only Flow */}
              {mainFinanceType === 'personal_only' && customerStatus === 'active_employee' && (
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                  <span className="block text-xs font-bold text-gray-700 mb-3 text-right">القطاع المهني لجهة العمل التابع لها:</span>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSectorId('government_civilian')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        sectorId === 'government_civilian'
                          ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-xs'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      حكومي مدني
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectorId('military')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        sectorId === 'military'
                          ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-xs'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      عسكري
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectorId('private')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        sectorId === 'private'
                          ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-xs'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      قطاع خاص
                    </button>
                  </div>

                  {/* Optional Rank Select for Military in Personal Only flow */}
                  {sectorId === 'military' && (
                    <div className="mt-4 animate-fade-in text-right">
                      <label className="block text-[11px] font-bold text-gray-600 mb-2">الرتبة العسكرية:</label>
                      <select
                        id="rank-select-salary"
                        value={rankId}
                        onChange={(e) => setRankId(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8] focus:border-transparent"
                      >
                        {militaryRanks.filter(r => r.isActive).map((rank) => (
                          <option key={rank.id} value={rank.id}>
                            {rank.nameAr} (سن تقاعد الرتبة: {rank.retirementAge} سنة)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Sub tabs: manual net vs detailed */}
              {sectorId !== 'retired' && (
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6 border border-gray-200">
                  <button
                    id="salary-direct-tab"
                    onClick={() => setSalaryMode('direct')}
                    className={`flex-1 text-center py-2.5 rounded-lg font-bold text-xs transition-all ${
                      salaryMode === 'direct'
                        ? 'bg-white text-[#0057B8] shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    أدخل الراتب الصافي مباشرة
                  </button>
                  <button
                    id="salary-details-tab"
                    onClick={() => setSalaryMode('details')}
                    className={`flex-1 text-center py-2.5 rounded-lg font-bold text-xs transition-all ${
                      salaryMode === 'details'
                        ? 'bg-white text-[#0057B8] shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    أدخل تفاصيل الراتب (الأساسي والبدلات)
                  </button>
                </div>
              )}

              {/* Form elements */}
              {salaryMode === 'direct' || sectorId === 'retired' ? (
                <div className="space-y-4 animate-fade-in">
                  {sectorId === 'retired' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">الراتب التقاعدي الصافي المستلم شهريًا:</label>
                      <div className="relative">
                        <NumericInput
                          id="retired-salary-input"
                          min={0}
                          allowDecimals={true}
                          value={directPensionSalary}
                          onChange={setDirectPensionSalary}
                          placeholder="مثال: 8000"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">ريال سعودي</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">مبلغ الراتب الصافي الكلي (المحول للبنك):</label>
                      <div className="relative">
                        <NumericInput
                          id="direct-salary-input"
                          min={0}
                          allowDecimals={true}
                          value={directNetSalary}
                          onChange={setDirectNetSalary}
                          placeholder="مثال: 12500"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">ريال سعودي</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">الراتب الأساسي:</label>
                    <div className="relative">
                      <NumericInput
                        id="basic-salary-input"
                        min={0}
                        allowDecimals={true}
                        value={basicSalary}
                        onChange={setBasicSalary}
                        placeholder="مثال: 9000"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">ريال</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">بدل السكن:</label>
                    <div className="relative">
                      <NumericInput
                        id="housing-salary-input"
                        min={0}
                        allowDecimals={true}
                        value={housingAllowance}
                        onChange={setHousingAllowance}
                        placeholder="مثال: 2250"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">ريال</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">بدلات أخرى:</label>
                    <div className="relative">
                      <NumericInput
                        id="other-salary-input"
                        min={0}
                        allowDecimals={true}
                        value={otherAllowances}
                        onChange={setOtherAllowances}
                        placeholder="مثال: 1500"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">ريال</span>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-3 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex justify-between items-center text-xs">
                    <span className="text-emerald-800 font-bold">صافي الراتب المتوقع بعد خصم المعاشات:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{(localCalculatedNet).toLocaleString('ar-SA')} ريال سعودي</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Finance Options & Obligations */}
          {activeStepId === 'finance_options' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center max-w-lg mx-auto mb-8">
                <h3 className="text-xl font-bold text-[#111827]">تخصيص مدة التمويل والالتزامات</h3>
                <p className="text-sm text-[#6B7280] mt-1">تتحكم مدة السداد وتفصيل الدعم والالتزامات بجدول الفائدة التراكمية وهوامش أرباح البنوك.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Sakani Program (Mortgage support) - HELD FOR MORTGAGES ONLY */}
                {mainFinanceType !== 'personal_only' && (
                  <div className="border border-gray-200 bg-white rounded-2xl p-5">
                    <label className="block text-xs font-bold text-gray-700 mb-3 flex items-center justify-between">
                      <span>برنامج الدعم السكني (سكني):</span>
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'none', label: 'غير مدعوم' },
                        { id: 'monthly', label: 'دعم شهري' },
                        { id: 'downpayment', label: 'دعم دفعة' }
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSupportType(st.id as SupportType)}
                          className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            supportType === st.id
                              ? 'border-[#0057B8] bg-[#0057B8]/5 text-[#0057B8]'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Term Option Mode - HELD FOR MORTGAGES ONLY */}
                {mainFinanceType !== 'personal_only' && (
                  <div className="border border-[#E5E7EB] bg-white rounded-2xl p-5">
                    <label className="block text-xs font-bold text-gray-700 mb-3">المدة المستهدفة للتمويل العقاري:</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[
                        { id: 'max', label: 'المدة الأقصى' },
                        { id: 'until_retirement', label: 'حتى التقاعد' },
                        { id: 'manual', label: 'اختيار يدوي' }
                      ].map((tm) => (
                        <button
                          key={tm.id}
                          type="button"
                          onClick={() => setTermMode(tm.id as TermMode)}
                          className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            termMode === tm.id
                              ? 'border-[#0057B8] bg-[#0057B8]/5 text-[#0057B8]'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          {tm.label}
                        </button>
                      ))}
                    </div>

                    {termMode === 'manual' && (
                      <div className="mt-3 space-y-2 animate-fade-in">
                        <label className="block text-[10px] font-bold text-gray-400">عدد سنوات التمويل المستهدفة (بحد أقصى 30 سنة):</label>
                        <div className="relative">
                          <NumericInput
                            id="manual-term-years-input"
                            min={1}
                            max={30}
                            allowDecimals={false}
                            placeholder="مثال: 30"
                            value={manualTermYears}
                            onChange={setManualTermYears}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">سنة</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Bank Filter */}
                <div className="border border-gray-200 bg-white rounded-2xl p-5">
                  <label className="block text-xs font-bold text-gray-700 mb-2">جهة التمويل المفضلة:</label>
                  <select
                    id="bank-filter-select"
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                  >
                    <option value="all">كل البنوك النشطة المتاحة (مقارنة العروض)</option>
                    {banks.filter(b => b.isActive).map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.nameAr}</option>
                    ))}
                  </select>
                </div>

                {/* Obligations obligations */}
                <div className="border border-gray-200 bg-white rounded-2xl p-5">
                  {mainFinanceType === 'real_estate_with_existing_personal' ? (
                    <div className="space-y-4 animate-fade-in">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">قسط التمويل الشخصي القائم:</label>
                        <div className="relative">
                          <NumericInput
                            id="existing-personal-payment-input"
                            min={0}
                            allowDecimals={true}
                            value={existingPersonalLoanPayment}
                            onChange={setExistingPersonalLoanPayment}
                            placeholder="مثال: 1200"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">ريال سعودي</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">التزامات شهرية أخرى (إن وجدت):</label>
                        <div className="relative">
                          <NumericInput
                            id="other-obligations-input"
                            min={0}
                            allowDecimals={true}
                            value={otherObligations}
                            onChange={setOtherObligations}
                            placeholder="مثال: 500"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">ريال سعودي</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-bold text-gray-700 mb-2">
                        {mainFinanceType === 'personal_only' 
                          ? 'قسط الالتزامات الشهرية الأخرى (إن وجدت):' 
                          : 'إجمالي الالتزامات الشهرية القائمة حالياً:'}
                      </label>
                      <div className="relative">
                        <NumericInput
                          id="obligations-input"
                          min={0}
                          allowDecimals={true}
                          value={otherObligations}
                          onChange={setOtherObligations}
                          placeholder="مثال: 1500"
                          className="w-full bg-gray-50 border border-[#E5E7EB] rounded-2xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">ريال شه��ياً</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Stepper Buttons */}
          {currentStep < flow.length && (
            <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-8">
              <button
                id="prev-step-btn"
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-semibold text-xs leading-none hover:bg-gray-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>رجوع</span>
              </button>

              {currentStep < flow.length - 1 ? (
                <button
                  id="next-step-btn"
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-[#0057B8] text-white font-semibold text-xs leading-none hover:bg-[#004494] cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-blue-100"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  id="calc-submit-btn"
                  type="button"
                  onClick={triggerCalculations}
                  className="px-8 py-3.5 rounded-xl bg-[#0057B8] text-white font-bold text-sm leading-none hover:bg-[#004494] transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                  <Calculator className="w-4 h-4" />
                  <span>احسب النتائج ومقارنة العروض</span>
                </button>
              )}
            </div>
          )}

          {/* RESULTS DISPLAY PAGE */}
          {currentStep === flow.length && results && (
            <ResultsGrid
              results={results}
              productId={productId}
              onRestart={restartWizard}
              existingPersonalLoanPayment={existingPersonalLoanPayment}
              otherObligations={otherObligations}
              mainFinanceType={mainFinanceType}
            />
          )}

        </div>
      </div>
    </div>
  );
}
