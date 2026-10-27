import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'SAR', locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function formatDate(dateStr: string | Date, locale: string = 'en-US'): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '-';
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Automatically extracts Gender and Date of Birth from 14-digit Egyptian National ID numbers.
 * - Digit 1: 2 = 1900-1999, 3 = 2000-2099
 * - Digits 2-7: YYMMDD
 * - Digit 13 (second-to-last digit): Even (0,2,4,6,8) = Female (أنثى), Odd (1,3,5,7,9) = Male (ذكر)
 */
export function parseEgyptianNationalId(nid: string | number | undefined | null): { gender: 'male' | 'female'; dateOfBirth: string } | null {
  if (!nid) return null;
  const clean = String(nid).trim().replace(/[^0-9]/g, '');
  if (clean.length !== 14) return null;

  const centuryDigit = parseInt(clean[0], 10);
  const yearPart = parseInt(clean.substring(1, 3), 10);
  const monthPart = clean.substring(3, 5);
  const dayPart = clean.substring(5, 7);
  const genderDigit = parseInt(clean[12], 10);

  const century = centuryDigit === 3 ? 2000 : 1900;
  const fullYear = century + yearPart;
  const dateOfBirth = `${fullYear}-${monthPart}-${dayPart}`;
  const gender: 'male' | 'female' = genderDigit % 2 === 0 ? 'female' : 'male';

  return { gender, dateOfBirth };
}

/**
 * Ensures an avatar matches the employee's gender.
 * - Custom uploaded real photos (base64 or files) are preserved 100%.
 * - Dicebear SVG avatars are forced to use tailored hairstyles and facial attributes according to gender.
 */
export function getGenderAvatarUrl(
  avatar?: string | null,
  gender?: 'male' | 'female' | string,
  seed?: string
): string {
  // If user uploaded a custom real photo, preserve it
  if (avatar && !avatar.includes('dicebear.com')) {
    return avatar;
  }

  // Extract existing seed if present
  let cleanSeed = seed || 'User';
  if (avatar && avatar.includes('seed=')) {
    try {
      const match = avatar.match(/seed=([^&]+)/);
      if (match && match[1]) {
        cleanSeed = decodeURIComponent(match[1]);
      }
    } catch {
      // fallback
    }
  }

  const s = encodeURIComponent(cleanSeed);
  if (gender === 'female') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${s}&facialHairProbability=0&top=longButNotTooLong,straight01,straight02,curly,curvy,bob,bun,miaWallace`;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${s}&top=shortFlat,shortRound,shortWaved,sides,theCaesar,theCaesarAndSidePart,shortCurly`;
}


