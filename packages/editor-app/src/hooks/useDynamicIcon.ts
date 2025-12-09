import { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * 动态获取 Lucide 图标组件
 * Dynamically get Lucide icon component by name
 *
 * @param iconName - 图标名称（如 'Package', 'Settings'）
 * @param fallback - 找不到时的回退组件
 * @returns Lucide 图标组件
 */
export function useDynamicIcon(iconName?: string, fallback?: React.ComponentType) {
    return useMemo(() => {
        if (!iconName) {
            return fallback || LucideIcons.Package;
        }

        // 动态图标查找需要使用 any，因为 lucide-react 的类型定义不支持动态索引
        // Dynamic icon lookup requires any, as lucide-react types don't support dynamic indexing
        const IconComponent = (LucideIcons as any)[iconName];
        return IconComponent || fallback || LucideIcons.Package;
    }, [iconName, fallback]);
}
