/**
 * Egyptian National ID (الرقم القومي المصري) Parser & Validator
 *
 * Structure of 14-digit Egyptian National ID:
 * - Digit 1: Century indicator (2 = 1900-1999, 3 = 2000-2099)
 * - Digits 2-3: Birth Year (YY)
 * - Digits 4-5: Birth Month (MM: 01 - 12)
 * - Digits 6-7: Birth Day (DD: 01 - 31)
 * - Digits 8-9: Governorate Code (01 to 88)
 * - Digits 10-12: Sequence number of registration
 * - Digit 13: Gender indicator (Odd = Male, Even = Female)
 * - Digit 14: Verification / Checksum digit
 */

export interface EgyptianNationalIdInfo {
  isValid: boolean;
  nationalId: string;
  birthDate?: string; // YYYY-MM-DD
  birthDateFormatted?: string; // DD/MM/YYYY
  age?: number;
  gender?: 'male' | 'female';
  genderAr?: string;
  governorateCode?: string;
  governorateAr?: string;
  governorateEn?: string;
  errorMessage?: string;
}

export const EGYPTIAN_GOVERNORATES: Record<string, { ar: string; en: string }> = {
  '01': { ar: 'القاهرة', en: 'Cairo' },
  '02': { ar: 'الإسكندرية', en: 'Alexandria' },
  '03': { ar: 'بورسعيد', en: 'Port Said' },
  '04': { ar: 'السويس', en: 'Suez' },
  '11': { ar: 'دمياط', en: 'Damietta' },
  '12': { ar: 'الدقهلية', en: 'Dakahlia' },
  '13': { ar: 'الشرقية', en: 'Sharkia' },
  '14': { ar: 'القليوبية', en: 'Qalyubia' },
  '15': { ar: 'كفر الشيخ', en: 'Kafr El Sheikh' },
  '16': { ar: 'الغربية', en: 'Gharbia' },
  '17': { ar: 'المنوفية', en: 'Monufia' },
  '18': { ar: 'البحيرة', en: 'Beheira' },
  '19': { ar: 'الجيزة', en: 'Giza' },
  '21': { ar: 'بني سويف', en: 'Beni Suef' },
  '22': { ar: 'الفيوم', en: 'Fayoum' },
  '23': { ar: 'المنيا', en: 'Minya' },
  '24': { ar: 'أسيوط', en: 'Asyut' },
  '25': { ar: 'سوهاج', en: 'Sohag' },
  '26': { ar: 'قنا', en: 'Qena' },
  '27': { ar: 'أسوان', en: 'Aswan' },
  '28': { ar: 'الأقصر', en: 'Luxor' },
  '29': { ar: 'البحر الأحمر', en: 'Red Sea' },
  '31': { ar: 'الوادي الجديد', en: 'New Valley' },
  '32': { ar: 'مطروح', en: 'Matrouh' },
  '33': { ar: 'شمال سيناء', en: 'North Sinai' },
  '34': { ar: 'جنوب سيناء', en: 'South Sinai' },
  '88': { ar: 'خارج الجمهورية / مركز كبار السن', en: 'Born Abroad / Foreign' },
};

/**
 * Parses and validates an Egyptian 14-digit National ID string.
 */
export function parseEgyptianNationalId(rawId: string | null | undefined): EgyptianNationalIdInfo {
  if (!rawId) {
    return { isValid: false, nationalId: '', errorMessage: 'الرقم القومي فارغ' };
  }

  // Normalize arabic digits to western digits and remove any spaces/dashes
  const cleanId = rawId
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\s\-_]/g, '')
    .trim();

  if (!/^\d{14}$/.test(cleanId)) {
    return {
      isValid: false,
      nationalId: cleanId,
      errorMessage: 'الرقم القومي يجب أن يتكون من 14 رقماً',
    };
  }

  const centuryChar = cleanId[0];
  let centuryPrefix = '';
  if (centuryChar === '2') {
    centuryPrefix = '19';
  } else if (centuryChar === '3') {
    centuryPrefix = '20';
  } else {
    return {
      isValid: false,
      nationalId: cleanId,
      errorMessage: 'الرقم القومي غير صحيح (خانة القرن غير صحيحة)',
    };
  }

  const year = `${centuryPrefix}${cleanId.slice(1, 3)}`;
  const month = cleanId.slice(3, 5);
  const day = cleanId.slice(5, 7);

  const numYear = parseInt(year, 10);
  const numMonth = parseInt(month, 10);
  const numDay = parseInt(day, 10);

  if (numMonth < 1 || numMonth > 12) {
    return {
      isValid: false,
      nationalId: cleanId,
      errorMessage: 'شهر الميلاد غير صحيح بالرقم القومي',
    };
  }

  if (numDay < 1 || numDay > 31) {
    return {
      isValid: false,
      nationalId: cleanId,
      errorMessage: 'يوم الميلاد غير صحيح بالرقم القومي',
    };
  }

  // Validate real calendar date (e.g. leap year, 30 vs 31 days)
  const birthDateObj = new Date(numYear, numMonth - 1, numDay);
  if (
    birthDateObj.getFullYear() !== numYear ||
    birthDateObj.getMonth() !== numMonth - 1 ||
    birthDateObj.getDate() !== numDay
  ) {
    return {
      isValid: false,
      nationalId: cleanId,
      errorMessage: 'تاريخ الميلاد المحسوب غير حقيقي في التقويم',
    };
  }

  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - numYear;
  const hasHadBirthdayThisYear =
    today.getMonth() > numMonth - 1 ||
    (today.getMonth() === numMonth - 1 && today.getDate() >= numDay);
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  // Parse Governorate
  const govCode = cleanId.slice(7, 9);
  const govInfo = EGYPTIAN_GOVERNORATES[govCode] || { ar: 'غير محدد', en: 'Unknown' };

  // Parse Gender (13th digit: 0-indexed index 12)
  const genderDigit = parseInt(cleanId[12], 10);
  const isMale = genderDigit % 2 !== 0;
  const gender: 'male' | 'female' = isMale ? 'male' : 'female';
  const genderAr = isMale ? 'ذكر' : 'أنثى';

  const birthDateIso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const birthDateFormatted = `${day}/${month}/${year}`;

  return {
    isValid: true,
    nationalId: cleanId,
    birthDate: birthDateIso,
    birthDateFormatted,
    age,
    gender,
    genderAr,
    governorateCode: govCode,
    governorateAr: govInfo.ar,
    governorateEn: govInfo.en,
  };
}

/**
 * Searches and extracts potential 14-digit Egyptian National ID strings from arbitrary text.
 */
export function extractPotentialNationalIds(text: string): string[] {
  if (!text) return [];
  // Normalize arabic numerals
  const normalized = text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const matches = normalized.match(/(?:[23]\d{13})/g);
  if (!matches) return [];

  // Filter only logically valid ones
  return Array.from(new Set(matches)).filter((candidate) => parseEgyptianNationalId(candidate).isValid);
}

