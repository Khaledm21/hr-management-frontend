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

/**
 * Phonetic fallback converter from Latin characters to Arabic letters.
 */
function phoneticLatinToArabic(latin: string): string {
  if (!latin) return '';
  let str = latin.toLowerCase();

  // Multi-character digraphs
  str = str
    .replace(/sh/g, 'ش')
    .replace(/kh/g, 'خ')
    .replace(/th/g, 'ث')
    .replace(/gh/g, 'غ')
    .replace(/ch/g, 'تش')
    .replace(/ph/g, 'ف')
    .replace(/ee|ea/g, 'ي')
    .replace(/oo|ou/g, 'و');

  const charMap: Record<string, string> = {
    a: 'ا',
    b: 'ب',
    c: 'ك',
    d: 'د',
    e: 'ي',
    f: 'ف',
    g: 'ج',
    h: 'ه',
    i: 'ي',
    j: 'ج',
    k: 'ك',
    l: 'ل',
    m: 'م',
    n: 'ن',
    o: 'و',
    p: 'ب',
    q: 'ق',
    r: 'ر',
    s: 'س',
    t: 'ت',
    u: 'و',
    v: 'ف',
    w: 'و',
    x: 'كس',
    y: 'ي',
    z: 'ز',
  };

  let out = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    out += charMap[ch] || ch;
  }
  return out;
}

/**
 * Converts romanized/English Egyptian names to authentic Arabic names.
 * Used as high-reliability offline / fallback engine when AI is overloaded.
 */
