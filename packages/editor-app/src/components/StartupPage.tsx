import { useState, useEffect, useRef } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { Globe, ChevronDown, Download, X, Loader2, Trash2, CheckCircle, AlertCircle, Terminal } from 'lucide-react';
import { checkForUpdatesOnStartup, installUpdate, type UpdateCheckResult } from '../utils/updater';
import { StartupLogo } from './StartupLogo';
import { TauriAPI, type EnvironmentCheckResult } from '../api/tauri';
import { useLocale, type Locale } from '../hooks/useLocale';
import '../styles/StartupPage.css';

interface StartupPageProps {
  onOpenProject: () => void;
  onCreateProject: () => void;
  onOpenRecentProject?: (projectPath: string) => void;
  onRemoveRecentProject?: (projectPath: string) => void;
  onDeleteProject?: (projectPath: string) => Promise<void>;
  onLocaleChange?: (locale: Locale) => void;
  recentProjects?: string[];
}

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
];

export function StartupPage({ onOpenProject, onCreateProject, onOpenRecentProject, onRemoveRecentProject, onDeleteProject, onLocaleChange, recentProjects = [] }: StartupPageProps) {
    const { t, locale } = useLocale();
    const [showLogo, setShowLogo] = useState(true);
    const [hoveredProject, setHoveredProject] = useState<string | null>(null);
    const [appVersion, setAppVersion] = useState<string>('');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: string } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
    const [showUpdateBanner, setShowUpdateBanner] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [envCheck, setEnvCheck] = useState<EnvironmentCheckResult | null>(null);
    const [showEnvStatus, setShowEnvStatus] = useState(false);
    const [showEsbuildInstall, setShowEsbuildInstall] = useState(false);
    const [isInstallingEsbuild, setIsInstallingEsbuild] = useState(false);
    const [installProgress, setInstallProgress] = useState('');
    const [installError, setInstallError] = useState('');
    const langMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
                setShowLangMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        getVersion().then(setAppVersion).catch(() => setAppVersion('1.0.0'));
    }, []);

    // 启动时检查更新
    useEffect(() => {
        checkForUpdatesOnStartup().then((result) => {
            if (result.available) {
                setUpdateInfo(result);
                setShowUpdateBanner(true);
            }
        });
    }, []);

    // 启动时检测开发环境
    useEffect(() => {
        TauriAPI.checkEnvironment().then((result) => {
            setEnvCheck(result);
            // 如果环境就绪，在控制台显示信息
            if (result.ready) {
                console.log('[Environment] Ready ✓');
                console.log(`[Environment] esbuild: ${result.esbuild.version} (${result.esbuild.source})`);
            } else {
                // esbuild 未安装，显示安装对话框
                console.warn('[Environment] Not ready:', result.esbuild.error);
                setShowEsbuildInstall(true);
            }
        }).catch((error) => {
            console.error('[Environment] Check failed:', error);
        });
    }, []);

    // 监听 esbuild 安装进度事件
    useEffect(() => {
        let unlisten: UnlistenFn | undefined;

        const setupListeners = async () => {
            // 监听安装进度
            unlisten = await listen<string>('esbuild-install:progress', (event) => {
                setInstallProgress(event.payload);
            });

            // 监听安装成功
            const unlistenSuccess = await listen('esbuild-install:success', async () => {
                // 重新检测环境
                const result = await TauriAPI.checkEnvironment();
                setEnvCheck(result);
                if (result.ready) {
                    setShowEsbuildInstall(false);
                    setIsInstallingEsbuild(false);
                    setInstallProgress('');
                    setInstallError('');
                }
            });

            // 监听安装错误
            const unlistenError = await listen<string>('esbuild-install:error', (event) => {
                setInstallError(event.payload);
                setIsInstallingEsbuild(false);
            });

            return () => {
                unlisten?.();
                unlistenSuccess();
                unlistenError();
            };
        };

        setupListeners();

        return () => {
            unlisten?.();
        };
    }, []);

    // 处理 esbuild 安装
    const handleInstallEsbuild = async () => {
        setIsInstallingEsbuild(true);
        setInstallProgress(t('startup.installingEsbuild'));
        setInstallError('');

        try {
            await TauriAPI.installEsbuild();
            // 成功会通过事件处理
        } catch (error) {
            console.error('[Environment] Failed to install esbuild:', error);
            setInstallError(String(error));
            setIsInstallingEsbuild(false);
        }
    };

    const handleInstallUpdate = async () => {
        setIsInstalling(true);
        const success = await installUpdate();
        if (!success) {
            setIsInstalling(false);
        }
        // 如果成功，应用会重启，不需要处理
    };

    const versionText = `${t('startup.version')} ${appVersion}`;

    const handleLogoComplete = () => {
        setShowLogo(false);
    };

    return (
        <div className="startup-page">
            {showLogo && <StartupLogo onAnimationComplete={handleLogoComplete} />}
            <div className="startup-header">
                <h1 className="startup-title">{t('startup.title')}</h1>
                <p className="startup-subtitle">{t('startup.subtitle')}</p>
            </div>

            <div className="startup-content">
                <div className="startup-actions">
                    <button className="startup-action-btn primary" onClick={onOpenProject}>
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" strokeWidth="2"/>
                        </svg>
                        <span>{t('startup.openProject')}</span>
                    </button>

                    <button className="startup-action-btn" onClick={onCreateProject}>
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 5V19M5 12H19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{t('startup.createProject')}</span>
                    </button>
                </div>

                <div className="startup-recent">
                    <h2 className="recent-title">{t('startup.recentProjects')}</h2>
                    {recentProjects.length === 0 ? (
                        <p className="recent-empty">{t('startup.noRecentProjects')}</p>
                    ) : (
                        <ul className="recent-list">
                            {recentProjects.map((project, index) => (
                                <li
                                    key={index}
                                    className={`recent-item ${hoveredProject === project ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHoveredProject(project)}
                                    onMouseLeave={() => setHoveredProject(null)}
                                    onClick={() => onOpenRecentProject?.(project)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setContextMenu({ x: e.clientX, y: e.clientY, project });
                                    }}
                                    style={{ cursor: onOpenRecentProject ? 'pointer' : 'default' }}
                                >
                                    <svg className="recent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" strokeWidth="2"/>
                                    </svg>
                                    <div className="recent-info">
                                        <div className="recent-name">{project.split(/[\\/]/).pop()}</div>
                                        <div className="recent-path">{project}</div>
                                    </div>
                                    {onRemoveRecentProject && (
                                        <button
                                            className="recent-remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveRecentProject(project);
                                            }}
                                            title={t('startup.removeFromList')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* 更新提示条 */}
            {showUpdateBanner && updateInfo?.available && (
                <div className="startup-update-banner">
                    <div className="update-banner-content">
                        <Download size={16} />
                        <span className="update-banner-text">
                            {t('startup.updateAvailable')}: v{updateInfo.version}
                        </span>
                        <button
                            className="update-banner-btn primary"
                            onClick={handleInstallUpdate}
                            disabled={isInstalling}
                        >
                            {isInstalling ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    {t('startup.installing')}
                                </>
                            ) : (
                                t('startup.updateNow')
                            )}
                        </button>
                        <button
                            className="update-banner-close"
                            onClick={() => setShowUpdateBanner(false)}
                            disabled={isInstalling}
                            title={t('startup.later')}
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            <div className="startup-footer">
                <span className="startup-version">{versionText}</span>

                {/* 环境状态指示器 | Environment Status Indicator */}
                {envCheck && (
                    <div
                        className={`startup-env-status ${envCheck.ready ? 'ready' : 'warning'}`}
                        onClick={() => setShowEnvStatus(!showEnvStatus)}
                        title={envCheck.ready ? t('startup.envReady') : t('startup.envNotReady')}
                    >
                        {envCheck.ready ? (
                            <CheckCircle size={14} />
                        ) : (
                            <AlertCircle size={14} />
                        )}
                        {showEnvStatus && (
                            <div className="startup-env-tooltip">
                                <div className="env-tooltip-title">
                                    {envCheck.ready ? t('startup.envReady') : t('startup.envNotReady')}
                                </div>
                                <div className={`env-tooltip-item ${envCheck.esbuild.available ? 'ok' : 'error'}`}>
                                    {envCheck.esbuild.available ? (
                                        <>
                                            <CheckCircle size={12} />
                                            <span>esbuild {envCheck.esbuild.version}</span>
                                            <span className="env-source">({envCheck.esbuild.source})</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={12} />
                                            <span>{t('startup.esbuildMissing')}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {onLocaleChange && (
                    <div className="startup-locale-dropdown" ref={langMenuRef}>
                        <button
                            className="startup-locale-btn"
                            onClick={() => setShowLangMenu(!showLangMenu)}
                        >
                            <Globe size={14} />
                            <span>{LANGUAGES.find(l => l.code === locale)?.name || 'English'}</span>
                            <ChevronDown size={12} />
                        </button>
                        {showLangMenu && (
                            <div className="startup-locale-menu">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`startup-locale-item ${locale === lang.code ? 'active' : ''}`}
                                        onClick={() => {
                                            onLocaleChange(lang.code as Locale);
                                            setShowLangMenu(false);
                                        }}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 右键菜单 | Context Menu */}
            {contextMenu && (
                <div
                    className="startup-context-menu-overlay"
                    onClick={() => setContextMenu(null)}
                >
                    <div
                        className="startup-context-menu"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="startup-context-menu-item"
                            onClick={() => {
                                onRemoveRecentProject?.(contextMenu.project);
                                setContextMenu(null);
                            }}
                        >
                            <X size={14} />
                            <span>{t('startup.removeFromList')}</span>
                        </button>
                        {onDeleteProject && (
                            <button
                                className="startup-context-menu-item danger"
                                onClick={() => {
                                    setDeleteConfirm(contextMenu.project);
                                    setContextMenu(null);
                                }}
                            >
                                <Trash2 size={14} />
                                <span>{t('startup.deleteProject')}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 删除确认对话框 | Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="startup-dialog-overlay">
                    <div className="startup-dialog">
                        <div className="startup-dialog-header">
                            <Trash2 size={20} className="dialog-icon-danger" />
                            <h3>{t('startup.deleteConfirmTitle')}</h3>
                        </div>
                        <div className="startup-dialog-body">
                            <p>{t('startup.deleteConfirmMessage')}</p>
                            <p className="startup-dialog-path">{deleteConfirm}</p>
                        </div>
                        <div className="startup-dialog-footer">
                            <button
                                className="startup-dialog-btn"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                {t('startup.cancel')}
                            </button>
                            <button
                                className="startup-dialog-btn danger"
                                onClick={async () => {
                                    if (deleteConfirm && onDeleteProject) {
                                        try {
                                            await onDeleteProject(deleteConfirm);
                                        } catch (error) {
                                            console.error('[StartupPage] Failed to delete project:', error);
                                            // Error will be handled by App.tsx error dialog
                                        }
                                    }
                                    setDeleteConfirm(null);
                                }}
                            >
                                {t('startup.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* esbuild 安装对话框 | esbuild Installation Dialog */}
            {showEsbuildInstall && (
                <div className="startup-dialog-overlay">
                    <div className="startup-dialog">
                        <div className="startup-dialog-header">
                            <Terminal size={20} className="dialog-icon-info" />
                            <h3>{t('startup.esbuildNotInstalled')}</h3>
                        </div>
                        <div className="startup-dialog-body">
                            <p>{t('startup.esbuildRequired')}</p>
                            <p className="startup-dialog-info">{t('startup.esbuildInstallPrompt')}</p>

                            {/* 安装进度 | Installation Progress */}
                            {isInstallingEsbuild && (
                                <div className="startup-dialog-progress">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>{installProgress}</span>
                                </div>
                            )}

                            {/* 错误信息 | Error Message */}
                            {installError && (
                                <div className="startup-dialog-error">
                                    <AlertCircle size={16} />
                                    <span>{installError}</span>
                                </div>
                            )}
                        </div>
                        <div className="startup-dialog-footer">
                            <button
                                className="startup-dialog-btn primary"
                                onClick={handleInstallEsbuild}
                                disabled={isInstallingEsbuild}
                            >
                                {isInstallingEsbuild ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        {t('startup.installing')}
                                    </>
                                ) : (
                                    <>
                                        <Download size={14} />
                                        {t('startup.installNow')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
