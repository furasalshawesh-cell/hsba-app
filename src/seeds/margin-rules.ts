import { MarginRule } from '../types';

export const initialMarginRules: MarginRule[] = [
  // SNB (alahli) Real Estate Margins
  {
    id: 'snb_re_m1',
    bankId: 'alahli',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 0,
    toTermMonths: 60, // 5 years
    startMargin: 1.80,
    endMargin: 1.80,
    calcType: 'fixed',
    isActive: true
  },
  {
    id: 'snb_re_m2',
    bankId: 'alahli',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 61,
    toTermMonths: 120, // 10 years
    startMargin: 1.80,
    endMargin: 2.25,
    calcType: 'linear',
    isActive: true
  },
  {
    id: 'snb_re_m3',
    bankId: 'alahli',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 121,
    toTermMonths: 180, // 15 years
    startMargin: 2.25,
    endMargin: 2.95,
    calcType: 'linear',
    isActive: true
  },
  {
    id: 'snb_re_m4',
    bankId: 'alahli',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 181,
    toTermMonths: 240, // 20 years
    startMargin: 2.95,
    endMargin: 3.65,
    calcType: 'linear',
    isActive: true
  },
  {
    id: 'snb_re_m5',
    bankId: 'alahli',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 241,
    toTermMonths: 300, // 25 years
    startMargin: 3.65,
    endMargin: 4.35,
    calcType: 'linear',
    isActive: true
  },

  // AlRajhi (rajhi) Real Estate Margins
  {
    id: 'rajhi_re_m1',
    bankId: 'rajhi',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 0,
    toTermMonths: 120,
    startMargin: 2.10,
    endMargin: 2.10,
    calcType: 'fixed',
    isActive: true
  },
  {
    id: 'rajhi_re_m2',
    bankId: 'rajhi',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 121,
    toTermMonths: 240,
    startMargin: 2.10,
    endMargin: 3.45,
    calcType: 'linear',
    isActive: true
  },
  {
    id: 'rajhi_re_m3',
    bankId: 'rajhi',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 241,
    toTermMonths: 300,
    startMargin: 3.45,
    endMargin: 4.15,
    calcType: 'linear',
    isActive: true
  },

  // Alinma Real Estate Margins
  {
    id: 'alinma_re_m1',
    bankId: 'alinma',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 0,
    toTermMonths: 180,
    startMargin: 2.45,
    endMargin: 2.45,
    calcType: 'fixed',
    isActive: true
  },
  {
    id: 'alinma_re_m2',
    bankId: 'alinma',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 181,
    toTermMonths: 300,
    startMargin: 2.45,
    endMargin: 3.95,
    calcType: 'linear',
    isActive: true
  },

  // Default fallback Margins for other banks
  {
    id: 'default_re_m1',
    bankId: 'all',
    productId: 'real_estate',
    supportType: 'all',
    sectorId: 'all',
    fromTermMonths: 0,
    toTermMonths: 300,
    startMargin: 2.50,
    endMargin: 4.50,
    calcType: 'linear',
    isActive: true
  }
];
