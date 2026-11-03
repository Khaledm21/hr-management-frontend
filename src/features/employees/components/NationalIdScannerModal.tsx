import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Key,
  Eye,
  RefreshCw,
  User,
  Calendar,
  MapPin,
  CreditCard,
  X,
  ShieldCheck,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Heart,
  Plus,
  Trash2,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import { aiService, ScannedIdResult } from '../../../services/aiService';
import {
  cropImageRegion,
  resizeImage,
  DEFAULT_EGYPTIAN_ID_PHOTO_REGION_LEFT,
  DEFAULT_EGYPTIAN_ID_PHOTO_REGION_RIGHT,
} from '../../../utils/imageCropper';
import { parseEgyptianNationalId } from '../../../utils/nationalIdParser';
import { transliterateArabicNameToEnglish } from '../../../utils/arabicNameTransliteration';

interface NationalIdScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: {
    fullNameAr?: string;
    firstName?: string;
    lastName?: string;
    firstNameEn?: string;
    lastNameEn?: string;
    nationalId?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female';
    governorateAr?: string;
    address?: string;
    avatarData?: string;
    qualification?: string;
    profession?: string;
    maritalStatus?: string;
    idExpiryDate?: string;
    idCardImage?: string;
    backCardImage?: string;
  }) => void;
}

