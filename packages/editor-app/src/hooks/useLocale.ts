import { useState, useEffect, useCallback, useMemo } from 'react';
import { Core } from '@esengine/ecs-framework';
import { LocaleService, type Locale } from '@esengine/editor-core';

export function useLocale() {
    const localeService = useMemo(() => Core.services.resolve(LocaleService), []);
    const [locale, setLocale] = useState<Locale>(() => localeService.getCurrentLocale());

    useEffect(() => {
        const unsubscribe = localeService.onChange((newLocale) => {
            setLocale(newLocale);
        });

        return unsubscribe;
    }, [localeService]);

    const t = useCallback((key: string, fallback?: string) => {
        return localeService.t(key, fallback);
    }, [localeService]);

    const changeLocale = useCallback((newLocale: Locale) => {
        localeService.setLocale(newLocale);
    }, [localeService]);

    return {
        locale,
        t,
        changeLocale
    };
}
