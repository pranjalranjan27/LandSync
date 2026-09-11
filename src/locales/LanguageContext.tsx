import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { LanguageCode, LanguageInfo, TranslationSchema } from './types';
import { LANGUAGES, translations, DEFAULT_LANGUAGE } from './index';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string, fallback?: string) => string;
  translations: TranslationSchema;
  activeLanguage: LanguageInfo;
  languages: LanguageInfo[];
}

const STORAGE_KEY = 'landsync_lang';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && ['en', 'hi', 'mr', 'ta', 'te', 'bn'].includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore localStorage errors
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // Ignore
    }
  }, [language]);

  const activeTranslations = useMemo(() => {
    return translations[language] || translations.en;
  }, [language]);

  const activeLanguage = useMemo(() => {
    return LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  }, [language]);

  /**
   * Helper function to safely traverse nested translation objects by dot-path
   * e.g. t('auth.loginButton') -> returns string
   */
  const t = (path: string, fallback?: string): string => {
    const parts = path.split('.');
    let current: any = activeTranslations;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to english if not found
        let enFallback: any = translations.en;
        for (const p of parts) {
          if (enFallback && typeof enFallback === 'object' && p in enFallback) {
            enFallback = enFallback[p];
          } else {
            enFallback = undefined;
            break;
          }
        }
        return typeof enFallback === 'string' ? enFallback : (fallback || path);
      }
    }
    return typeof current === 'string' ? current : (fallback || path);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      translations: activeTranslations,
      activeLanguage,
      languages: LANGUAGES
    }),
    [language, activeTranslations, activeLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  const context = useLanguage();
  return {
    t: context.t,
    language: context.language,
    setLanguage: context.setLanguage,
    tSchema: context.translations,
    activeLanguage: context.activeLanguage,
    languages: context.languages
  };
}
