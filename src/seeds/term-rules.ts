import { TermRule } from '../types';

export const initialTermRules: TermRule[] = [
  // SNB Defaults
  {
    bankId: 'alahli',
    sectorId: 'government_civilian',
    rankId: 'all',
    productId: 'real_estate',
    supportType: 'all',
    maxTermMonths: 300, // 25 years
    allowedMonthsAfterRetirement: 120, // 10 years
    maxAgeAtEnd: 75,
    allowAfterRetirement: true,
    calendarType: 'gregorian',
    minTermMonths: 60,
    defaultTermMode: 'max',
    isActive: true
  },
  // Al Rajhi Defaults
  {
    bankId: 'rajhi',
    sectorId: 'government_civilian',
    rankId: 'all',
    productId: 'real_estate',
    supportType: 'all',
    maxTermMonths: 300,
    allowedMonthsAfterRetirement: 60, // 5 years
    maxAgeAtEnd: 70,
    allowAfterRetirement: true,
    calendarType: 'hijri',
    minTermMonths: 60,
    defaultTermMode: 'max',
    isActive: true
  },
  // Generic fallback configuration
  {
    bankId: 'all',
    sectorId: 'government_civilian',
    rankId: 'all',
    productId: 'real_estate',
    supportType: 'all',
    maxTermMonths: 300,
    allowedMonthsAfterRetirement: 60,
    maxAgeAtEnd: 70,
    allowAfterRetirement: true,
    calendarType: 'gregorian',
    minTermMonths: 60,
    defaultTermMode: 'max',
    isActive: true
  }
];
