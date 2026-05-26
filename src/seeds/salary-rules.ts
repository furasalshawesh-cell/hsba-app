import { NetSalaryRule } from '../types';

export const initialSalaryRules: NetSalaryRule[] = [
  {
    sectorId: 'government_civilian',
    deductionPercentage: 9.0, // 9% deduction towards Pension Agency
    deductionBase: 'basic_housing',
    deductFromAllowances: false,
    allowDirectInput: true,
    roundResult: true,
    isActive: true
  },
  {
    sectorId: 'military',
    deductionPercentage: 9.0, // 9% military retirement deduction
    deductionBase: 'basic_housing',
    deductFromAllowances: false,
    allowDirectInput: true,
    roundResult: true,
    isActive: true
  },
  {
    sectorId: 'private',
    deductionPercentage: 9.75, // GOSI (9%养老 + 0.75% Saned)
    deductionBase: 'basic_housing',
    deductFromAllowances: false,
    allowDirectInput: true,
    roundResult: true,
    isActive: true
  },
  {
    sectorId: 'retired',
    deductionPercentage: 0.0,
    deductionBase: 'total',
    deductFromAllowances: false,
    allowDirectInput: true,
    roundResult: true,
    isActive: true
  }
];
