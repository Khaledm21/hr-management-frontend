/**
 * Egyptian & Arabic Name Transliteration Engine (Arabic -> Latin/English)
 * Converts Arabic names into standardized English (as used in Egyptian Passports & Official IDs).
 */

const COMMON_ARABIC_NAMES: Record<string, string> = {
  // A
  أحمد: 'Ahmed',
  احمد: 'Ahmed',
  أيمن: 'Ayman',
  ايمن: 'Ayman',
  أسامة: 'Osama',
  اسامة: 'Osama',
  أشرف: 'Ashraf',
  اشرف: 'Ashraf',
  أكرم: 'Akram',
  اكرم: 'Akram',
  أنس: 'Anas',
  انس: 'Anas',
  إبراهيم: 'Ibrahim',
  ابراهيم: 'Ibrahim',
  إسماعيل: 'Ismail',
  اسماعيل: 'Ismail',
  إسلام: 'Islam',
  اسلام: 'Islam',
  إيهاب: 'Ehab',
  ايهاب: 'Ehab',
  أمير: 'Amir',
  امير: 'Amir',
  أدهم: 'Adham',
  ادهم: 'Adham',
  أنور: 'Anwar',
  انور: 'Anwar',
  أيوب: 'Ayoub',
  ايوب: 'Ayoub',
  أمين: 'Amin',
  امين: 'Amin',
  أدهم: 'Adham',
  علي: 'Ali',
  على: 'Ali',
  عمر: 'Omar',
  عمرو: 'Amr',
  عثمان: 'Othman',
  عادل: 'Adel',
  عصام: 'Essam',
  عماد: 'Emad',
  علاء: 'Alaa',
  عاطف: 'Atef',
  عرفة: 'Arafa',
  عرفات: 'Arafat',
  عمار: 'Ammar',
  عاشور: 'Ashour',
  عزب: 'Azab',
  عزازي: 'Azazy',

  // Kh & Sh
  خالد: 'Khaled',
  خليل: 'Khalil',
  خميس: 'Khamis',
  خيري: 'Kheiry',
  خضر: 'Khedr',
  خطاب: 'Khattab',
  شريف: 'Sherif',
  شعبان: 'Shaaban',
  شوقي: 'Shawky',
  شكري: 'Shokry',
  شعلان: 'Shaalan',
  شاهين: 'Shaheen',
  شعراوي: 'Shaarawy',
  شحاتة: 'Shehata',
  شطا: 'Shata',
  شلبى: 'Shalaby',
  شلبي: 'Shalaby',
  شادي: 'Shady',

  // M
  محمد: 'Mohamed',
  محمود: 'Mahmoud',
  مصطفى: 'Mostafa',
  مسعد: 'Mosaad',
  موسى: 'Mousa',
  مختار: 'Mokhtar',
  منصور: 'Mansour',
  ممدوح: 'Mamdouh',
  مدحت: 'Medhat',
  ماهر: 'Maher',
  مجدي: 'Magdy',
  مراد: 'Mourad',
  ماجد: 'Maged',
  مؤمن: 'Moamen',
  مروان: 'Marwan',
  متولي: 'Metwally',
  مرسي: 'Morsi',
  مبارك: 'Mubarak',
  مهدي: 'Mahdy',
  مهران: 'Mehran',

  // H
  حسن: 'Hassan',
  حسان: 'Hassan',
  حسين: 'Hussein',
  حسام: 'Hossam',
  هيثم: 'Haitham',
  هاني: 'Hany',
  هشام: 'Hesham',
  حمدي: 'Hamdy',
  حامد: 'Hamed',
  حمادة: 'Hamada',
  حمزة: 'Hamza',
  حافظ: 'Hafez',
  حلمي: 'Helmy',
  حجازي: 'Hegazy',
  حجاج: 'Haggag',
  حاتم: 'Hatem',
  حازم: 'Hazem',

  // S & T
  سعيد: 'Saeed',
  سيد: 'Sayed',
  سامح: 'Sameh',
  سامي: 'Samy',
  سمير: 'Samir',
  سالم: 'Salem',
  سليم: 'Selim',
  سليمان: 'Soliman',
  سعد: 'Saad',
  صابر: 'Saber',
  صبحي: 'Sobhy',
  صلاح: 'Salah',
  صالح: 'Saleh',
  صقر: 'Saqr',
  طارق: 'Tarek',
  طلعت: 'Talaat',
  طه: 'Taha',
  تامر: 'Tamer',
  توفيق: 'Tawfik',

  // R, Y, W, Z
  رضا: 'Reda',
  رمضان: 'Ramadan',
  رامي: 'Ramy',
  رأفت: 'Raafat',
  رجب: 'Ragab',
  رشدي: 'Roshdy',
  يوسف: 'Youssef',
  ياسر: 'Yasser',
  يحيى: 'Yehia',
  يحيي: 'Yehia',
  يونس: 'Younis',
  وليد: 'Waleed',
  وائل: 'Wael',
  وحيد: 'Waheed',
  وجدي: 'Wagdy',
  وسيم: 'Waseem',
  زياد: 'Ziad',
  زايد: 'Zayed',
  زكريا: 'Zakaria',
  زين: 'Zein',

  // B, G, F, N
  بدوي: 'Badawy',
  بسيوني: 'Basyouni',
  بيومي: 'Bayoumi',
  بكر: 'Bakr',
  بركات: 'Barakat',
  بهجت: 'Bahgat',
  باسم: 'Bassem',
  باهر: 'Baher',
  جاد: 'Gad',
  جمال: 'Gamal',
  جمعة: 'Gomaa',
  جابر: 'Gaber',
  جلال: 'Galal',
  فتحي: 'Fathy',
  فهمي: 'Fahmy',
  فوزي: 'Fawzy',
  فاروق: 'Farouk',
  فؤاد: 'Fouad',
  فرج: 'Farag',
  فضل: 'Fadl',
  نادر: 'Nader',
  ناصر: 'Nasser',
  نصر: 'Nasr',
  نبيل: 'Nabil',
  ناجي: 'Nagy',
  نجيب: 'Naguib',
  نوح: 'Noah',
};

