import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getCachedAutoTranslation,
  hasVietnameseChars,
  queueAutoTranslation,
  subscribeAutoTranslations,
} from './autoTranslate';
import { translateViToEn, type AppLanguage } from './translations';

const LANGUAGE_KEY = 'smarttravel.language';

interface I18nValue {
  lang: AppLanguage;
  setLang: (next: AppLanguage) => void;
  toggleLang: () => void;
  /** Dịch chuỗi Tiếng Việt sang ngôn ngữ hiện tại */
  t: (viText: string) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: 'vi',
  setLang: () => undefined,
  toggleLang: () => undefined,
  t: (text) => text,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>('vi');
  const [autoVersion, setAutoVersion] = useState(0);

  useEffect(() => {
    SecureStore.getItemAsync(LANGUAGE_KEY)
      .then((saved) => {
        if (saved === 'en' || saved === 'vi') setLangState(saved);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (lang !== 'en') return;
    return subscribeAutoTranslations(() => setAutoVersion((v) => v + 1));
  }, [lang]);

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
    SecureStore.setItemAsync(LANGUAGE_KEY, next).catch(() => undefined);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((current) => {
      const next: AppLanguage = current === 'vi' ? 'en' : 'vi';
      SecureStore.setItemAsync(LANGUAGE_KEY, next).catch(() => undefined);
      return next;
    });
  }, []);

  const t = useCallback(
    (viText: string) => {
      void autoVersion;
      if (lang !== 'en') return viText;
      const staticHit = translateViToEn(viText);
      if (staticHit !== viText) return staticHit;
      const key = viText.replace(/\s+/g, ' ').trim();
      if (!hasVietnameseChars(key)) return viText;
      const cached = getCachedAutoTranslation(key);
      if (cached !== undefined) return cached;
      queueAutoTranslation(key);
      return viText;
    },
    [lang, autoVersion],
  );

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
