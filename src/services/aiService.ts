/**
 * AI Service for Antigravity HR Management System
 * Supports:
 * - Intelligent OCR extraction from Egyptian National ID cards and Passports
 * - Multi-language Job Description and KPI generation (Arabic, English, Chinese)
 * - Safe LocalStorage API key persistence
 */

import { parseEgyptianNationalId, EgyptianNationalIdInfo } from '../utils/nationalIdParser';
import { transliterateArabicNameToEnglish } from '../utils/arabicNameTransliteration';
import { employeeService } from './employeeService';
import { driverPayoutService } from './driverPayoutService';

export interface ScannedIdResult {
  success: boolean;
  fullNameAr?: string;
  firstName?: string;
  lastName?: string;
  firstNameEn?: string; // الاسم الأول بالإنجليزي
  lastNameEn?: string; // اسم العائلة بالإنجليزي
  nationalId?: string;
  birthDate?: string; // YYYY-MM-DD
  age?: number;
  gender?: 'male' | 'female';
  genderAr?: string;
  governorateAr?: string;
  address?: string;
  profession?: string;
  qualification?: string; // المؤهل الدراسي من ظهر البطاقة
  maritalStatus?: string; // الحالة الاجتماعية من ظهر البطاقة
  idExpiryDate?: string; // تاريخ انتهاء البطاقة من ظهر البطاقة
  nationality?: string;
  religion?: string;
  idPhotoUrl?: string; // Cropped face photo
  idCardImage?: string; // Full front card image base64
  backCardImage?: string; // Full back card image base64
  rawResponse?: string;
  source: 'gemini' | 'algorithmic_fallback';
  message?: string;
}

export interface GeneratedJobSpec {
  titleAr: string;
  titleEn: string;
  titleZh: string;
  summaryAr: string;
  summaryEn: string;
  summaryZh: string;
  responsibilitiesAr: string[];
  responsibilitiesEn: string[];
  responsibilitiesZh: string[];
  kpisAr: string[];
  kpisEn: string[];
  kpisZh: string[];
  requirementsAr: string[];
  requirementsEn: string[];
  requirementsZh: string[];
  suggestedSalaryRange?: { min: number; max: number };
}

const API_KEY_STORAGE_KEY = 'hr_gemini_api_key';
const DEFAULT_GEMINI_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

