/**
 * Build Settings Window.
 * 构建设置窗口。
 *
 * A modal window that displays the build settings panel.
 * 显示构建设置面板的模态窗口。
 */

import { X } from 'lucide-react';
import type { BuildService, SceneManagerService } from '@esengine/editor-core';
import { BuildSettingsPanel } from './BuildSettingsPanel';
import '../styles/BuildSettingsWindow.css';

interface BuildSettingsWindowProps {
    projectPath?: string;
    locale?: string;
    buildService?: BuildService;
    sceneManager?: SceneManagerService;
    onClose: () => void;
}

export function BuildSettingsWindow({
    projectPath,
    locale = 'en',
    buildService,
    sceneManager,
    onClose
}: BuildSettingsWindowProps) {
    const t = locale === 'zh' ? {
        title: '构建设置'
    } : {
        title: 'Build Settings'
    };

    return (
        <div className="build-settings-window-overlay">
            <div className="build-settings-window">
                <div className="build-settings-window-header">
                    <h2>{t.title}</h2>
                    <button
                        className="build-settings-window-close"
                        onClick={onClose}
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="build-settings-window-content">
                    <BuildSettingsPanel
                        projectPath={projectPath}
                        locale={locale}
                        buildService={buildService}
                        sceneManager={sceneManager}
                        onClose={onClose}
                    />
                </div>
            </div>
        </div>
    );
}

export default BuildSettingsWindow;
