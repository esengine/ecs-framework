/**
 * Build Settings Window.
 * 构建设置窗口。
 *
 * A modal window that displays the build settings panel.
 * 显示构建设置面板的模态窗口。
 */

import { X } from 'lucide-react';
import type { BuildService, SceneManagerService, ProjectService } from '@esengine/editor-core';
import { BuildSettingsPanel } from './BuildSettingsPanel';
import { useLocale } from '../hooks/useLocale';
import '../styles/BuildSettingsWindow.css';

interface BuildSettingsWindowProps {
    projectPath?: string;
    buildService?: BuildService;
    sceneManager?: SceneManagerService;
    projectService?: ProjectService;
    /** Available scenes in the project | 项目中可用的场景列表 */
    availableScenes?: string[];
    onClose: () => void;
}

export function BuildSettingsWindow({
    projectPath,
    buildService,
    sceneManager,
    projectService,
    availableScenes,
    onClose
}: BuildSettingsWindowProps) {
    const { t } = useLocale();

    return (
        <div className="build-settings-window-overlay">
            <div className="build-settings-window">
                <div className="build-settings-window-header">
                    <h2>{t('build.settingsTitle')}</h2>
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
                        buildService={buildService}
                        sceneManager={sceneManager}
                        projectService={projectService}
                        availableScenes={availableScenes}
                        onClose={onClose}
                    />
                </div>
            </div>
        </div>
    );
}

export default BuildSettingsWindow;
