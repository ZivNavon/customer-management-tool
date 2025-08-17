'use client';

import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    
    // Update document direction
    document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    // Set initial direction
    document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {i18n.language === 'en' ? t('language.he') : t('language.en')}
    </button>
  );
}