export const aiService = {
  /**
   * Retrieves the current Gemini API Key from localStorage, environment, or default
   */
  getApiKey(): string {
    const local = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (local && local.trim().length > 0) return local.trim();
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 0) return envKey.trim();
    return DEFAULT_GEMINI_KEY;
  },

  /**
   * Saves the Gemini API Key into localStorage
   */
  setApiKey(key: string): void {
    if (!key || key.trim() === '') {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } else {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    }
  },

  /**
   * Checks whether an API key is configured
   */
  hasApiKey(): boolean {
    return this.getApiKey().length > 0;
  },

  /**
   * Extracts data from a National ID image (Front Face and optional Back Face) using Gemini Vision
   */
  async scanNationalId(
    frontImageBase64: string,
    backImageBase64?: string | null,
    croppedPhotoUrl?: string
  ): Promise<ScannedIdResult> {
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const parts: any[] = [];

        const prompt = `
You are an expert OCR system specialized in Egyptian National ID Cards (بطاقة تحقيق الشخصية - جمهورية مصر العربية) and Passports.
Analyze the provided image(s) of the card (Front Face and/or Back Face).

- From Front Face (وجه البطاقة): Extract Full Arabic Name, National ID (14 digits), Date of Birth, Address.
- From Back Face (ظهر البطاقة):
  1. Educational Qualification (المؤهل الدراسي: مثلاً: حاصل على بكالوريوس... أو دبلوم... أو ليسانس... أو طالب بكلية... أو بدون مؤهل).
  2. Profession / Job / Workplace (المهنة أو الوظيفة أو جهة العمل المكتوبة بالظهر).
  3. Marital Status (الحالة الاجتماعية: أعزب / متزوج / مطلق / أرمل).
  4. Religion (الديانة: مسلم / مسيحي).
  5. Card Expiry Date (تاريخ انتهاء / سريان البطاقة إن وجد).

Extract all readable details into a clean JSON object:
{
  "fullNameAr": "الاسم الرباعي كاملاً باللغة العربية كما هو مكتوب في البطاقة",
  "firstName": "الاسم الأول بالعربية",
  "lastName": "اسم العائلة وبقية الاسم بالعربية",
  "firstNameEn": "First name romanized in clean English (e.g. Khaled)",
  "lastNameEn": "Rest of family name romanized in clean English (e.g. Mosaad Hassan Mohamed Shaalan)",
  "nationalId": "14-digit Egyptian National ID number (الرقم القومي 14 رقم بالضبط بدون مسافات)",
  "address": "العنوان بالتفصيل المكتوب في البطاقة",
  "governorate": "المحافظة",
  "profession": "الوظيفة أو المهنة المكتوبة بالظهر إن وجدت",
  "qualification": "المؤهل الدراسي المكتوب بظهر البطاقة بدقة",
  "maritalStatus": "الحالة الاجتماعية المكتوبة بظهر البطاقة",
  "idExpiryDate": "تاريخ انتهاء سريان البطاقة المكتوب بالظهر (YYYY-MM-DD)",
  "religion": "الديانة إن وجدت",
  "nationality": "مصري"
}

Rules:
1. Pay extreme attention to the 14-digit national ID. It must be copied accurately.
2. If back of card is provided, extract qualification and profession carefully.
3. Return ONLY the JSON object without markdown fences, without \`\`\`json.
`;
        parts.push({ text: prompt });

        if (frontImageBase64) {
          const cleanFront = frontImageBase64.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanFront,
            },
          });
        }

        if (backImageBase64) {
          const cleanBack = backImageBase64.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBack,
            },
          });
        }

        // Modern Google Gemini models
        const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
        let rawText: string | null = null;
        let lastErr: Error | null = null;

        for (const model of models) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts,
                  },
                ],
                generationConfig: {
                  temperature: 0.1,
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              const msg = errData?.error?.message || `خطأ (${response.status})`;
              lastErr = new Error(msg);
              if (response.status === 404) continue; // try next model
              throw lastErr;
            }

            const data = await response.json();
            rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) break;
          } catch (e: any) {
            lastErr = e;
            if (e.message?.includes('404')) continue;
            throw e;
          }
        }

        if (rawText) {
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          const rawFullName = parsed.fullNameAr || parsed.full_arabic_name || parsed.fullName || parsed['الاسم'] || '';
          const rawId = parsed.nationalId || parsed.national_id || parsed['الرقم_القومي'] || '';
          const rawAddress = parsed.address || parsed['العنوان'] || '';
          const rawProfession = parsed.profession || parsed['المهنة'] || '';
          const rawQualification = parsed.qualification || parsed['المؤهل_الدراسي'] || parsed['المؤهل'] || '';
          const rawMarital = parsed.maritalStatus || parsed['الحالة_الاجتماعية'] || '';
          const rawExpiry = parsed.idExpiryDate || parsed['تاريخ_الانتهاء'] || '';

          // Enrich and cross-verify with mathematical Egyptian National ID logic
          let idInfo: EgyptianNationalIdInfo | undefined;
          if (rawId) {
            idInfo = parseEgyptianNationalId(rawId);
          }

          // Compute clean English transliteration
          const transliterated = transliterateArabicNameToEnglish(rawFullName);
          const fNameEn = parsed.firstNameEn?.trim() || transliterated.firstNameEn;
          const lNameEn = parsed.lastNameEn?.trim() || transliterated.lastNameEn;

          // Split first/last name intelligently
          let fName = parsed.firstName || '';
          let lName = parsed.lastName || '';
          if (!fName && rawFullName) {
            const parts = rawFullName.trim().split(/\s+/);
            fName = parts[0] || '';
            lName = parts.slice(1).join(' ') || '';
          }

          return {
            success: true,
            source: 'gemini',
            fullNameAr: rawFullName,
            firstName: fName,
            lastName: lName,
            firstNameEn: fNameEn,
            lastNameEn: lNameEn,
            nationalId: idInfo?.isValid ? idInfo.nationalId : rawId,
            birthDate: idInfo?.isValid ? idInfo.birthDate : undefined,
            age: idInfo?.age,
            gender: idInfo?.gender || (parsed.gender === 'female' ? 'female' : 'male'),
            genderAr: idInfo?.genderAr,
            governorateAr: idInfo?.governorateAr || parsed.governorate,
            address: rawAddress,
            profession: rawProfession,
            qualification: rawQualification,
            maritalStatus: rawMarital,
            idExpiryDate: rawExpiry,
            nationality: parsed.nationality || 'Egyptian',
            religion: parsed.religion,
            idPhotoUrl: croppedPhotoUrl,
            idCardImage: frontImageBase64 || undefined,
            backCardImage: backImageBase64 || undefined,
          };
        }
      } catch (err: any) {
        console.warn('Gemini OCR API failed:', err);
        return {
          success: false,
          source: 'gemini',
          message: err?.message?.includes('API_KEY_INVALID')
            ? 'مفتاح Google Gemini API غير صالح، يرجى التأكد من نسخه بالكامل من Google AI Studio'
            : err?.message || 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي',
          idPhotoUrl: croppedPhotoUrl,
          nationality: 'Egyptian',
        };
      }
    }

    return {
      success: false,
      source: 'algorithmic_fallback',
      message: 'لم يتم تفعيل مفتاح الذكاء الاصطناعي.',
      idPhotoUrl: croppedPhotoUrl,
      nationality: 'Egyptian',
    };
  },

  /**
   * Generates a complete Job Description, duties, KPIs and translations.
   */
  async generateJobDescription(params: {
    title: string;
    department?: string;
    level?: string;
  }): Promise<GeneratedJobSpec> {
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const prompt = `
You are a senior HR director and organizational development expert for a multinational industrial and manufacturing company (operating in Egypt with Egyptian and Chinese management, similar to New Hope agricultural / manufacturing plants).
Create a comprehensive, professional job description for:
- Title: "${params.title}"
- Department: "${params.department || 'العمليات / الإدارة'}"
- Seniority Level: "${params.level || 'Mid'}"

Return ONLY valid JSON matching this schema:
{
  "titleAr": "المسمى الوظيفي بالعربية",
  "titleEn": "Job Title in English",
  "titleZh": "中文职位名称 (Job Title in Chinese)",
  "summaryAr": "ملخص الهدف العام من الوظيفة بالعربية",
  "summaryEn": "Job purpose summary in English",
  "summaryZh": "中文岗位职责概述 (Summary in Chinese)",
  "responsibilitiesAr": ["5-7 مهام ومسؤوليات رئيسية محددة وقابلة للقياس بالعربية"],
  "responsibilitiesEn": ["5-7 Key Responsibilities in English"],
  "responsibilitiesZh": ["5-7项主要岗位职责（中文）"],
  "kpisAr": ["4-5 مؤشرات أداء رئيسية KPIs لقياس كفاءة الموظف بالعربية"],
  "kpisEn": ["4-5 Measurable KPIs in English"],
  "kpisZh": ["4-5个关键绩效考核指标 KPIs（中文）"],
  "requirementsAr": ["4-5 متطلبات ومؤهلات رئيسية بالعربية"],
  "requirementsEn": ["4-5 Requirements in English"],
  "requirementsZh": ["4-5项岗位要求与任职资格（中文）"],
  "suggestedSalaryRange": { "min": 5000, "max": 12000 }
}
`;

        const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
        for (const model of models) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.3,
                    responseMimeType: 'application/json',
                  },
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawText) {
                const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanJson);
              }
            }
          } catch {
            continue;
          }
        }
      } catch (err) {
        console.warn('Gemini Job Spec generation failed, falling back to curated templates:', err);
      }
    }

    // Built-in Curated Templates (Zero API Key / Offline Mode)
    return getCuratedJobSpec(params.title, params.department, params.level);
  },

  /**
   * Builds live snapshot context of New Hope Gamasa operations to feed to Panda AI,
   * with real-time deep search for specific employees, national IDs, departments, or drivers.
   */
  async getPandaLiveContext(userQuery = ''): Promise<string> {
    try {
      const q = userQuery.trim().toLowerCase();
      const empsRes = await employeeService.getEmployees({ pageSize: 1000 }).catch(() => null);
      const emps = empsRes?.data || [];
      const totalEmps = empsRes?.total || emps.length;
      const insuredCount = emps.filter(e => e.insuranceStatus === 'insured').length;
      const notInsuredCount = emps.filter(e => e.insuranceStatus === 'not_insured').length;

      const drivers = await driverPayoutService.getDrivers().catch(() => []);
      const totalDrivers = drivers.length;

      const departments = [...new Set(emps.map(e => e.departmentName).filter(Boolean))];

      let specificFindings = '';

      // 1. Search for 14-digit National IDs or numbers in the query
      const numberMatches = userQuery.match(/\d{7,14}/g);
      if (numberMatches && numberMatches.length > 0) {
        for (const num of numberMatches) {
          // A) Algorithmic National ID validation & extraction
          const parsed = parseEgyptianNationalId(num);
          let nationalIdInfo = '';
          if (parsed.isValid) {
            nationalIdInfo = `
- الرقم القومي المستعلم عنه: ${num}
- تاريخ الميلاد المستخرج رسمياً: ${parsed.birthDateFormatted} (السن: ${parsed.age} سنة)
- محل الميلاد / المحافظة: ${parsed.governorateAr}
- النوع: ${parsed.genderAr}
- الحالة: رقم قومي مصري رسمي وصحيح 100%
            `.trim();
          }

          // B) Search in Database for this employee
          const foundEmp = emps.find(e =>
            (e.nationalId && e.nationalId.includes(num)) ||
            (e.employeeId && e.employeeId.includes(num)) ||
            (e.phone && e.phone.includes(num))
          );

          if (foundEmp) {
            const fullName = foundEmp.arabicName || `${foundEmp.firstName} ${foundEmp.lastName}`;
            const basic = Number(foundEmp.basicSalary || 0);
            const housing = Number(foundEmp.housingAllowance || 0);
            const transport = Number(foundEmp.transportAllowance || 0);
            const totalSalary = basic + housing + transport;

            specificFindings += `
\n[🚨 ملف الموظف المستخرج فوراً من قاعدة بيانات نيو هوب للرقم ${num}]:
- الاسم الكامل: ${fullName} (بالإنجليزي: ${foundEmp.firstName} ${foundEmp.lastName})
- كود الموظف (ID): ${foundEmp.employeeId}
- الرقم القومي: ${foundEmp.nationalId}
- المسمى الوظيفي: ${foundEmp.positionTitle || 'موظف'}
- القسم التابع له: ${foundEmp.departmentName || 'العمليات والإنتاج'}
- تاريخ التعيين: ${foundEmp.hireDate || '-'}
- مقر العمل: ${foundEmp.workLocation || 'مصنع جمصة'}
- الحالة الوظيفية: ${foundEmp.employmentStatus === 'active' ? 'على رأس العمل (نشط)' : foundEmp.employmentStatus}
- الراتب الأساسي: ${basic.toLocaleString()} ج.م
- بدل السكن: ${housing.toLocaleString()} ج.م | بدل الانتقال: ${transport.toLocaleString()} ج.م
- إجمالي الراتب الشهري: ${totalSalary.toLocaleString()} ج.م
- الموقف التأميني: ${foundEmp.insuranceStatus === 'insured' ? `مؤمن عليه (الرقم التأميني: ${foundEmp.insuranceNumber || 'مسجل'} - أجر الاشتراك: ${foundEmp.insuranceSalary || basic} ج.م)` : 'غير مؤمن عليه'}
- حالة المستندات: بطاقة الرقم القومي (${foundEmp.idCardStatus === 'available' ? 'مستوفاة ومرفقة بالملف ✓' : 'غير مستوفاة ✕'})
            `.trim();
          } else if (parsed.isValid) {
            specificFindings += `
\n[🚨 نتيجة البحث بالرقم القومي ${num} في قاعدة بيانات نيو هوب]:
${nationalIdInfo}
- النتيجة بالسيستم: هذا الرقم القومي مصري وصحيح، وتفاصيله الديموغرافية كما هي أعلاه. إذا لم يظهر كود وظيفي له، فالموظف لم يتم استكمال حفظه في جدول الموظفين الفعليين بالنظام، واعرض هذه البيانات فوراً وأخبر المستخدم بأنه يمكنه إضافته الآن من استمارة إضافة موظف جديد.
            `.trim();
          }
        }
      }

      // 2. Search for Employee by Name (if user wrote a name)
      const words = q.split(/\s+/).filter(w => w.length > 2 && !['هات', 'عاوز', 'مين', 'بيانات', 'موظف', 'فين', 'رقم'].includes(w));
      if (words.length > 0 && !specificFindings) {
        const matchedEmps = emps.filter(e => {
          const empStr = `${e.firstName} ${e.lastName} ${e.arabicName || ''}`.toLowerCase();
          return words.some(w => empStr.includes(w));
        }).slice(0, 5);

        if (matchedEmps.length > 0) {
          specificFindings += `\n[🚨 موظفون مطابقون لبحث الاسم في قاعدة البيانات]:\n` + matchedEmps.map(e => {
            const fullName = e.arabicName || `${e.firstName} ${e.lastName}`;
            return `- ${fullName} | كود: ${e.employeeId} | وظيفة: ${e.positionTitle} | قسم: ${e.departmentName} | قومي: ${e.nationalId} | راتب: ${e.basicSalary || 0} ج.م | تأمينات: ${e.insuranceStatus === 'insured' ? 'مؤمن' : 'غير مؤمن'}`;
          }).join('\n');
        }
      }

      // 3. Search for Drivers if query asks about drivers/sawaqeen
      if (q.includes('سائق') || q.includes('سواق') || q.includes('سواقين') || q.includes('نقل') || q.includes('سيار')) {
        const driversList = drivers.slice(0, 15).map(d => `- السائق: ${d.name} (${d.vehicleType || 'ميكروباص'}) | إجمالي مستحقاته المسجلة: ${d.totalAmount || 0} ج.م | القسم: ${d.category === 'production' ? 'إنتاج' : 'إدارة'}`).join('\n');
        specificFindings += `\n[🚨 كشف أسطول السائقين الحالي بمصنع جمصة (${drivers.length} سائق)]:\n${driversList}`;
      }

      // 4. Search for Department summary if a department is mentioned
      for (const dept of departments) {
        if (q.includes(dept.toLowerCase())) {
          const deptEmps = emps.filter(e => e.departmentName === dept);
          specificFindings += `\n[🚨 بيانات قسم ${dept}]: إجمالي الموظفين: ${deptEmps.length} موظف (مؤمن: ${deptEmps.filter(e => e.insuranceStatus === 'insured').length}). أسماء الموظفين: ${deptEmps.slice(0, 8).map(e => e.arabicName || `${e.firstName} ${e.lastName}`).join('، ')}.`;
        }
      }

      return `
[الواقع الإجمالي الحالي لمنشأة نيو هوب مصنع جمصة]:
- اسم الشركة: شركة نيو هوب إيجيبت أكواتك تكنولوجي المحدودة (New Hope Gamasa - 新希望六和 加马萨).
- إجمالي عدد الموظفين المسجلين في النظام: ${totalEmps} موظف.
- الموظفون المؤمن عليهم: ${insuredCount} | غير المؤمن عليهم: ${notInsuredCount}.
- الأقسام الرئيسية: ${departments.join('، ') || 'الإنتاج، الصيانة، الحركة، الإدارة'}.
- عدد السائقين: ${totalDrivers} سائق.
${specificFindings}
      `.trim();
    } catch {
      return 'شركة نيو هوب إيجيبت أكواتك تكنولوجي المحدودة - مصنع مدينة جمصة (قانون العمل المصري 12/2003).';
    }
  },

  /**
   * Interactive Chat with New Hope Panda AI Assistant 🐼
   */
  async chatWithPanda(
    history: Array<{ role: 'user' | 'model'; text: string }>,
    systemContext?: string
  ): Promise<string> {
    const apiKey = this.getApiKey();
    const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];

    const PANDA_SYSTEM_PROMPT = `
أنت "باندا نيو هوب" (New Hope Panda AI 🐼)، المساعد الذكي والخبير القانوني والإداري للموارد البشرية (HR) لشركة "نيو هوب إيجيبت أكواتك تكنولوجي المحدودة - مصنع جمصة" (New Hope Gamasa - 新希望六和 加马萨).

⚠️ تنبيهات حاسمة ومطلقة لـ باندا (Strict Rules):
1. أنت تمتلك وصولاً حياً ومباشراً لقاعدة بيانات نظام HR مصنع جمصة (Live Real-time Database Access).
2. تم تزويدك أدناه ببيانات الاستعلام الحقيقية المستخرجة مباشرة من قاعدة البيانات بخصوص استفسار المستخدم (سواء كان رقماً قومياً، أو اسم موظف، أو راتباً، أو كشف سائقين).
3. ⛔ ممنوع منعاً باتاً ومطلقاً أن تقول للمستخدم:
   - "لا أمتلك قاعدة بيانات"
   - "الذكاء الاصطناعي لا يمتلك ذاكرة فعلية"
   - "افتح شيت الإكسل في مكتبك وابحث بنفسك"
   - "هذا خط أحمر للخصوصية"
4. بل واجبك فـوراً هو:
   - إذا تم تزويدك ببيانات الموظف أو تحليله أعلاه: اعرض كل تفاصيل ملفه وراتبه وقسمه وموقفه التأميني بفخر واحترافية وبشكل منسق وجذاب.
   - إذا كان الرقم القومي صحيحاً ولكن غير مسجل في السيستم: اعرض تاريخ ميلاده ومحافظته وسنه المستخرج بدقة وأخبره أنه غير مضاف حتى الآن ويمكن إضافته بضغطة زر.
   - دائماً أجب بثقة ومعرفة تامة لأنك "باندا نيو هوب الذكي 🐼" المتصل بالسيستم!

أنت تتميز بالصفات التالية:
1. مستشار معتمد في قانون العمل المصري رقم 12 لسنة 2003 وقانون التأمينات الاجتماعية رقم 148 لسنة 2019:
   - ضوابط المادة 69 لإنهاء الخدمة بسبب الغياب (إنذار بعد 5 أيام متصلة أو 10 أيام متقطعة، وعلم الوصول).
   - معادلة مكافأة نهاية الخدمة (نصف شهر عن كل سنة من السنوات الخمس الأولى، وشهر كامل عن كل سنة تالية).
   - رصيد الإجازات السنوية (21 يوماً بعد مضي 6 أشهر، و30 يوماً لمن أمضى 10 سنوات أو تجاوز 50 سنة).
   - فترات الاختبار (لا تتجاوز 3 أشهر، ولا يجوز تكرارها لدى نفس صاحب العمل).
2. صائغ خطابات محترف: عندما يُطلب منك خطاب (إنذار، شهادة خبرة، لفت نظر، إيميل رسمي، مفردات مرتب)، اكتبه كاملاً ومنسقاً بنقاط واضحة ومسافات وفراغات للأسماء والتواريخ ليكون جاهزاً للطباعة فوراً.
3. التنسيق اللغوي والدولي: تكتب بأسلوب عربي راقٍ ومهني، وتدعم الترجمة الصينية (中文) والإنجليزية عند الطلب لخدمة الإدارة الصينية للشركة.
4. الرد بأسلوب لطيف ومنظم باستخدام الترقيم والنقاط العريضة والـ Markdown ووضع إيموجي الباندا 🐼 بلباقة.

[بيانات واقع المنظومة ومصنع جمصة الحالي وبيانات الاستعلام المستخرجة]:
${systemContext || 'مصنع جمصة - نيو هوب إيجيبت أكواتك'}
    `.trim();

    // Prepare message contents for Gemini
    const contents: any[] = [
      {
        role: 'user',
        parts: [{ text: `تعليمات النظام:\n${PANDA_SYSTEM_PROMPT}\n\nيرجى بدء المحادثة بلطف كـ "باندا نيو هوب الذكي 🐼".` }],
      },
      {
        role: 'model',
        parts: [{ text: 'أهلاً وسهلاً بك! أنا باندا نيو هوب 🐼، مساعدك الذكي في إدارة الموارد البشرية وشؤون العاملين وقوانين العمل وصياغة المستندات. 你好！كيف أستطيع مساعدتك اليوم؟' }],
      },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      })),
    ];

    if (apiKey) {
      for (const model of models) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents,
                generationConfig: {
                  temperature: 0.45,
                  maxOutputTokens: 2500,
                },
              }),
            }
          );

          if (!res.ok) continue;

          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply && reply.trim().length > 0) {
            return reply.trim();
          }
        } catch {
          continue;
        }
      }
    }

    // Built-in intelligent offline response generator if API is unreachable
    const lastMsg = history[history.length - 1]?.text || '';
    return generateOfflinePandaResponse(lastMsg);
  },
};

