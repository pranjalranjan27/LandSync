import type { LanguageCode, LanguageInfo, TranslationSchema } from './types';
import { en } from './en';
import { hi } from './hi';
import { mr } from './mr';
import { ta } from './ta';
import { te } from './te';
import { bn } from './bn';

export * from './types';
export { LanguageProvider, useLanguage, useTranslation } from './LanguageContext';

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' }
];

export const translations: Record<LanguageCode, TranslationSchema> = {
  en,
  hi,
  mr,
  ta,
  te,
  bn
};

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function getTranslation(lang: LanguageCode): TranslationSchema {
  return translations[lang] || translations.en;
}
