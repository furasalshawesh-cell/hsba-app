import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  Bank,
  ProductAcceptance,
  SectorId,
  MilitaryRank,
  NetSalaryRule,
  PensionRule,
  MarginRule,
  DsrRule,
  SupportSettings,
  PersonalFinanceRules,
  AdvancedRule,
  CalculationLog,
  UserSubscription
} from '../types';

// Type for calculator form data that can be saved
export interface CalculatorFormData {
  mainFinanceType: 'real_estate' | 'personal_only' | 'real_estate_with_existing_personal';
  realEstateSubType: 'real_estate_only' | 'real_estate_with_new_personal';
  customerStatus: 'active_employee' | 'retired';
  sectorId: SectorId;
  rankId: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthCalendar: 'gregorian' | 'hijri';
  appointmentYear: number;
  appointmentMonth: number;
  appointmentDay: number;
  appointmentCalendar: 'gregorian' | 'hijri';
  salaryMode: 'direct' | 'details';
  directNetSalary: number;
  directPensionSalary: number;
  basicSalary: number;
  housingAllowance: number;
  otherAllowances: number;
  supportType: 'none' | 'monthly' | 'downpayment';
  selectedBankId: string;
  termMode: 'max' | 'manual';
  manualTermYears: number;
  existingPersonalLoanPayment: number;
  otherObligations: number;
}

import {
  initialBanks,
  initialProductAcceptance,
  initialMilitaryRanks,
  initialSalaryRules,
  initialPensionRules,
  initialMarginRules,
  initialDsrRules,
  initialSupportSettings,
  initialPersonalFinanceRules,
  initialAdvancedRules,
  initialCalculationLogs,
  initialUserSubscriptions
} from '../seeds';

interface AppContextType {
  banks: Bank[];
  setBanks: React.Dispatch<React.SetStateAction<Bank[]>>;
  products: ProductAcceptance[];
  setProducts: React.Dispatch<React.SetStateAction<ProductAcceptance[]>>;
  militaryRanks: MilitaryRank[];
  setMilitaryRanks: React.Dispatch<React.SetStateAction<MilitaryRank[]>>;
  salaryRules: NetSalaryRule[];
  setSalaryRules: React.Dispatch<React.SetStateAction<NetSalaryRule[]>>;
  pensionRules: PensionRule[];
  setPensionRules: React.Dispatch<React.SetStateAction<PensionRule[]>>;
  marginRules: MarginRule[];
  setMarginRules: React.Dispatch<React.SetStateAction<MarginRule[]>>;
  dsrRules: DsrRule[];
  setDsrRules: React.Dispatch<React.SetStateAction<DsrRule[]>>;
  supportSettings: SupportSettings;
  setSupportSettings: React.Dispatch<React.SetStateAction<SupportSettings>>;
  personalRules: PersonalFinanceRules[];
  setPersonalRules: React.Dispatch<React.SetStateAction<PersonalFinanceRules[]>>;
  advancedRules: AdvancedRule[];
  setAdvancedRules: React.Dispatch<React.SetStateAction<AdvancedRule[]>>;
  calculationLogs: CalculationLog[];
  setCalculationLogs: React.Dispatch<React.SetStateAction<CalculationLog[]>>;
  userSubscriptions: UserSubscription[];
  setUserSubscriptions: React.Dispatch<React.SetStateAction<UserSubscription[]>>;

  activeNav: 'calculator' | 'admin';
  setActiveNav: (val: 'calculator' | 'admin') => void;
  adminSubPage: string;
  setAdminSubPage: (val: string) => void;

  hasUnsavedChanges: boolean;
  saveChanges: () => void;
  cancelChanges: () => void;
  
  // Calculator form data for saving/loading user settings
  formData: CalculatorFormData;
  setFormData: React.Dispatch<React.SetStateAction<CalculatorFormData>>;
  updateFormField: <K extends keyof CalculatorFormData>(field: K, value: CalculatorFormData[K]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default form data values
const defaultFormData: CalculatorFormData = {
  mainFinanceType: 'real_estate',
  realEstateSubType: 'real_estate_only',
  customerStatus: 'active_employee',
  sectorId: 'government_civilian',
  rankId: 'jundi',
  birthYear: 1990,
  birthMonth: 1,
  birthDay: 1,
  birthCalendar: 'gregorian',
  appointmentYear: 2015,
  appointmentMonth: 1,
  appointmentDay: 1,
  appointmentCalendar: 'gregorian',
  salaryMode: 'direct',
  directNetSalary: 12000,
  directPensionSalary: 8000,
  basicSalary: 9000,
  housingAllowance: 2250,
  otherAllowances: 1500,
  supportType: 'none',
  selectedBankId: 'all',
  termMode: 'max',
  manualTermYears: 25,
  existingPersonalLoanPayment: 0,
  otherObligations: 0,
};

interface AdminSettings {
  banks: Bank[];
  products: ProductAcceptance[];
  militaryRanks: MilitaryRank[];
  salaryRules: NetSalaryRule[];
  pensionRules: PensionRule[];
  marginRules: MarginRule[];
  dsrRules: DsrRule[];
  supportSettings: SupportSettings;
  personalRules: PersonalFinanceRules[];
  advancedRules: AdvancedRule[];
}

const getInitialSettings = (): AdminSettings => {
  try {
    const saved = localStorage.getItem("hasba_admin_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          banks: parsed.banks || initialBanks,
          products: parsed.products || initialProductAcceptance,
          militaryRanks: parsed.militaryRanks || initialMilitaryRanks,
          salaryRules: parsed.salaryRules || initialSalaryRules,
          pensionRules: parsed.pensionRules || initialPensionRules,
          marginRules: parsed.marginRules || initialMarginRules,
          dsrRules: parsed.dsrRules || initialDsrRules,
          supportSettings: parsed.supportSettings || initialSupportSettings,
          personalRules: parsed.personalRules || initialPersonalFinanceRules,
          advancedRules: parsed.advancedRules || initialAdvancedRules,
        };
      }
    }
  } catch (e) {
    console.error("Error reading hasba_admin_settings from localStorage:", e);
  }
  return {
    banks: initialBanks,
    products: initialProductAcceptance,
    militaryRanks: initialMilitaryRanks,
    salaryRules: initialSalaryRules,
    pensionRules: initialPensionRules,
    marginRules: initialMarginRules,
    dsrRules: initialDsrRules,
    supportSettings: initialSupportSettings,
    personalRules: initialPersonalFinanceRules,
    advancedRules: initialAdvancedRules,
  };
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const initialData = getInitialSettings();

