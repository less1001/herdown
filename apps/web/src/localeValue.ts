import type { Language } from './i18n';

export const localeValue = (language: Language, values: Record<Language, string>): string => values[language];
