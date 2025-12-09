import { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

type LucideIconComponent = React.ComponentType<LucideIcons.LucideProps>;

/**
 * 动态获取 Lucide 图标组件
 * Dynamically get Lucide icon component by name
 *
 * @param iconName - 图标名称（如 'Package', 'Settings'）
 * @param fallback - 找不到时的回退组件
 * @returns Lucide 图标组件
 */
export function useDynamicIcon(iconName?: string, fallback?: LucideIconComponent): LucideIconComponent {
    return useMemo(() => {
        if (!iconName) {
            return fallback || LucideIcons.Package;
        }

        // 类型安全的图标查找
        // Type-safe icon lookup
        const icons = LucideIcons as Record<string, LucideIconComponent | undefined>;
        const IconComponent = icons[iconName];
        return IconComponent || fallback || LucideIcons.Package;
    }, [iconName, fallback]);
}
