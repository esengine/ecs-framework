import React from 'react';
import * as LucideIcons from 'lucide-react';

interface NodeIconProps {
    iconName?: string;
    size?: number;
    color?: string;
}

/**
 * 节点图标组件
 *
 * 根据图标名称渲染对应的 Lucide 图标
 */
export const NodeIcon: React.FC<NodeIconProps> = ({ iconName, size = 16, color }) => {
    if (!iconName) {
        return null;
    }

    const IconComponent = (LucideIcons as any)[iconName];

    if (!IconComponent) {
        return <span>{iconName}</span>;
    }

    return <IconComponent size={size} color={color} />;
};
