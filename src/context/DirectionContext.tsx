import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n';

export type LanguageCode = 'en' | 'ar' | 'zh-CN';
export type TextDirection = 'ltr' | 'rtl';

interface DirectionContextType {
  language: LanguageCode;
  direction: TextDirection;
  isRtl: boolean;
  changeLanguage: (lang: LanguageCode) => void;
}

const DirectionContext = createContext<DirectionContextType | undefined>(undefined);

export const DirectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<LanguageCode>(() => {
    return (localStorage.getItem('i18nextLng') as LanguageCode) || 'en';
  });

  const direction: TextDirection = language === 'ar' ? 'rtl' : 'ltr';
  const isRtl = direction === 'rtl';

  useEffect(() => {
    setAppLanguage(language);
  }, [language]);

  const changeLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    setAppLanguage(lang);
  };

  return (
    <DirectionContext.Provider
      value={{
        language,
        direction,
        isRtl,
        changeLanguage,
      }}
    >
      {children}
    </DirectionContext.Provider>
  );
};

export const useDirection = () => {
  const context = useContext(DirectionContext);
  if (!context) {
    throw new Error('useDirection must be used within a DirectionProvider');
  }
  return context;
};