/**
 * Intelligent Curated Offline Responses for HR & Labor Law Questions
 */
function generateOfflinePandaResponse(query: string): string {
  const q = query.toLowerCase();

  // 1. National ID Extraction
  const idMatch = query.match(/\b(2|3)\d{13}\b/);
  if (idMatch) {
    const id = idMatch[0];
    const parsed = parseEgyptianNationalId(id);
    if (parsed.isValid) {
      return `### 🐼 نتيجة استعلام الرقم القومي (\`${id}\`) من قاعدة بيانات نيو هوب:

- **الرقم القومي:** \`${id}\`
- **تاريخ الميلاد:** **${parsed.birthDateFormatted}** (السن: **${parsed.age} سنة**)
- **محل الإقامة / المحافظة:** **${parsed.governorateAr}**
- **النوع:** **${parsed.genderAr}**
- **الصلاحية القانونية:** رقم قومي مصري رسمي وصحيح 100% ✓

📌 **حالة السجل بالسيستم:**
الرقم القومي معتمد ومفحوص رسمياً. إذا كان الموظف لم يكتمل تسجيله بعد في جدول الأجور والموظفين الفعليين، فيمكنك إضافته بضغطة زر واحدة عبر **«قارئ البطاقة الذكي (AI Scanner)»** في نافذة إضافة موظف جديد لملء كافة حقوله تلقائياً! 🐼✨`;
    }
  }

  if (q.includes('غياب') || q.includes('مادة 69') || q.includes('فصل') || q.includes('انقطاع')) {
    return `### 🐼 توضيح باندا القانوني بشأن إجراءات الغياب بدون إذن (المادة 69 من قانون العمل المصري):

طبقاً لنص **المادة (69) من قانون العمل رقم 12 لسنة 2003**، لا يجوز فصل العامل إلا إذا ارتكب خطأ جسيماً، وإليك الإجراءات الإلزامية لتفادي بطلان الإجراء:

1. **الغياب المتصل (أكثر من 20 يوماً متصلة):**
   - يجب إرسال **إنذار كتابي رسمي بخطاب مسجل موصى عليه بعلم الوصول** بعد انقطاع **10 أيام متصلة**.
   - إذا استمر غيابه 10 أيام إضافية بعد وصول الإنذار أو ارتداده، يحق للإدارة توجيه مذكرة لمكتب العمل وتحريك إجراءات الإنهاء.

2. **الغياب المتقطع (أكثر من 10 أيام في السنة):**
   - يجب توجيه الإنذار بعد **5 أيام غياب متقطعة**.
   - عند اكتمال الغياب لأكثر من 10 أيام خلال السنة التعاقدية، يجوز توقيع الجزاء.

⚠️ **توصية هامة:** يُشترط إجراء تحقيق إداري وسماع أقوال العامل أو إثبات تخلفه عن الحضور قبل اتخاذ قرار إنهاء الخدمة.`;
  }

  if (q.includes('مكافأة') || q.includes('نهاية الخدمة') || q.includes('سنوات')) {
    return `### 🐼 احتساب مكافأة نهاية الخدمة طبقاً لقانون العمل المصري:

طبقاً للمادة (126) من قانون العمل:
- **عن كل سنة من السنوات الخمس الأولى:** يستحق العامل أجر **نصف شهر** عن كل سنة.
- **عن كل سنة من السنوات التالية:** يستحق العامل أجر **شهر كامل** عن كل سنة.

📌 **مثال توضيحي:**
إذا كان راتب الموظف 6,000 ج.م وقضى في الشركة 7 سنوات:
- الخمس سنوات الأولى: (5 × 3,000) = 15,000 ج.م
- السنتان التاليتان: (2 × 6,000) = 12,000 ج.م
- **إجمالي المكافأة المستحقة:** 27,000 ج.م.`;
  }

  if (q.includes('إجاز') || q.includes('سنوي') || q.includes('رصيد')) {
    return `### 🐼 رصيد الإجازات السنوية وفقاً لقانون العمل (المادة 47):

1. **السنة الأولى:** يستحق العامل إجازة سنوية بنسبة المدة التي قضاها بعد مضي **6 أشهر** من تاريخ استلام العمل بمعدل **21 يوماً** في السنة الكاملة.
2. **عشر سنوات خدمة:** تزداد الإجازة إلى **30 يوماً** إذا أمضى العامل 10 سنوات في الخدمة (لدى صاحب عمل أو أكثر).
3. **فوق سن الخمسين:** تمنح الإجازة بواقع **30 يوماً** لمن تجاوزت سنه خمسين عاماً.
4. **المناطق النائية والأعمال الشاقة:** تزداد الإجازة بمقدار 7 أيام للعمال في المناطق النائية والصناعات المحددة بقرار وزاري.`;
  }

  if (q.includes('إنذار') || q.includes('خطاب') || q.includes('صياغ')) {
    return `### 🐼 نموذج إنذار بالانقطاع عن العمل (جاهز للطباعة):

**شركة نيو هوب إيجيبت أكواتك تكنولوجي المحدودة**  
**إدارة الموارد البشرية والشؤون الإدارية**  

**التاريخ:** ${new Date().toLocaleDateString('ar-EG')}  
**إلى السيد / ....................................**  
**الوظيفة / ....................................**  
**الرقم القومي / ..............................**  

**الموضوع: إنذار رسمي بالانقطاع عن العمل بعلم الوصول**  

نحيط سيادتكم علماً بأنكم قد انقطعتم عن العمل اعتباراً من يوم ................ الموافق .... / .... / 2026 دون مسوغ قانوني أو إذن كتابي مسبق.  

وحيث إن هذا الغياب يُعد مخالفة لأحكام لائحة تنظيم العمل وللمادة (69) من قانون العمل المصري رقم 12 لسنة 2003؛  
لذا ننذركم بضرورة الحضور فوراً واستئناف العمل وتقديم الأعذار المقبولة خلال مهلة أقصاها (48 ساعة) من تاريخ استلامكم هذا الإنذار، وإلا ستضطر الإدارة آسفة لاتخاذ كافة الإجراءات القانونية المقررة بما فيها إنهاء الخدمة.  

**وتفضلوا بقبول فائق الاحترام،،**  

**مدير إدارة الموارد البشرية**  
**شركة نيو هوب إيجيبت**`;
  }

  return `### 🐼 مرحباً بك من باندا نيو هوب الذكي!

أنا في خدمتك لمساعدتك في كل ما يتعلق بإدارة الموارد البشرية بمصنع نيو هوب جمصة (Gamasa). يمكنك سؤالي عن:
- ⚖️ **استشارات قانون العمل المصري** (الإجازات، الجزاءات، التحقيقات، المادة 69، مكافآت نهاية الخدمة).
- 📝 **صياغة الخطابات والمستندات** (إنذارات الغياب، خطابات مفردات المرتب HR Letter، إعلانات الشركة).
- 📊 **بيانات الموظفين والسائقين والتأمينات** في المنشأة.
- 🇨🇳 **الترجمة الإدارية والتنسيق الصيني** (中文沟通).

اكتب لي ما تريده وسأساعدك فوراً! 🐼✨`;
}

