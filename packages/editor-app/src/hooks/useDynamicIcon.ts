import { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

type LucideIconName = keyof typeof LucideIcons;

export function useDynamicIcon(iconName?: string, fallback?: React.ComponentType) {
    return useMemo(() => {
        if (!iconName) {
            return fallback || LucideIcons.Package;
        }

        const IconComponent = (LucideIcons as any)[iconName];
        return IconComponent || fallback || LucideIcons.Package;
    }, [iconName, fallback]);
}
