import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';
import zhCN from './locales/zh-CN.json';

const savedLanguage = localStorage.getItem('i18nextLng') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      'zh-CN': { translation: zhCN },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export function setAppLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem('i18nextLng', lang);

  const html = document.documentElement;
  html.setAttribute('lang', lang);

  if (lang === 'ar') {
    html.setAttribute('dir', 'rtl');
  } else {
    html.setAttribute('dir', 'ltr');
  }
}

// Initial synchronization on module load
const initialLang = i18n.language || savedLanguage;
setAppLanguage(initialLang);

export default i18n;