  const [banks, setBanks] = useState<Bank[]>(initialData.banks);
  const [products, setProducts] = useState<ProductAcceptance[]>(initialData.products);
  const [militaryRanks, setMilitaryRanks] = useState<MilitaryRank[]>(initialData.militaryRanks);
  const [salaryRules, setSalaryRules] = useState<NetSalaryRule[]>(initialData.salaryRules);
  const [pensionRules, setPensionRules] = useState<PensionRule[]>(initialData.pensionRules);
  const [marginRules, setMarginRules] = useState<MarginRule[]>(initialData.marginRules);
  const [dsrRules, setDsrRules] = useState<DsrRule[]>(initialData.dsrRules);
  const [supportSettings, setSupportSettings] = useState<SupportSettings>(initialData.supportSettings);
  const [personalRules, setPersonalRules] = useState<PersonalFinanceRules[]>(initialData.personalRules);
  const [advancedRules, setAdvancedRules] = useState<AdvancedRule[]>(initialData.advancedRules);

  const [calculationLogs, setCalculationLogs] = useState<CalculationLog[]>(initialCalculationLogs);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>(initialUserSubscriptions);

  const [activeNav, setActiveNav] = useState<'calculator' | 'admin'>('calculator');
  const [adminSubPage, setAdminSubPage] = useState<string>('banks');

  const [savedSettings, setSavedSettings] = useState<AdminSettings>(initialData);

  // Calculator form data state
  const [formData, setFormData] = useState<CalculatorFormData>(defaultFormData);
  
  const updateFormField = useCallback(<K extends keyof CalculatorFormData>(
    field: K, 
    value: CalculatorFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const currentSettings: AdminSettings = {
    banks,
    products,
    militaryRanks,
    salaryRules,
    pensionRules,
    marginRules,
    dsrRules,
    supportSettings,
    personalRules,
    advancedRules,
  };

  const hasUnsavedChanges = JSON.stringify(currentSettings) !== JSON.stringify(savedSettings);

  const saveChanges = () => {
    setSavedSettings(currentSettings);
    try {
      localStorage.setItem("hasba_admin_settings", JSON.stringify(currentSettings));
    } catch (e) {
      console.error("Error saving hasba_admin_settings to localStorage:", e);
    }
  };

  const cancelChanges = () => {
    setBanks(savedSettings.banks);
    setProducts(savedSettings.products);
    setMilitaryRanks(savedSettings.militaryRanks);
    setSalaryRules(savedSettings.salaryRules);
    setPensionRules(savedSettings.pensionRules);
    setMarginRules(savedSettings.marginRules);
    setDsrRules(savedSettings.dsrRules);
    setSupportSettings(savedSettings.supportSettings);
    setPersonalRules(savedSettings.personalRules);
    setAdvancedRules(savedSettings.advancedRules);
  };

  return (
    <AppContext.Provider
      value={{
        banks,
        setBanks,
        products,
        setProducts,
        militaryRanks,
        setMilitaryRanks,
        salaryRules,
        setSalaryRules,
        pensionRules,
        setPensionRules,
        marginRules,
        setMarginRules,
        dsrRules,
        setDsrRules,
        supportSettings,
        setSupportSettings,
        personalRules,
        setPersonalRules,
        advancedRules,
        setAdvancedRules,
        calculationLogs,
        setCalculationLogs,
        userSubscriptions,
        setUserSubscriptions,
        activeNav,
        setActiveNav,
        adminSubPage,
        setAdminSubPage,
        hasUnsavedChanges,
        saveChanges,
        cancelChanges,
        formData,
        setFormData,
        updateFormField
      }}
    >
      <div dir="rtl" className="min-h-screen bg-[#F5F7FA] font-sans antialiased text-[#111827]">
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