export const NationalIdScannerModal: React.FC<NationalIdScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
}) => {
  const { success, error: toastError, info } = useToast();
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);
  const [croppedAvatar, setCroppedAvatar] = useState<string | null>(null);
  const [photoSide, setPhotoSide] = useState<'left' | 'right'>('left');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedIdResult | null>(null);

  // Settings / API Key drawer toggle
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(aiService.getApiKey());

  useEffect(() => {
    if (isOpen) {
      setApiKey(aiService.getApiKey());
    }
  }, [isOpen]);

  const handleSaveApiKey = () => {
    const cleanKey = apiKey.trim();
    aiService.setApiKey(cleanKey);
    setShowApiKeyInput(false);
    success('تم حفظ مفتاح الذكاء الاصطناعي بنجاح');

    if (frontImagePreview || backImagePreview) {
      processScan(frontImagePreview, backImagePreview, photoSide);
    }
  };

  const togglePhotoPosition = async (side: 'left' | 'right') => {
    setPhotoSide(side);
    if (!frontImagePreview) return;

    try {
      const region =
        side === 'left'
          ? DEFAULT_EGYPTIAN_ID_PHOTO_REGION_LEFT
          : DEFAULT_EGYPTIAN_ID_PHOTO_REGION_RIGHT;
      const avatar = await cropImageRegion(frontImagePreview, region);
      setCroppedAvatar(avatar);
      if (scanResult) {
        setScanResult((prev) => (prev ? { ...prev, idPhotoUrl: avatar } : null));
      }
    } catch {
      // ignore
    }
  };

  const handleFrontFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('يرجى اختيار ملف صورة صالح (JPG, PNG)');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawBase64 = reader.result as string;
        const optimized = await resizeImage(rawBase64, 1600, 1600);
        setFrontImagePreview(optimized);

        // Crop face from left by default
        let avatar: string | null = null;
        try {
          avatar = await cropImageRegion(optimized, DEFAULT_EGYPTIAN_ID_PHOTO_REGION_LEFT);
          setCroppedAvatar(avatar);
        } catch {
          setCroppedAvatar(null);
        }

        processScan(optimized, backImagePreview, 'left', avatar);
      };
      reader.readAsDataURL(file);
    } catch {
      toastError('حدث خطأ أثناء معالجة الصورة');
    }
  };

  const handleBackFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('يرجى اختيار ملف صورة صالح (JPG, PNG)');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawBase64 = reader.result as string;
        const optimized = await resizeImage(rawBase64, 1600, 1600);
        setBackImagePreview(optimized);

        // Re-scan with both front and back
        processScan(frontImagePreview, optimized, photoSide, croppedAvatar);
      };
      reader.readAsDataURL(file);
    } catch {
      toastError('حدث خطأ أثناء معالجة صورة ظهر البطاقة');
    }
  };

  const processScan = async (
    frontBase64: string | null,
    backBase64: string | null,
    side: 'left' | 'right' = photoSide,
    customAvatar?: string | null
  ) => {
    if (!frontBase64 && !backBase64) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      let avatar = customAvatar || croppedAvatar;
      if (!avatar && frontBase64) {
        try {
          const region =
            side === 'left'
              ? DEFAULT_EGYPTIAN_ID_PHOTO_REGION_LEFT
              : DEFAULT_EGYPTIAN_ID_PHOTO_REGION_RIGHT;
          avatar = await cropImageRegion(frontBase64, region);
          setCroppedAvatar(avatar);
        } catch {}
      }

      const result = await aiService.scanNationalId(
        frontBase64 || '',
        backBase64 || null,
        avatar || undefined
      );

      setScanResult(result);

      if (result.success && (result.nationalId || result.fullNameAr || result.qualification)) {
        success('تم استخراج وقراءة بيانات البطاقة والمؤهل بنجاح!');
      } else if (!result.success && result.message) {
        toastError(result.message);
      }
    } catch (err: any) {
      toastError(err.message || 'فشلت معالجة الصور');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (!scanResult) return;

    // Transliterate to clean English if not already present
    const transliterated = transliterateArabicNameToEnglish(scanResult.fullNameAr || '');
    const finalFirstEn = scanResult.firstNameEn || transliterated.firstNameEn;
    const finalLastEn = scanResult.lastNameEn || transliterated.lastNameEn;

    onApplyData({
      fullNameAr: scanResult.fullNameAr,
      firstName: scanResult.firstName,
      lastName: scanResult.lastName,
      firstNameEn: finalFirstEn,
      lastNameEn: finalLastEn,
      nationalId: scanResult.nationalId,
      dateOfBirth: scanResult.birthDate,
      gender: scanResult.gender,
      governorateAr: scanResult.governorateAr,
      address: scanResult.address,
      avatarData: croppedAvatar || undefined,
      qualification: scanResult.qualification,
      profession: scanResult.profession,
      maritalStatus: scanResult.maritalStatus,
      idExpiryDate: scanResult.idExpiryDate,
      idCardImage: frontImagePreview || scanResult.idCardImage,
      backCardImage: backImagePreview || scanResult.backCardImage,
    });

    success('تم تطبيق البيانات والمؤهل في استمارة الموظف بنجاح');
    onClose();
  };

  const resetAll = () => {
    setFrontImagePreview(null);
    setBackImagePreview(null);
    setCroppedAvatar(null);
    setScanResult(null);
    if (frontFileInputRef.current) frontFileInputRef.current.value = '';
    if (backFileInputRef.current) backFileInputRef.current.value = '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="قارئ مسوغات وبطاقة الرقم القومي (وجه وظهر البطاقة)"
      size="2xl"
    >
      <div className="space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200/50 dark:border-brand-900/30 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-pulse shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                القراءة الآلية للوجه الأمامي والخلفي (استخراج الاسم، الرقم، المؤهل الدراسي، والمهنة)
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                ارفع صورة وجه البطاقة للبيانات الأساسية، وصورة الظهر لاستخراج المؤهل الدراسي والحالة الاجتماعية
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>{aiService.hasApiKey() ? 'إعدادات المفتاح' : 'تفعيل الذكاء الاصطناعي'}</span>
          </Button>
        </div>

        {/* API Key Drawer */}
        {showApiKeyInput && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Key className="w-4 h-4 text-brand-500" />
                <span>مفتاح Google Gemini Vision API</span>
              </div>
              <button
                type="button"
                onClick={() => setShowApiKeyInput(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="الصق المفتاح هنا..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="text-xs font-mono"
              />
              <Button type="button" size="sm" onClick={handleSaveApiKey} className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4">
                حفظ وتفعيل
              </Button>
            </div>
          </div>
        )}

        {/* Hidden inputs for both front and back files */}
        <input
          ref={frontFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFrontFileSelect}
        />
        <input
          ref={backFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBackFileSelect}
        />

        {/* Main Interface: Left Column (Images: Front + Back), Right Column (Extracted Data) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Images Upload / Preview Section */}
          <div className="md:col-span-5 flex flex-col gap-3">
            {/* Front Card Box */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-brand-500" />
                  وجه البطاقة (الأمامي)
                </span>
                {frontImagePreview && (
                  <button
                    type="button"
                    onClick={() => frontFileInputRef.current?.click()}
                    className="text-[11px] text-brand-600 hover:underline font-semibold cursor-pointer"
                  >
                    تغيير الصورة
                  </button>
                )}
              </div>

              {!frontImagePreview ? (
                <div
                  onClick={() => frontFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-xl p-5 text-center cursor-pointer bg-white dark:bg-slate-800 transition-all group"
                >
                  <UploadCloud className="w-8 h-8 mx-auto mb-1.5 text-brand-600 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    اضغط لرفع وجه البطاقة
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    (الاسم، الرقم القومي، والصورة الشخصية)
                  </p>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 aspect-[1.58/1] flex items-center justify-center">
                  <img
                    src={frontImagePreview}
                    alt="Front ID"
                    className="w-full h-full object-contain"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                      <RefreshCw className="w-7 h-7 animate-spin text-brand-400" />
                      <span className="text-xs font-semibold">جاري القراءة الذكية...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Photo position switcher for front image */}
              {frontImagePreview && (
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">موضع الوجه:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => togglePhotoPosition('left')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        photoSide === 'left'
                          ? 'bg-brand-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      اليسار (الحديثة)
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePhotoPosition('right')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        photoSide === 'right'
                          ? 'bg-brand-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      اليمين (القديمة)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Back Card Box (for Qualification and Profession) */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-500" />
                  ظهر البطاقة (للمؤهل والمهنة)
                </span>
                {backImagePreview && (
                  <button
                    type="button"
                    onClick={() => backFileInputRef.current?.click()}
                    className="text-[11px] text-brand-600 hover:underline font-semibold cursor-pointer"
                  >
                    تغيير الصورة
                  </button>
                )}
              </div>

              {!backImagePreview ? (
                <div
                  onClick={() => backFileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 dark:border-emerald-800/60 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-white dark:bg-slate-800 transition-all group"
                >
                  <Plus className="w-6 h-6 mx-auto mb-1 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    اضغط هنا لرفع ظهر البطاقة
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    لاستخراج المؤهل الدراسي، جهة العمل، والحالة الاجتماعية
                  </p>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 aspect-[1.58/1] flex items-center justify-center">
                  <img
                    src={backImagePreview}
                    alt="Back ID"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBackImagePreview(null);
                      if (backFileInputRef.current) backFileInputRef.current.value = '';
                    }}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full p-1 cursor-pointer transition-colors"
                    title="حذف صورة الظهر"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetAll}
                className="flex-1 text-xs"
              >
                مسح من جديد
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => processScan(frontImagePreview, backImagePreview)}
                disabled={isScanning || (!frontImagePreview && !backImagePreview)}
                className="flex-1 text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                إعادة التحليل
              </Button>
            </div>
          </div>

          {/* Right Column: Extracted Data Fields */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  البيانات المستخرجة (وجه وظهر)
                </span>
              </div>
              {scanResult && (
                <Badge variant={scanResult.source === 'gemini' && scanResult.success ? 'brand' : 'default'} size="sm">
                  {scanResult.source === 'gemini' && scanResult.success ? '✨ قراءة ذكية (Gemini AI)' : 'خوارزمية الرقم القومي'}
                </Badge>
              )}
            </div>

            {/* Form Fields Card */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3 text-xs">
              {/* Name & Avatar Preview */}
              <div className="flex items-start gap-3">
                {croppedAvatar ? (
                  <div className="relative group shrink-0">
                    <img
                      src={croppedAvatar}
                      alt="Employee Crop"
                      className="w-14 h-16 rounded-lg object-cover border-2 border-brand-500 shadow-xs"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  </div>
                ) : (
                  <div className="w-14 h-16 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                      الاسم الكامل (كما في وجه البطاقة)
                    </label>
                    <input
                      type="text"
                      value={scanResult?.fullNameAr || ''}
                      placeholder="سيظهر الاسم هنا تلقائياً..."
                      onChange={(e) => {
                        const val = e.target.value;
                        const parts = val.trim().split(/\s+/);
                        const trans = transliterateArabicNameToEnglish(val);
                        setScanResult((prev) =>
                          prev
                            ? {
                                ...prev,
                                fullNameAr: val,
                                firstName: parts[0] || '',
                                lastName: parts.slice(1).join(' ') || '',
                                firstNameEn: trans.firstNameEn,
                                lastNameEn: trans.lastNameEn,
                              }
                            : null
                        );
                      }}
                      className="w-full font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {/* Automatic English Names Preview */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[9px] font-semibold text-brand-600 dark:text-brand-400 block mb-0.5">
                        الاسم الأول بالإنجليزي (تلقائي)
                      </span>
                      <input
                        type="text"
                        value={scanResult?.firstNameEn || ''}
                        placeholder="Khaled"
                        onChange={(e) => {
                          const val = e.target.value;
                          setScanResult((prev) => (prev ? { ...prev, firstNameEn: val } : null));
                        }}
                        className="w-full font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-[11px] focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold text-brand-600 dark:text-brand-400 block mb-0.5">
                        اسم العائلة بالإنجليزي (تلقائي)
                      </span>
                      <input
                        type="text"
                        value={scanResult?.lastNameEn || ''}
                        placeholder="Mosaad Hassan"
                        onChange={(e) => {
                          const val = e.target.value;
                          setScanResult((prev) => (prev ? { ...prev, lastNameEn: val } : null));
                        }}
                        className="w-full font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-[11px] focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 14-digit National ID & Live Validation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-slate-400">
                    الرقم القومي (14 رقم)
                  </label>
                  {scanResult?.nationalId && (
                    <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-bold">
                      {scanResult.nationalId.length} / 14 رقم
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={14}
                  value={scanResult?.nationalId || ''}
                  placeholder="30308181204698..."
                  onChange={(e) => {
                    const idVal = e.target.value;
                    const parsed = parseEgyptianNationalId(idVal);
                    setScanResult((prev) =>
                      prev
                        ? {
                            ...prev,
                            nationalId: idVal,
                            birthDate: parsed.isValid ? parsed.birthDate : prev.birthDate,
                            age: parsed.isValid ? parsed.age : prev.age,
                            gender: parsed.isValid ? parsed.gender : prev.gender,
                            genderAr: parsed.isValid ? parsed.genderAr : prev.genderAr,
                            governorateAr: parsed.isValid
                              ? parsed.governorateAr
                              : prev.governorateAr,
                          }
                        : null
                    );
                  }}
                  className="w-full font-mono font-bold tracking-wider text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Qualification (من ظهر البطاقة) Highlight Box */}
              <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    المؤهل الدراسي (المكتوب بظهر البطاقة):
                  </span>
                  {scanResult?.qualification && (
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                      تم الاستخراج ✓
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={scanResult?.qualification || ''}
                  placeholder={backImagePreview ? 'جاري القراءة...' : 'ارفع ظهر البطاقة للاستخراج التلقائي للمؤهل'}
                  onChange={(e) => {
                    const q = e.target.value;
                    setScanResult((prev) => (prev ? { ...prev, qualification: q } : null));
                  }}
                  className="w-full font-bold text-emerald-950 dark:text-emerald-100 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/60 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Profession & Marital Status & Expiry */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    المهنة / جهة العمل بالظهر
                  </span>
                  <input
                    type="text"
                    value={scanResult?.profession || ''}
                    placeholder="طالب / مهندس / سائق..."
                    onChange={(e) => {
                      const p = e.target.value;
                      setScanResult((prev) => (prev ? { ...prev, profession: p } : null));
                    }}
                    className="w-full font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-0 p-0 text-xs focus:ring-0"
                  />
                </div>

                <div className="p-2 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-slate-400" />
                    الحالة الاجتماعية بالظهر
                  </span>
                  <input
                    type="text"
                    value={scanResult?.maritalStatus || ''}
                    placeholder="أعزب / متزوج..."
                    onChange={(e) => {
                      const m = e.target.value;
                      setScanResult((prev) => (prev ? { ...prev, maritalStatus: m } : null));
                    }}
                    className="w-full font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-0 p-0 text-xs focus:ring-0"
                  />
                </div>

                <div className="p-2 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ الميلاد والسن</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {scanResult?.birthDate || '---'}
                    {scanResult?.age !== undefined ? ` (${scanResult.age} سنة)` : ''}
                  </span>
                </div>

                <div className="p-2 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block mb-0.5">المحافظة والنوع</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {scanResult?.governorateAr || '---'} • {scanResult?.gender === 'female' ? 'أنثى' : 'ذكر'}
                  </span>
                </div>
              </div>

              {scanResult?.address && (
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">العنوان بالبطاقة</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {scanResult.address}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                إلغاء
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={!scanResult?.nationalId && !scanResult?.fullNameAr && !scanResult?.qualification}
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تطبيق كافة البيانات والمؤهل في النموذج</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
