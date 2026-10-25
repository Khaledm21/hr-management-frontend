import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  KeyRound,
  ShieldCheck,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Mail,
  Calendar,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
  Sparkles,
  Check,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useToast } from '../../components/ui/Toast';

// Helper to construct male/female customized DiceBear SVG avatars
const getAvatarUrl = (nameStr: string, g: 'male' | 'female', seedSuffix = 0) => {
  const cleanSeed = (nameStr.trim() || (g === 'female' ? 'sarah' : 'ahmed')).replace(/\s+/g, '-');
  const fullSeed = `${g}-${cleanSeed}${seedSuffix > 0 ? `-${seedSuffix}` : ''}`;
  if (g === 'female') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullSeed)}&facialHairProbability=0&top=longButNotTooLong,straight01,straight02,curly,curvy,bob`;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullSeed)}&top=shortFlat,shortRound,shortWaved,sides,theCaesar,theCaesarAndSidePart`;
};

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, updateCurrentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'account'>('info');

  // Personal Info Form State
  const initialGender: 'male' | 'female' =
    user?.gender ? user.gender : user?.avatar?.includes('female') ? 'female' : 'male';
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState<'male' | 'female'>(initialGender);
  const [avatarSeed, setAvatarSeed] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || getAvatarUrl(user?.name || '', initialGender));
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync state whenever modal is opened or user changes
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      const userGender: 'male' | 'female' =
        user.gender ? user.gender : user.avatar?.includes('female') ? 'female' : 'male';
      setGender(userGender);
      setAvatarUrl(user.avatar || getAvatarUrl(user.name || '', userGender));
    }
  }, [isOpen, user]);

  const isCustomPhoto = Boolean(avatarUrl && !avatarUrl.includes('dicebear.com'));

  // Security / Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // When switching gender in profile
  const handleGenderChange = (newGender: 'male' | 'female') => {
    setGender(newGender);
    if (!isCustomPhoto) {
      const newUrl = getAvatarUrl(name, newGender, avatarSeed);
      setAvatarUrl(newUrl);
    }
  };

  // When clicking randomize avatar
  const handleRandomizeAvatar = () => {
    const nextSeed = avatarSeed + 1;
    setAvatarSeed(nextSeed);
    setAvatarUrl(getAvatarUrl(name, gender, nextSeed));
  };

  // Revert back to default generated avatar
  const handleResetToDefaultAvatar = () => {
    const defaultUrl = getAvatarUrl(name, gender, avatarSeed);
    setAvatarUrl(defaultUrl);
    success(t('profile.avatarRestored', 'تم استعادة الرمز الافتراضي بنجاح.'), t('common.success', 'نجاح'));
  };

  // File upload with Canvas compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError(t('profile.invalidImageType', 'يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)'), 'Error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.88);
            setAvatarUrl(compressed);
            success(
              t('profile.photoReady', 'تم اختيار وتجهيز صورتك بنجاح! اضغط على "حفظ البيانات الشخصية" لحفظها.'),
              t('common.success', 'تم التحميل')
            );
          }
        } catch (err) {
          console.error('Failed to process image:', err);
          toastError(t('profile.imageProcessError', 'حدث خطأ أثناء معالجة الصورة'), 'Error');
        }
      };
      img.onerror = () => {
        toastError(t('profile.imageLoadError', 'تعذر قراءة ملف الصورة'), 'Error');
      };
    };
    reader.readAsDataURL(file);

    // Reset input value to allow selecting same file again if desired
    e.target.value = '';
  };

  // Save profile (Name, Avatar, Gender)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toastError(t('common.required', 'الاسم مطلوب'), 'Error');
      return;
    }

    setIsSavingProfile(true);
    try {
      await authService.updateProfile(user.id, {
        name: name.trim(),
        avatar: avatarUrl,
        gender,
      });

      updateCurrentUser({
        name: name.trim(),
        avatar: avatarUrl,
        gender,
      });

      success(t('profile.profileSaved', 'تم حفظ الصورة والبيانات الشخصية بنجاح.'), t('common.success', 'نجاح'));
    } catch (err: any) {
      toastError(err?.message || 'Failed to update profile', 'Error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toastError(t('profile.currentPasswordRequired', 'يرجى إدخال كلمة المرور الحالية'), 'Error');
      return;
    }
    if (newPassword.length < 6) {
      toastError(t('profile.passwordHint', 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف'), 'Error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError(t('profile.passwordMismatch', 'كلمتا المرور غير متطابقتين'), 'Error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      success(t('profile.passwordChanged', 'تم تغيير كلمة المرور بنجاح.'), t('common.success', 'نجاح'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toastError(err?.message || 'Failed to change password', 'Error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={t('profile.myProfile', 'الملف الشخصي وإعدادات الحساب')}
      description={`${user?.name} (${user?.email})`}
    >
      <div className="space-y-5">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1E293B] pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B]/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t('profile.personalInfo', 'البيانات الشخصية والصورة')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B]/60'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{t('profile.security', 'الأمان وكلمة المرور')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'account'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B]/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('profile.accountDetails', 'بيانات الحساب')}</span>
          </button>
        </div>

        {/* Tab 1: Personal Info & Avatar */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Avatar & Photo Upload Box */}
            <div className="p-4 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-[#F8FAFC] text-sm">
                    {t('profile.avatar', 'الصورة الشخصية')}
                  </span>
                  {isCustomPhoto ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      <Check className="w-3 h-3 text-emerald-600" />
                      صورة شخصية مرفوعة
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      رمز تلقائي
                    </span>
                  )}
                </div>

                {!isCustomPhoto && (
                  <button
                    type="button"
                    onClick={handleRandomizeAvatar}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                    title="تغيير شكل الرمز الكرتوني"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('profile.changeAvatar', 'تغيير الشكل')}</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Photo Preview with Camera trigger */}
                <div className="relative group shrink-0">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl border-2 border-brand-500 bg-white dark:bg-[#151D2E] shadow-md overflow-hidden relative cursor-pointer ring-4 ring-brand-500/10 transition-transform group-hover:scale-105"
                    title="انقر لرفع صورة شخصية من جهازك"
                  >
                    <img
                      src={avatarUrl}
                      alt={name || 'Current avatar'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium backdrop-blur-[1px]">
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span>تغيير</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -left-1 rtl:-left-auto rtl:-right-1 p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg border-2 border-white dark:border-[#151D2E] transition-colors cursor-pointer"
                    title="رفع صورة من الجهاز"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                {/* Actions and Gender Options */}
                <div className="flex-1 w-full space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 bg-white dark:bg-[#151D2E] text-slate-800 dark:text-[#F8FAFC] border-slate-200 dark:border-[#1E293B] font-semibold shadow-2xs hover:bg-slate-50 dark:hover:bg-[#1E293B]/70"
                    >
                      <Upload className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>{t('profile.uploadPhoto', 'رفع صورة شخصية من جهازك')}</span>
                    </Button>

                    {isCustomPhoto && (
                      <button
                        type="button"
                        onClick={handleResetToDefaultAvatar}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 font-medium transition-colors cursor-pointer"
                        title="إلغاء الصورة واستعادة الرمز الافتراضي"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('profile.restoreDefaultAvatar', 'استعادة الرمز الافتراضي')}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t(
                      'profile.photoHelp',
                      'يمكنك اختيار صورة من جهازك بصيغة JPG أو PNG أو WebP. يتم ضبط دقتها وتنسيقها فوراً لتظهر في شريط التنقل والملف الشخصي.'
                    )}
                  </p>

                  {/* Male / Female Segmented Choice */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleGenderChange('male')}
                      className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        gender === 'male'
                          ? 'border-blue-500 bg-blue-50/80 text-blue-700 ring-2 ring-blue-500/20 shadow-xs dark:bg-blue-950/40 dark:text-blue-300'
                          : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]/70'
                      }`}
                    >
                      <span className="text-base">👨</span>
                      <div className="text-right rtl:text-right ltr:text-left">
                        <span className="block leading-tight">{t('profile.genderMale', 'ذكر')}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenderChange('female')}
                      className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        gender === 'female'
                          ? 'border-rose-500 bg-rose-50/80 text-rose-700 ring-2 ring-rose-500/20 shadow-xs dark:bg-rose-950/40 dark:text-rose-300'
                          : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B]/70'
                      }`}
                    >
                      <span className="text-base">👩</span>
                      <div className="text-right rtl:text-right ltr:text-left">
                        <span className="block leading-tight">{t('profile.genderFemale', 'أنثى')}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Input
              label={t('profile.fullName', 'الاسم الكامل')}
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full Name"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('profile.customAvatarUrl', 'أو رابط صورة خارجي (اختياري)')}
              </label>
              <input
                type="url"
                value={avatarUrl.startsWith('data:image') ? '' : avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder={avatarUrl.startsWith('data:image') ? 'تم تحميل صورة مخصصة من جهازك' : 'https://example.com/photo.jpg'}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] p-2.5 text-slate-800 dark:text-[#F8FAFC] bg-white dark:bg-[#0B0F19] focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono shadow-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                {t('common.close', 'إغلاق')}
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSavingProfile}>
                {t('profile.saveProfile', 'حفظ البيانات الشخصية')}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Change Password */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">{t('profile.updatePasswordNotice', 'إشعار أمان كلمة المرور')}</span>
                <span className="text-[11px] text-amber-700/90 dark:text-amber-400">
                  {t('profile.passwordHint', 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف لضمان حماية الحساب.')}
                </span>
              </div>
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('profile.currentPassword', 'كلمة المرور الحالية')} *
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] p-2.5 pr-9 rtl:pr-2.5 rtl:pl-9 text-slate-800 dark:text-[#F8FAFC] bg-white dark:bg-[#0B0F19] focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-2.5 rtl:pr-0 rtl:pl-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('profile.newPassword', 'كلمة المرور الجديدة')} *
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] p-2.5 pr-9 rtl:pr-2.5 rtl:pl-9 text-slate-800 dark:text-[#F8FAFC] bg-white dark:bg-[#0B0F19] focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-2.5 rtl:pr-0 rtl:pl-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('profile.confirmNewPassword', 'تأكيد كلمة المرور الجديدة')} *
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full text-xs rounded-lg border p-2.5 pr-9 rtl:pr-2.5 rtl:pl-9 text-slate-800 dark:text-[#F8FAFC] bg-white dark:bg-[#0B0F19] focus:outline-none focus:ring-1 shadow-xs ${
                    confirmPassword && !passwordsMatch
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-300 dark:border-[#1E293B] focus:ring-brand-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 pr-2.5 rtl:pr-0 rtl:pl-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword && !passwordsMatch && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{t('profile.passwordMismatch', 'كلمتا المرور غير متطابقتين')}</span>
                </p>
              )}
              {passwordsMatch && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('profile.passwordsMatch', 'كلمتا المرور متطابقتان')}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                {t('common.close', 'إغلاق')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isChangingPassword}
                disabled={!passwordsMatch || newPassword.length < 6}
              >
                {t('profile.changePassword', 'تحديث كلمة المرور')}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Account Details (Read-only) */}
        {activeTab === 'account' && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-xl space-y-1">
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">{t('profile.corporateEmail', 'البريد الإلكتروني للعمل')}</span>
                <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] font-mono text-xs block truncate">
                  {user?.email}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-xl space-y-1">
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">{t('profile.role', 'الدور الوظيفي والصلاحيات')}</span>
                <Badge variant={user?.role === 'admin' ? 'danger' : 'info'}>
                  {user ? (
                    user.role === 'admin' ? t('users.roleAdmin') :
                    user.role === 'hr_manager' ? t('users.roleHrManager') :
                    user.role === 'hr_staff' ? t('users.roleHrStaff') :
                    user.role === 'dept_manager' ? t('users.roleDeptManager') :
                    user.role
                  ) : ''}
                </Badge>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-xl space-y-1">
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">{t('profile.department', 'الإدارة / القسم')}</span>
                <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block">
                  {user?.department || 'Human Resources'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-xl space-y-1">
                <span className="text-slate-400 dark:text-slate-500 text-[11px] block">{t('profile.status', 'حالة الحساب')}</span>
                <Badge variant="success">{t('users.statusActive', 'Active')}</Badge>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-xl flex items-center justify-between text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{t('profile.lastLogin', 'آخر تسجيل دخول')}:</span>
              </div>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : t('profile.justNow', 'الآن')}
              </span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                {t('common.close', 'إغلاق')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
export default UserProfileModal;
