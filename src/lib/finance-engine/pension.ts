import { PensionOutput, SectorId } from '../../types';

export function calculatePensionSalary(params: {
  sectorId: SectorId;
  basicSalary: number;
  birthYear: number;
  birthMonth: number;
  birthDay?: number;
  appointmentYear?: number;
  appointmentMonth?: number;
  appointmentDay?: number;
  retirementAgeCustom?: number;
  pensionMultiplierCustom?: number;
  directPensionSalary?: number;
}): PensionOutput {
  const {
    sectorId,
    basicSalary,
    birthYear,
    birthMonth,
    birthDay = 1,
    appointmentYear,
    appointmentMonth,
    appointmentDay = 1,
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

  // 1. Calculate current age in months with precise date calculation
  const today = new Date();
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  
  const currentAgeMonths = Math.max(0,
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth() - birthDate.getMonth()) +
    (today.getDate() < birthDate.getDate() ? -1 : 0)
  );
  
  // 2. Determine retirement age
  const retirementAge = retirementAgeCustom || (sectorId === 'military' ? 45 : 60);
  const retirementAgeMonths = retirementAge * 12;

  // 3. Months until retirement
  const monthsUntilRetirement = Math.max(0, retirementAgeMonths - currentAgeMonths);

  // 4. Calculate service months at retirement with precise date calculation
  let currentServiceMonths = 0;
  if (appointmentYear && appointmentMonth) {
    const appointmentDate = new Date(appointmentYear, appointmentMonth - 1, appointmentDay);
    currentServiceMonths = Math.max(0,
      (today.getFullYear() - appointmentDate.getFullYear()) * 12 +
      (today.getMonth() - appointmentDate.getMonth()) +
      (today.getDate() < appointmentDate.getDate() ? -1 : 0)
    );
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
