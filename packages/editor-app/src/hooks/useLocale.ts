import { useState, useEffect } from 'react';
import { Core } from '@esengine/ecs-framework';
import { LocaleService, type Locale } from '@esengine/editor-core';

export function useLocale() {
  const localeService = Core.services.resolve(LocaleService);
  const [locale, setLocale] = useState<Locale>(localeService.getCurrentLocale());

  useEffect(() => {
    const unsubscribe = localeService.onChange((newLocale) => {
      setLocale(newLocale);
    });

    return unsubscribe;
  }, [localeService]);

  const t = (key: string, fallback?: string) => {
    return localeService.t(key, fallback);
  };

  const changeLocale = (newLocale: Locale) => {
    localeService.setLocale(newLocale);
  };

  return {
    locale,
    t,
    changeLocale
  };
}