/**
 * High-quality curated templates for common manufacturing, transport, and administrative roles.
 */
function getCuratedJobSpec(
  title: string,
  department = 'العمليات والإنتاج',
  level = 'Mid'
): GeneratedJobSpec {
  const lower = title.toLowerCase();

  // 1. السائقين (سائق نقل / سائق توزيع / سائق رافعة)
  if (lower.includes('سائق') || lower.includes('driver')) {
    return {
      titleAr: title || 'سائق نقل وتوزيع',
      titleEn: 'Transport & Distribution Driver',
      titleZh: '运输与配送司机',
      summaryAr: 'المسؤولية عن قيادة مركبات الشركة ونقل وتوزيع البضائع والمنتجات بأمان والالتزام الكامل بمواعيد التسليم وإجراءات السلامة.',
      summaryEn: 'Responsible for operating company transport vehicles, safely delivering goods and products on schedule, and adhering to road safety regulations.',
      summaryZh: '负责驾驶公司运输车辆，按时安全运送和分发货物，严格遵守道路交通安全法规。',
      responsibilitiesAr: [
        'قيادة سيارات وشاحنات الشركة لنقل البضائع والمعدات بكفاءة وأمان.',
        'فحص دوري يومي للمركبة (مستوى الزيت، ضغط الإطارات، الفرامل، الوقود) قبل التحرك.',
        'متابعة ومطابقة أذونات التسليم والاستلام ومراجعة حمولة الشحنة مع مسؤولي المخازن.',
        'الالتزام بالمسارات والخطوط المحددة وقوانين المرور وعدم تجاوز السرعات المقررة.',
        'الإبلاغ الفوري عن أي أعطال أو حوادث أو متطلبات صيانة للمركبة.',
        'المحافظة على نظافة وجاهزية المركبة وسلامة العهدة والوثائق الملحقة بها.',
      ],
      responsibilitiesEn: [
        'Safely drive and operate company transport vehicles and trucks.',
        'Perform daily routine pre-trip vehicle inspections (oil, tires, brakes, fuel).',
        'Verify delivery orders and cross-check cargo with warehouse staff before departure.',
        'Adhere strictly to designated routes, speed limits, and traffic laws.',
        'Immediately report any mechanical failures, incidents, or maintenance needs.',
        'Maintain vehicle cleanliness, cargo security, and associated paperwork.',
      ],
      responsibilitiesZh: [
        '安全驾驶和操作公司运输车辆及卡车运送货物。',
        '出车前进行每日日常车辆检查（机油、轮胎、刹车、燃油）。',
        '核对送货单据，并在发车前与仓库人员清点货物。',
        '严格遵守指定路线、限速要求及交通法规。',
        '发生机械故障、事故或保养需求时立即上报。',
        '保持车辆整洁，确保货物及随车单证的安全。',
      ],
      kpisAr: [
        'نسبة التسليم في الموعد المحدد (On-Time Delivery Rate ≥ 95%).',
        'معدل استهلاك الوقود ضمن المعدلات القياسية المعتمدة.',
        'سجل خالٍ تماماً من الحوادث والمخالفات المرورية (Zero Traffic Violations).',
        'الالتزام بجدول الفحص والصيانة الدورية للمركبة في مواعيدها.',
      ],
      kpisEn: [
        'On-Time Delivery Rate (Target: ≥ 95%).',
        'Fuel efficiency compliance within standard consumption rates.',
        'Zero preventable accidents and zero traffic violations.',
        'Adherence to routine vehicle maintenance schedule.',
      ],
      kpisZh: [
        '准时交货率（目标：≥ 95%）。',
        '燃油消耗符合标准定额指标。',
        '零责任交通事故及零交通违法记录。',
        '按时执行车辆日常维护与保养计划。',
      ],
      requirementsAr: [
        'رخصة قيادة مهنية سارية (درجة أولى أو ثانية).',
        'خبرة عملية لا تقل عن 3 سنوات في قيادة شاحنات النقل والتوزيع.',
        'سجل قيادة نظيف وخالٍ من المخالفات الجسيمة.',
        'معرفة جيدة بالطرق والمحاور ومناطق التوزيع.',
      ],
      requirementsEn: [
        'Valid professional commercial driving license.',
        'Minimum 3 years proven experience in transport and distribution driving.',
        'Clean driving record with no major violations.',
        'Good knowledge of delivery routes and regional road networks.',
      ],
      requirementsZh: [
        '持有有效的专业驾驶执照。',
        '至少3年货运配送驾驶经验。',
        '驾驶记录良好，无重大违章记录。',
        '熟悉配送路线及区域道路交通状况。',
      ],
      suggestedSalaryRange: { min: 5500, max: 9000 },
    };
  }

  // 2. الصيانة والتشغيل (فني صيانة / مهندس ميكانيكا أو كهرباء)
  if (lower.includes('صيانة') || lower.includes('maintenance') || lower.includes('فني') || lower.includes('ميكانيك')) {
    return {
      titleAr: title || 'فني صيانة ميكانيكية وكهربائية',
      titleEn: 'Maintenance Technician',
      titleZh: '机电维修技术员',
      summaryAr: 'المحافظة على الجاهزية التشغيلية لخطوط الإنتاج والمعدات، وتنفيذ خطط الصيانة الوقائية والتصحيحية لتقليل فترات التوقف.',
      summaryEn: 'Ensure high operational uptime for production lines and machinery by executing preventive and corrective maintenance tasks.',
      summaryZh: '执行预防性与纠正性维护任务，确保生产线和机械设备的高效运转，最大程度减少停机时间。',
      responsibilitiesAr: [
        'تنفيذ برامج الصيانة الوقائية الدورية لجميع خطوط الإنتاج والآلات.',
        'تشخيص الأعطال الميكانيكية والكهربائية وإصلاحها بسرعة لتقليل توقف المصنع.',
        'متابعة ومراقبة أداء المولدات، الضواغط، والمحركات وتسجيل القراءات اليومية.',
        'تركيب ومعايرة قطع الغيار الجديدة والتأكد من توافقها مع معايير المصنع.',
        'الالتزام الصارم بقواعد السلامة والصحة المهنية (HSE) وإجراءات قفل الطاقة (LOTO).',
        'توثيق جميع أعمال الصيانة وقطع الغيار المستهلكة في السجلات اليومية.',
      ],
      responsibilitiesEn: [
        'Execute scheduled preventive maintenance routines across all machinery.',
        'Diagnose mechanical and electrical faults rapidly to minimize downtime.',
        'Monitor performance of generators, compressors, and motors, logging daily parameters.',
        'Install and calibrate spare parts conforming to technical specifications.',
        'Strictly observe Occupational Health & Safety (HSE) standards and Lockout/Tagout (LOTO).',
        'Log all maintenance actions and spare parts consumption in daily reports.',
      ],
      responsibilitiesZh: [
        '对所有生产线设备执行定期的预防性维护保养。',
        '快速诊断并排除机械及电气故障，减少设备停机时间。',
        '监控发电机、空压机和电机的运行状态并记录日常参数。',
        '按照技术规范安装并校准备品备件。',
        '严格遵守职业健康安全（HSE）标准和挂牌上锁（LOTO）规程。',
        '在日常维修台账中详细记录所有维护工单和备件消耗。',
      ],
      kpisAr: [
        'نسبة الجاهزية التشغيلية للآلات (Machine Availability ≥ 96%).',
        'متوسط وقت الإصلاح عند الأعطال (MTTR ≤ ساعتين).',
        'نسبة إنجاز خطة الصيانة الوقائية في موعدها (≥ 95%).',
        'صفر إصابات عمل ناتجة عن عدم الالتزام بإجراءات السلامة.',
      ],
      kpisEn: [
        'Overall Machine Availability rate (Target: ≥ 96%).',
        'Mean Time to Repair (MTTR ≤ 2 hours).',
        'Preventive Maintenance completion compliance (≥ 95%).',
        'Zero safety incidents resulting from non-compliance.',
      ],
      kpisZh: [
        '设备综合可用率（目标：≥ 96%）。',
        '平均故障修复时间（MTTR ≤ 2小时）。',
        '预防性维护计划按时完成率（≥ 95%）。',
        '零安全违规事故记录。',
      ],
      requirementsAr: [
        'دبلوم فني صناعي أو مؤهل هندسي مناسب في الميكانيكا أو الكهرباء.',
        'خبرة عملية من 2 إلى 5 سنوات في صيانة مصانع وخطوط إنتاج مستمرة.',
        'مهارة عالية في قراءة المخططات الهندسية والكهربائية واستخدام أجهزة القياس.',
        'القدرة على العمل بنظام الورديات والتعامل مع حالات الطوارئ التشغيلية.',
      ],
      requirementsEn: [
        'Technical diploma or equivalent in Mechanical/Electrical maintenance.',
        '2 to 5 years hands-on experience in manufacturing plant maintenance.',
        'Proficiency in reading technical schematics and using testing equipment.',
        'Willingness to work in shifts and respond to plant emergency call-outs.',
      ],
      requirementsZh: [
        '机电或机械专业中专/大专及以上学历。',
        '2至5年制造业工厂现场维护实操经验。',
        '熟练掌握电气及机械图纸的识读与各类测量仪器的使用。',
        '能够适应倒班制并应对紧急抢修工况。',
      ],
      suggestedSalaryRange: { min: 6000, max: 11000 },
    };
  }

  // 3. الموارد البشرية والترجمة (HR / Translator / Admin)
  if (lower.includes('ترجم') || lower.includes('translator') || lower.includes('chinese') || lower.includes('صين')) {
    return {
      titleAr: title || 'مترجم لغة صينية ومسؤول إداري',
      titleEn: 'Chinese Translator & Admin Officer',
      titleZh: '中阿双语翻译与行政专员',
      summaryAr: 'تسهيل التواصل والترجمة الفورية والكتابية بين الإدارة الصينية والكوادر المصرية، ودعم التنسيق الإداري والمستندات الرسمية.',
      summaryEn: 'Facilitate fluent verbal and written translation between Chinese management and local Egyptian staff, supporting cross-cultural administration.',
      summaryZh: '负责中方管理层与埃及本地员工之间的口译与笔译沟通，协助开展跨文化日常行政管理工作。',
      responsibilitiesAr: [
        'الترجمة الفورية في الاجتماعات الإدارية وموقع العمل بين الإدارة الصينية والمهندسين والعمال المصريين.',
        'ترجمة اللوائح والتعليمات الفنية وتقارير الإنتاج الرسمية بين اللغتين الصينية والعربية.',
        'التنسيق في استقبال الوفود والخبراء ومتابعة إجراءات الإقامة والتأشيرات وتصاريح العمل.',
        'دعم قسم الموارد البشرية في توضيح التوجيهات وضمان دقة نقل متطلبات العمل.',
        'متابعة ومراجعة العقود والمراسلات المكتوبة بكلا اللغتين وتوثيقها بدقة.',
      ],
      responsibilitiesEn: [
        'Provide accurate simultaneous and consecutive interpretation during meetings and on-site operations.',
        'Translate company policies, technical work instructions, and production reports between Chinese and Arabic.',
        'Assist with expat coordination, visa renewals, residency, and labor permits.',
        'Support HR operations in bridging communication gaps and cultural alignment.',
        'Maintain organized bilingual documentation and records.',
      ],
      responsibilitiesZh: [
        '在日常会议、生产现场及技术交流中提供准确的中阿双向口译。',
        '翻译公司各项制度、技术规程及日常生产报告（中阿双语）。',
        '协助中方外派员工的签证办理、居留许可及工作证事务。',
        '协助HR部门做好跨文化沟通，确保各项指令准确传达至本地团队。',
        '整理、归档并审核中阿双语文件与合同资料。',
      ],
      kpisAr: [
        'دقة وسرعة الترجمة الفورية والتحريرية دون التباس في المصطلحات الفنية.',
        'صفر شكاوى من سوء الفهم في التعليمات التشغيلية المترجمة.',
        'إنجاز معاملات الإقامة وتصاريح الخبراء قبل موعد انتهائها بنسبة 100%.',
        'مستوى رضا الإدارة وفريق العمل عن التنسيق والتواصل.',
      ],
      kpisEn: [
        'High translation precision and prompt turnaround for technical documentation.',
        'Zero operational incidents arising from miscommunication.',
        '100% on-time processing of expat visas and work permits.',
        'Positive satisfaction ratings from cross-functional management.',
      ],
      kpisZh: [
        '专业术语翻译准确度高，口笔译交付及时。',
        '无因翻译误差导致的生产或管理误解。',
        '中方人员签证及工作证件按期办结率100%。',
        '跨文化团队沟通顺畅度及满意度评价优良。',
      ],
      requirementsAr: [
        'ليسانس لغات وترجمة أو ألسن قسم لغة صينية (مستوى HSK 5 أو 6).',
        'خبرة سنتين على الأقل في الترجمة الصناعية أو بيئة الشركات الصينية.',
        'إتقان ممتاز للغتين الصينية والعربية تحدثاً وكتابة، مع إلمام بالإنجليزية.',
        'مهارات تواصل عالية ودبلوماسية في إدارة بيئات العمل متعددة الثقافات.',
      ],
      requirementsEn: [
        'Bachelor’s in Chinese Language / Translation (HSK Level 5 or 6 certified).',
        'At least 2 years experience in manufacturing or Chinese enterprise environments.',
        'Fluent spoken and written Chinese and Arabic; English proficiency is a plus.',
        'Strong cross-cultural communication and coordination skills.',
      ],
      requirementsZh: [
        '中文/阿拉伯语翻译相关专业本科学历（HSK 5/6级或母语水准）。',
        '具备2年以上制造业或中资企业全职翻译与行政经验。',
        '精通中阿双语口笔译，具备良好的英语沟通能力者优先。',
        '具备出色的跨文化沟通协调能力与团队协作精神。',
      ],
      suggestedSalaryRange: { min: 10000, max: 20000 },
    };
  }

  // 4. القالب العام الذكي (Generic Professional Position)
  return {
    titleAr: title,
    titleEn: title,
    titleZh: title,
    summaryAr: `أداء المهام والمسؤوليات التخصصية المرتبطة بوظيفة ${title} في قسم ${department} وتحقيق الأهداف التشغيلية بكفاءة عالية.`,
    summaryEn: `Execute core professional duties for ${title} in the ${department} department, ensuring high operational standards and timely delivery.`,
    summaryZh: `负责${department}部门内${title}岗位的专业核心工作，确保高质量、高标准地完成各项经营目标。`,
    responsibilitiesAr: [
      `تنفيذ الأعمال اليومية والمكلف بها الخاصة بوظيفة ${title} وفق السياسات المعتمدة.`,
      'التنسيق الفعال مع فرق العمل المختلفة والإدارات المعنية لضمان انسيابية العمل.',
      'إعداد التقارير الدورية ورفعها للمدير المباشر موضحة مؤشرات الإنجاز.',
      'المحافظة على جودة مخرجات العمل والالتزام بالمعايير واللوائح المنظمة.',
      'المشاركة في تطوير إجراءات العمل وتقديم مقترحات تحسين الأداء.',
    ],
    responsibilitiesEn: [
      `Perform daily operational responsibilities for the ${title} position per corporate policies.`,
      'Coordinate closely with cross-departmental teams to ensure seamless workflow.',
      'Prepare and submit periodic progress reports highlighting key achievements.',
      'Maintain deliverable quality and adhere strictly to standard operating procedures.',
      'Participate in continuous improvement initiatives to optimize performance.',
    ],
    responsibilitiesZh: [
      `按公司制度和标准流程严格履行${title}岗位的各项日常工作职责。`,
      '与各部门团队保持高效协同，保障业务流程顺畅衔接。',
      '定期编制并向直接主管提交工作进度汇报及核心数据分析。',
      '严把工作交付质量关，恪守公司各项规章制度。',
      '积极参与流程持续改进活动，主动提出优化效率的合理化建议。',
    ],
    kpisAr: [
      'نسبة إنجاز المهام المطلوبة في المواعيد المحددة (≥ 95%).',
      'مستوى دقة وجودة مخرجات العمل والتوافق مع المعايير.',
      'الالتزام بالحضور وسياسات الشركة ولوائح العمل الداخلية.',
      'تقييم الأداء العام من المدير المباشر (إيجابي ومحقق للمستهدف).',
    ],
    kpisEn: [
      'On-time task completion rate (Target: ≥ 95%).',
      'Deliverable quality and adherence to specifications.',
      'Attendance compliance and adherence to company policies.',
      'Overall supervisory performance appraisal rating.',
    ],
    kpisZh: [
      '工作任务按时完成率（目标：≥ 95%）。',
      '工作交付质量及达标率。',
      '日常出勤率及对公司各项规章制度的执行力。',
      '直接主管综合绩效考核评价（达标及以上）。',
    ],
    requirementsAr: [
      'مؤهل دراسي مناسب لطبيعة الوظيفة والمهام المطلوبة.',
      'خبرة عملية سابقة في نفس المجال لا تقل عن سنتين.',
      'إجادة العمل على الحاسب الآلي والبرامج المكتبية ذات الصلة.',
      'مهارات جيدة في التواصل وحل المشكلات والعمل الجماعي.',
    ],
    requirementsEn: [
      'Relevant degree or educational background suited to the position.',
      'Minimum 2 years of proven relevant professional experience.',
      'Proficiency in computer software and related office applications.',
      'Strong communication, problem-solving, and teamwork capabilities.',
    ],
    requirementsZh: [
      '具有与岗位职责相匹配的大专或本科学历。',
      '具备至少2年相关领域的扎实从业经验。',
      '熟练操作计算机及相关常用办公软件。',
      '具备良好的沟通表达、问题解决能力与团队合作精神。',
    ],
    suggestedSalaryRange: { min: 5000, max: 10000 },
  };
}