export function transliterateEnglishNameToArabic(englishFullName: string): string {
  if (!englishFullName || typeof englishFullName !== 'string') return '';

  let normalized = englishFullName.trim();
  if (!normalized) return '';

  const compoundPairs: Array<[RegExp, string]> = [
    [/\b(?:abdel|abd\s*el|abdul)\s*rahman\b/gi, 'عبد الرحمن'],
    [/\b(?:abdel|abd\s*el|abdul)\s*kader\b/gi, 'عبد القادر'],
    [/\b(?:abdel|abd\s*el|abdul)\s*qader\b/gi, 'عبد القادر'],
    [/\b(?:abdel|abd\s*el|abdul)\s*ghaffar\b/gi, 'عبد الغفار'],
    [/\b(?:abdel|abd\s*el|abdul)\s*ghafar\b/gi, 'عبد الغفار'],
    [/\b(?:abdel|abd\s*el|abdul)\s*aziz\b/gi, 'عبد العزيز'],
    [/\b(?:abdel|abd\s*el|abdul)\s*ghany\b/gi, 'عبد الغني'],
    [/\b(?:abdel|abd\s*el|abdul)\s*hamid\b/gi, 'عبد الحميد'],
    [/\b(?:abdel|abd\s*el|abdul)\s*wahab\b/gi, 'عبد الوهاب'],
    [/\b(?:abdel|abd\s*el|abdul)\s*monem\b/gi, 'عبد المنعم'],
    [/\b(?:abdel|abd\s*el|abdul)\s*rahim\b/gi, 'عبد الرحيم'],
    [/\b(?:abdel|abd\s*el|abdul)\s*razek\b/gi, 'عبد الرازق'],
    [/\b(?:abdel|abd\s*el|abdul)\s*latif\b/gi, 'عبد اللطيف'],
    [/\b(?:abdel|abd\s*el|abdul)\s*samee\b/gi, 'عبد السميع'],
    [/\b(?:abdel|abd\s*el|abdul)\s*salam\b/gi, 'عبد السلام'],
    [/\b(?:abdel|abd\s*el|abdul)\s*shafy\b/gi, 'عبد الشافي'],
    [/\b(?:abdel|abd\s*el|abdul)\s*fattah\b/gi, 'عبد الفتاح'],
    [/\b(?:abdel|abd\s*el|abdul)\s*hakeem\b/gi, 'عبد الحكيم'],
    [/\b(?:abdel|abd\s*el|abdul)\s*halim\b/gi, 'عبد الحليم'],
    [/\b(?:abdel|abd\s*el|abdul)\s*baset\b/gi, 'عبد الباسط'],
    [/\b(?:abdel|abd\s*el|abdul)\s*hady\b/gi, 'عبد الهادي'],
    [/\b(?:abdel|abd\s*el|abdul)\s*gawad\b/gi, 'عبد الجواد'],
    [/\b(?:abdel|abd\s*el|abdul)\s*nasser\b/gi, 'عبد الناصر'],
    [/\b(?:abdel|abd\s*el|abdul)\s*magid\b/gi, 'عبد المجيد'],
    [/\b(?:abdel|abd\s*el|abdul)\s*majeed\b/gi, 'عبد المجيد'],
    [/\b(?:abdel|abd\s*el|abdul)\s*mohsen\b/gi, 'عبد المحسن'],
    [/\b(?:abdel|abd\s*el|abdul)\s*azeem\b/gi, 'عبد العظيم'],
    [/\b(?:abdel|abd\s*el|abdul)\s*khalek\b/gi, 'عبد الخالق'],
    [/\b(?:abdel|abd\s*el|abdul)\s*dayem\b/gi, 'عبد الدايم'],
    [/\b(?:abdel|abd\s*el|abdul)\s*wahid\b/gi, 'عبد الواحد'],
    [/\b(?:abdel|abd\s*el|abdul)\s*ghafour\b/gi, 'عبد الغفور'],
    [/\b(?:abdel|abd\s*el|abdul)\s*maqsoud\b/gi, 'عبد المقصود'],
    [/\b(?:abdel|abd\s*el|abdul)\s*naby\b/gi, 'عبد النبي'],
    [/\b(?:abdel|abd\s*el|abdul)\s*qawi\b/gi, 'عبد القوي'],
    [/\b(?:abdel|abd\s*el|abdul)\s*kawy\b/gi, 'عبد القوي'],
    [/\b(?:abdel|abd\s*el|abdul)\s*bari\b/gi, 'عبد الباري'],
    [/\b(?:abdel|abd\s*el|abdul)\s*motaleb\b/gi, 'عبد المطلب'],
    [/\b(?:abdel|abd\s*el|abdul)\s*zaher\b/gi, 'عبد الظاهر'],
    [/\b(?:abdullah|abdallah|abd\s*allah|abdollah|abdalla)\b/gi, 'عبد الله'],
    [/\b(?:nour|nour\s*el)\s*din\b/gi, 'نور الدين'],
    [/\b(?:seif|seif\s*el)\s*din\b/gi, 'سيف الدين'],
    [/\b(?:diaa|diaa\s*el)\s*din\b/gi, 'ضياء الدين'],
    [/\b(?:hossam|hossam\s*el)\s*din\b/gi, 'حسام الدين'],
    [/\b(?:bahaa|bahaa\s*el)\s*din\b/gi, 'بهاء الدين'],
    [/\b(?:alaa|alaa\s*el)\s*din\b/gi, 'علاء الدين'],
    [/\b(?:emad|emad\s*el)\s*din\b/gi, 'عماد الدين'],
    [/\b(?:gamal|gamal\s*el)\s*din\b/gi, 'جمال الدين'],
    [/\b(?:el|al)\s+dosouky\b/gi, 'الدسوقي'],
    [/\b(?:el|al)\s+dosoky\b/gi, 'الدسوقي'],
    [/\b(?:el|al)\s+sayed\b/gi, 'السيد'],
    [/\b(?:el|al)\s+shahat\b/gi, 'الشحات'],
    [/\b(?:el|al)\s+naggar\b/gi, 'النجار'],
    [/\b(?:el|al)\s+masry\b/gi, 'المصري'],
    [/\b(?:el|al)\s+badry\b/gi, 'البدري'],
    [/\b(?:el|al)\s+gazzar\b/gi, 'الجزار'],
    [/\b(?:el|al)\s+kady\b/gi, 'القاضي'],
    [/\b(?:el|al)\s+feky\b/gi, 'الفقي'],
    [/\b(?:el|al)\s+attar\b/gi, 'العطار'],
    [/\b(?:el|al)\s+ashry\b/gi, 'العشري'],
    [/\b(?:el|al)\s+kholy\b/gi, 'الخولي'],
    [/\b(?:el|al)\s+sawy\b/gi, 'الصاوي'],
    [/\b(?:el|al)\s+adly\b/gi, 'العدلي'],
    [/\b(?:el|al)\s+sherbini\b/gi, 'الشربيني'],
    [/\b(?:el|al)\s+shenawy\b/gi, 'الشناوي'],
    [/\b(?:el|al)\s+shamy\b/gi, 'الشامي'],
    [/\b(?:el|al)\s+hadidi\b/gi, 'الحديدي'],
    [/\b(?:el|al)\s+maghraby\b/gi, 'المغربي'],
    [/\b(?:el|al)\s+mahdy\b/gi, 'المهدي'],
    [/\b(?:el|al)\s+wakeel\b/gi, 'الوكيل'],
    [/\b(?:el|al)\s+gamal\b/gi, 'الجمال'],
    [/\b(?:el|al)\s+morsy\b/gi, 'المرسي'],
    [/\b(?:el|al)\s+ansary\b/gi, 'الأنصاري'],
    [/\b(?:el|al)\s+banna\b/gi, 'البنا'],
    [/\b(?:el|al)\s+baz\b/gi, 'الباز'],
    [/\b(?:el|al)\s+beheiry\b/gi, 'البحيري'],
    [/\b(?:el|al)\s+dakrory\b/gi, 'الدكروري'],
    [/\b(?:el|al)\s+shafei\b/gi, 'الشافعي'],
    [/\b(?:el|al)\s+gebely\b/gi, 'الجبلي'],
  ];

  for (const [regex, arCompound] of compoundPairs) {
    normalized = normalized.replace(regex, arCompound.replace(/\s+/g, '_'));
  }

  // Pre-seed common Egyptian names map
  const reverseMap: Record<string, string> = {
    bassem: 'باسم',
    bassam: 'بسام',
    mosbah: 'مصباح',
    mesbah: 'مصباح',
    kandil: 'قنديل',
    qandil: 'قنديل',
    younis: 'يونس',
    younes: 'يونس',
    ramzy: 'رمزي',
    ramzi: 'رمزي',
    refaat: 'رفعت',
    refat: 'رفعت',
    kader: 'قادر',
    qader: 'قادر',
    ghaffar: 'غفار',
    ghafar: 'غفار',
    shafy: 'شافي',
    fattah: 'فتاح',
    khalek: 'خالق',
    baset: 'باسط',
    hady: 'هادي',
    gawad: 'جواد',
    dayem: 'دايم',
    sobhy: 'صبحي',
    sobhi: 'صبحي',
    nabil: 'نبيل',
    fathy: 'فتحي',
    fathi: 'فتحي',
    fawzy: 'فوزي',
    fawzi: 'فوزي',
    hamdy: 'حمدي',
    hamdi: 'حمدي',
    badawy: 'بدوي',
    badawi: 'بدوي',
    metwally: 'متولي',
    metwali: 'متولي',
    bayoumy: 'بيومي',
    bayoumi: 'بيومي',
    dessouky: 'الدسوقي',
    desouky: 'الدسوقي',
    shalaby: 'شلبي',
    shehata: 'شحاتة',
    mansour: 'منصور',
    mokhtar: 'مختار',
    mamdouh: 'ممدوح',
    saeed: 'سعيد',
    said: 'سعيد',
    saad: 'سعد',
    soliman: 'سليمان',
    suleiman: 'سليمان',
    selim: 'سليم',
    salem: 'سالم',
    gaber: 'جابر',
    bakr: 'بكر',
    gharib: 'غريب',
    zaki: 'زكي',
    zayed: 'زايد',
    zahran: 'زهران',
    attia: 'عطية',
    awad: 'عوض',
    eid: 'عيد',
    amer: 'عامر',
    anwar: 'أنور',
    atef: 'عاطف',
    ashour: 'عاشور',
    allam: 'علام',
    helmy: 'حلمي',
    hafez: 'حافظ',
    hegazy: 'حجازي',
    khedr: 'خضر',
    khalil: 'خليل',
    khamis: 'خميس',
    khattab: 'خطاب',
    shawky: 'شوقي',
    shokry: 'شكري',
    shaalan: 'شعلان',
    shaheen: 'شاهين',
    kotb: 'قطب',
    kassem: 'قاسم',
    lotfy: 'لطفي',
    labib: 'لبيب',
    nasser: 'ناصر',
    nasr: 'نصر',
    naguib: 'نجيب',
    harby: 'حربي',
    hamada: 'حمادة',
    hilal: 'هلال',
    hashem: 'هاشم',
    youssef: 'يوسف',
    yehia: 'يحيى',
    yassin: 'يس',
    wahba: 'وهبة',
    wagdy: 'وجدي',
    donya: 'دنيا',
    dina: 'دينا',
    medhat: 'مدحت',
    rezk: 'رزق',
    rizk: 'رزق',
    dosouky: 'الدسوقي',
    eldosouky: 'الدسوقي',
    abbas: 'عباس',
    khaled: 'خالد',
    ashraf: 'أشرف',
    mohamed: 'محمد',
    mohammad: 'محمد',
    muhammad: 'محمد',
    ahmed: 'أحمد',
    mahmoud: 'محمود',
    mostafa: 'مصطفى',
    mustafa: 'مصطفى',
    ibrahim: 'إبراهيم',
    hassan: 'حسن',
    hussein: 'حسين',
    ali: 'علي',
    aly: 'علي',
    omar: 'عمر',
    amr: 'عمرو',
    mosaad: 'مسعد',
    mossad: 'مسعد',
    sayed: 'السيد',
    elsayed: 'السيد',
    shaaban: 'شعبان',
    gomaa: 'جمعة',
    tarek: 'طارق',
    adel: 'عادل',
    essam: 'عصام',
    emad: 'عماد',
    ayman: 'أيمن',
    osama: 'أسامة',
    ehab: 'إيهاب',
    islam: 'إسلام',
    ismail: 'إسماعيل',
    hany: 'هاني',
    hazem: 'حازم',
    walid: 'وليد',
    wael: 'وائل',
    yasser: 'ياسر',
    sherif: 'شريف',
    sameh: 'سامح',
    magdy: 'مجدي',
    reda: 'رضا',
    ragab: 'رجب',
    salah: 'صلاح',
    kamal: 'كمال',
    gamal: 'جمال',
    farouk: 'فاروق',
    fouad: 'فؤاد',
  };

  for (const [ar, en] of Object.entries(COMMON_ARABIC_NAMES)) {
    const key = en.toLowerCase().trim();
    if (!reverseMap[key]) {
      reverseMap[key] = ar;
    }
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const arabicWords = tokens.map(token => {
    if (token.includes('_')) {
      return token.replace(/_/g, ' ');
    }
    if (/[\u0600-\u06FF]/.test(token)) {
      return token;
    }
    const cleanToken = token.toLowerCase().replace(/[^a-z]/g, '');
    if (reverseMap[cleanToken]) {
      return reverseMap[cleanToken];
    }
    if ((cleanToken.startsWith('el') || cleanToken.startsWith('al')) && cleanToken.length > 3) {
      const stem = cleanToken.slice(2);
      if (reverseMap[stem]) {
        return 'ال' + reverseMap[stem];
      }
    }
    return phoneticLatinToArabic(cleanToken);
  });

  return arabicWords.join(' ');
}

/**
 * Validates AI transliteration output against known Egyptian civil registry phonetics.
 * If AI hallucinated a completely disconnected name (e.g. Khaled -> Sarah),
 * it rejects the hallucination and returns the verified civil registry transcription.
 */
export function validateArabicTranslation(englishFullName: string, candidateAr: string): string {
  if (!candidateAr || typeof candidateAr !== 'string' || candidateAr.trim().length === 0) {
    return transliterateEnglishNameToArabic(englishFullName);
  }
  const cleanAr = candidateAr.trim();
  const cleanEn = (englishFullName || '').trim();
  const fallback = transliterateEnglishNameToArabic(cleanEn);

  if (!cleanEn) return cleanAr;

  const enTokens = cleanEn.toLowerCase().split(/\s+/).filter(Boolean);
  const candidateTokens = cleanAr.split(/\s+/).filter(Boolean);
  const fallbackTokens = fallback.split(/\s+/).filter(Boolean);

  if (enTokens.length === 0 || candidateTokens.length === 0 || fallbackTokens.length === 0) {
    return cleanAr;
  }

  // 1. First name initial letter / root sanity check
  const expectedFirst = fallbackTokens[0];
  const candidateFirst = candidateTokens[0];

  if (expectedFirst && candidateFirst) {
    const normExpected = expectedFirst.replace(/[أإآا]/g, 'ا').replace(/[ةه]$/, 'ه');
    const normCandidate = candidateFirst.replace(/[أإآا]/g, 'ا').replace(/[ةه]$/, 'ه');

    if (normExpected[0] !== normCandidate[0] && normExpected !== normCandidate) {
      console.warn(`[Anti-Hallucination Shield] Rejected hallucinated AI translation "${cleanAr}" for "${cleanEn}". Replaced with civil registry verified: "${fallback}"`);
      return fallback;
    }
  }

  // 2. Token length disparity check
  if (Math.abs(candidateTokens.length - enTokens.length) > 2) {
    return fallback;
  }

  return cleanAr;
}


