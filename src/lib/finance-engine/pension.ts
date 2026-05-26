import { PensionOutput, SectorId } from '../../types';

export function calculatePensionSalary(params: {
  sectorId: SectorId;
  basicSalary: number;
  birthYear: number;
  birthMonth: number;
  appointmentYear?: number;
  appointmentMonth?: number;
  retirementAgeCustom?: number;
  pensionMultiplierCustom?: number;
  directPensionSalary?: number;
}): PensionOutput {
  const {
    sectorId,
    basicSalary,
    birthYear,
    birthMonth,
    appointmentYear,
    appointmentMonth,
    retirementAgeCustom,
    pensionMultiplierCustom,
    directPensionSalary
  } = params;

  // If retiree, use direct input
  if (sectorId === 'retired') {
    return {
      retirementAge: 0,
      currentAgeMonths: 0,
      monthsUntilRetirement: 0,
      serviceMonthsAtRetirement: 0,
      pensionSalary: directPensionSalary || basicSalary
    };
  }

  // 1. Calculate current age in months with dynamic date values
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const currentAgeMonths = Math.max(0, (currentYear - birthYear) * 12 + (currentMonth - birthMonth));
  
  // 2. Determine retirement age
  const retirementAge = retirementAgeCustom || (sectorId === 'military' ? 45 : 60);
  const retirementAgeMonths = retirementAge * 12;

  // 3. Months until retirement
  const monthsUntilRetirement = Math.max(0, retirementAgeMonths - currentAgeMonths);

  // 4. Calculate service months at retirement
  let currentServiceMonths = 0;
  if (appointmentYear && appointmentMonth) {
    currentServiceMonths = Math.max(0, (currentYear - appointmentYear) * 12 + (currentMonth - appointmentMonth));
  } else {
    // defaults to 5 years (60 months) if details are not provided
    currentServiceMonths = 60;
  }

  const serviceMonthsAtRetirement = currentServiceMonths + monthsUntilRetirement;

  // 5. Select pension multiplier
  const multiplier = pensionMultiplierCustom || (sectorId === 'military' ? 420 : 480);

  // 6. Calculate pension salary
  // formula: Pension = Basic * serviceMonths / multiplier. Limited to basic salary!
  let pensionSalary = (basicSalary * serviceMonthsAtRetirement) / multiplier;
  if (pensionSalary > basicSalary) {
    pensionSalary = basicSalary;
  }

  // Ensure non-negative numbers and rounding
  return {
    retirementAge,
    currentAgeMonths,
    monthsUntilRetirement,
    serviceMonthsAtRetirement: Math.round(serviceMonthsAtRetirement),
    pensionSalary: Math.round(Math.max(0, pensionSalary))
  };
}