const COMPOUND_PREFIXES: Record<string, string> = {
  عبدالله: 'Abdullah',
  'عبد الله': 'Abdullah',
  عبدالرحمن: 'Abdulrahman',
  'عبد الرحمن': 'Abdulrahman',
  عبدالعزيز: 'Abdulaziz',
  'عبد العزيز': 'Abdulaziz',
  عبدالفتاح: 'Abdelfattah',
  'عبد الفتاح': 'Abdelfattah',
  عبدالحميد: 'Abdelhamid',
  'عبد الحميد': 'Abdelhamid',
  عبدالوهاب: 'Abdelwahab',
  'عبد الوهاب': 'Abdelwahab',
  عبدالمنعم: 'Abdelmonem',
  'عبد المنعم': 'Abdelmonem',
  عبدالرحيم: 'Abdelrahim',
  'عبد الرحيم': 'Abdelrahim',
  عبدالرازق: 'Abdelrazek',
  'عبد الرازق': 'Abdelrazek',
  عبداللطيف: 'Abdellatif',
  'عبد اللطيف': 'Abdellatif',
  عبدالغني: 'Abdelghany',
  'عبد الغني': 'Abdelghany',
  عبدالسميع: 'Abdelsamee',
  'عبد السميع': 'Abdelsamee',
  عبدالسلام: 'Abdelsalam',
  'عبد السلام': 'Abdelsalam',
  نورالدين: 'Nour Eldin',
  'نور الدين': 'Nour Eldin',
  سيفالدين: 'Seif Eldin',
  'سيف الدين': 'Seif Eldin',
  ضياءالدين: 'Diaa Eldin',
  'ضياء الدين': 'Diaa Eldin',
  حسامالدين: 'Hossam Eldin',
  'حسام الدين': 'Hossam Eldin',
};

