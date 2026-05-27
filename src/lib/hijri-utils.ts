import moment from 'moment-hijri';

/**
 * يحوّل تاريخ هجري كامل (سنة + شهر + يوم) إلى كائن Date ميلادي
 */
export function hijriToGregorianDate(
  hijriYear: number,
  hijriMonth: number,
  hijriDay: number
): Date {
  // moment-hijri: iYear, iMonth (1-12), iDate
  const m = moment(`${hijriYear}-${hijriMonth}-${hijriDay}`, 'iYYYY-iM-iD');
  return m.toDate();
}

/**
 * يحسب الفرق بالأشهر الكاملة بين تاريخَين
 */
export function monthsDifference(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  const days = to.getDate() - from.getDate();
  // نقص يوم واحد = شهر ناقص
  return years * 12 + months + (days < 0 ? -1 : 0);
}

/**
 * يحوّل عمر بالسنوات الهجرية إلى أشهر ميلادية
 * مثال: 60 سنة هجرية = 60 × 354.367/30.44 = ~698 شهر ميلادي
 */
export function hijriYearsToGregorianMonths(hijriYears: number): number {
  return Math.round(hijriYears * 354.367 / 30.4375);
}

/**
 * يحسب العمر بالسنوات من تاريخ الميلاد
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  
  // إذا لم يصل لعيد ميلاده هذه السنة، ننقص سنة
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    return age - 1;
  }
  return age;
}

/**
 * يحوّل تاريخ (قد يكون هجري أو ميلادي) إلى Date ميلادي
 */
export function toGregorianDate(
  year: number,
  month: number,
  day: number,
  calendar: 'gregorian' | 'hijri'
): Date {
  if (calendar === 'hijri') {
    return hijriToGregorianDate(year, month, day);
  }
  return new Date(year, month - 1, day);
}
