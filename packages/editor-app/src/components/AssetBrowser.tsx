/**
 * Asset Browser - 资产浏览器
 * 包装 ContentBrowser 组件，保持向后兼容
 */

import { ContentBrowser } from './ContentBrowser';

interface AssetBrowserProps {
    projectPath: string | null;
    locale: string;
    onOpenScene?: (scenePath: string) => void;
}

export function AssetBrowser({ projectPath, locale, onOpenScene }: AssetBrowserProps) {
    return (
        <ContentBrowser
            projectPath={projectPath}
            locale={locale}
            onOpenScene={onOpenScene}
        />
    );
}