/**
 * Phonetically transliterates a single Arabic token to Latin characters.
 */
function phoneticTransliterateWord(word: string): string {
  let clean = word.trim().replace(/[ً-ْ]/g, ''); // Remove tashkeel diacritics
  if (!clean) return '';

  // Check compound prefixes
  if (COMPOUND_PREFIXES[clean]) return COMPOUND_PREFIXES[clean];

  // Check dictionary
  if (COMMON_ARABIC_NAMES[clean]) return COMMON_ARABIC_NAMES[clean];

  // Handle "ال" prefix
  let prefix = '';
  if (clean.startsWith('ال') && clean.length > 3) {
    prefix = 'El-';
    clean = clean.slice(2);
    if (COMMON_ARABIC_NAMES[clean]) {
      return prefix + COMMON_ARABIC_NAMES[clean];
    }
  }

  // Character-by-character phonetic mapping
  const charMap: Record<string, string> = {
    ا: 'a',
    أ: 'a',
    إ: 'e',
    آ: 'aa',
    ء: "'",
    ئ: 'e',
    ؤ: 'o',
    ب: 'b',
    ت: 't',
    ث: 'th',
    ج: 'g',
    ح: 'h',
    خ: 'kh',
    د: 'd',
    ذ: 'dh',
    ر: 'r',
    ز: 'z',
    س: 's',
    ش: 'sh',
    ص: 's',
    ض: 'd',
    ط: 't',
    ظ: 'z',
    ع: 'a',
    غ: 'gh',
    ف: 'f',
    ق: 'q',
    ك: 'k',
    ل: 'l',
    م: 'm',
    ن: 'n',
    ه: 'h',
    ة: 'a',
    و: 'w',
    ي: 'y',
    ى: 'a',
  };

  let result = '';
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    result += charMap[ch] !== undefined ? charMap[ch] : ch;
  }

  // Clean double characters and capitalize first letter
  result = result.replace(/([aeiouy])\1+/gi, '$1$1');
  if (result.length > 0) {
    result = result[0].toUpperCase() + result.slice(1).toLowerCase();
  }

  return prefix ? prefix + result : result;
}

/**
 * Converts a full Arabic name string to clean, standardized English First & Last names.
 * Example:
 * "خالد مسعد حسان محمد شعلان"
 * => { firstNameEn: "Khaled", lastNameEn: "Mosaad Hassan Mohamed Shaalan", fullNameEn: "Khaled Mosaad Hassan Mohamed Shaalan" }
 */
export function transliterateArabicNameToEnglish(arabicFullName: string): {
  firstNameEn: string;
  lastNameEn: string;
  fullNameEn: string;
} {
  if (!arabicFullName || typeof arabicFullName !== 'string') {
    return { firstNameEn: '', lastNameEn: '', fullNameEn: '' };
  }

  // Handle compound names like "عبد الله" or "عبد الرحمن" or "نور الدين"
  let normalized = arabicFullName.trim();
  for (const [arCompound, enCompound] of Object.entries(COMPOUND_PREFIXES)) {
    if (normalized.includes(arCompound)) {
      // Replace with unique token for safe splitting
      normalized = normalized.split(arCompound).join(enCompound.replace(/\s+/g, '_'));
    }
  }

  const rawWords = normalized.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) {
    return { firstNameEn: '', lastNameEn: '', fullNameEn: '' };
  }

  const enWords = rawWords.map((w) => {
    if (w.includes('_')) {
      return w.replace(/_/g, ' ');
    }
    return phoneticTransliterateWord(w);
  });

  const firstNameEn = enWords[0] || '';
  const lastNameEn = enWords.slice(1).join(' ') || firstNameEn;
  const fullNameEn = enWords.join(' ');

  return {
    firstNameEn,
    lastNameEn,
    fullNameEn,
  };
}

