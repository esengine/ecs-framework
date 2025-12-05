import { useState, useEffect, useRef } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { Globe, ChevronDown, Download, X, Loader2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { checkForUpdatesOnStartup, installUpdate, type UpdateCheckResult } from '../utils/updater';
import { StartupLogo } from './StartupLogo';
import { TauriAPI, type EnvironmentCheckResult } from '../api/tauri';
import '../styles/StartupPage.css';

type Locale = 'en' | 'zh';

interface StartupPageProps {
  onOpenProject: () => void;
  onCreateProject: () => void;
  onOpenRecentProject?: (projectPath: string) => void;
  onRemoveRecentProject?: (projectPath: string) => void;
  onDeleteProject?: (projectPath: string) => Promise<void>;
  onLocaleChange?: (locale: Locale) => void;
  recentProjects?: string[];
  locale: string;
}

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
];

export function StartupPage({ onOpenProject, onCreateProject, onOpenRecentProject, onRemoveRecentProject, onDeleteProject, onLocaleChange, recentProjects = [], locale }: StartupPageProps) {
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
                // 环境有问题，显示提示
                setShowEnvStatus(true);
                console.warn('[Environment] Not ready:', result.esbuild.error);
            }
        }).catch((error) => {
            console.error('[Environment] Check failed:', error);
        });
    }, []);

    const translations = {
        en: {
            title: 'ESEngine Editor',
            subtitle: 'Professional Game Development Tool',
            openProject: 'Open Project',
            createProject: 'Create Project',
            recentProjects: 'Recent Projects',
            noRecentProjects: 'No recent projects',
            updateAvailable: 'New version available',
            updateNow: 'Update Now',
            installing: 'Installing...',
            later: 'Later',
            removeFromList: 'Remove from List',
            deleteProject: 'Delete Project',
            deleteConfirmTitle: 'Delete Project',
            deleteConfirmMessage: 'Are you sure you want to permanently delete this project? This action cannot be undone.',
            cancel: 'Cancel',
            delete: 'Delete',
            envReady: 'Environment Ready',
            envNotReady: 'Environment Issue',
            esbuildReady: 'esbuild ready',
            esbuildMissing: 'esbuild not found'
        },
        zh: {
            title: 'ESEngine 编辑器',
            subtitle: '专业游戏开发工具',
            openProject: '打开项目',
            createProject: '创建新项目',
            recentProjects: '最近的项目',
            noRecentProjects: '没有最近的项目',
            updateAvailable: '发现新版本',
            updateNow: '立即更新',
            installing: '正在安装...',
            later: '稍后',
            removeFromList: '从列表中移除',
            deleteProject: '删除项目',
            deleteConfirmTitle: '删除项目',
            deleteConfirmMessage: '确定要永久删除此项目吗？此操作无法撤销。',
            cancel: '取消',
            delete: '删除',
            envReady: '环境就绪',
            envNotReady: '环境问题',
            esbuildReady: 'esbuild 就绪',
            esbuildMissing: '未找到 esbuild'
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

    const t = translations[locale as keyof typeof translations] || translations.en;
    const versionText = locale === 'zh' ? `版本 ${appVersion}` : `Version ${appVersion}`;

    const handleLogoComplete = () => {
        setShowLogo(false);
    };

    return (
        <div className="startup-page">
            {showLogo && <StartupLogo onAnimationComplete={handleLogoComplete} />}
            <div className="startup-header">
                <h1 className="startup-title">{t.title}</h1>
                <p className="startup-subtitle">{t.subtitle}</p>
            </div>

            <div className="startup-content">
                <div className="startup-actions">
                    <button className="startup-action-btn primary" onClick={onOpenProject}>
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" strokeWidth="2"/>
                        </svg>
                        <span>{t.openProject}</span>
                    </button>

                    <button className="startup-action-btn" onClick={onCreateProject}>
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 5V19M5 12H19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{t.createProject}</span>
                    </button>
                </div>

                <div className="startup-recent">
                    <h2 className="recent-title">{t.recentProjects}</h2>
                    {recentProjects.length === 0 ? (
                        <p className="recent-empty">{t.noRecentProjects}</p>
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
                                            title={t.removeFromList}
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
                            {t.updateAvailable}: v{updateInfo.version}
                        </span>
                        <button
                            className="update-banner-btn primary"
                            onClick={handleInstallUpdate}
                            disabled={isInstalling}
                        >
                            {isInstalling ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    {t.installing}
                                </>
                            ) : (
                                t.updateNow
                            )}
                        </button>
                        <button
                            className="update-banner-close"
                            onClick={() => setShowUpdateBanner(false)}
                            disabled={isInstalling}
                            title={t.later}
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
                        title={envCheck.ready ? t.envReady : t.envNotReady}
                    >
                        {envCheck.ready ? (
                            <CheckCircle size={14} />
                        ) : (
                            <AlertCircle size={14} />
                        )}
                        {showEnvStatus && (
                            <div className="startup-env-tooltip">
                                <div className="env-tooltip-title">
                                    {envCheck.ready ? t.envReady : t.envNotReady}
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
                                            <span>{t.esbuildMissing}</span>
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
                            <span>{t.removeFromList}</span>
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
                                <span>{t.deleteProject}</span>
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
                            <h3>{t.deleteConfirmTitle}</h3>
                        </div>
                        <div className="startup-dialog-body">
                            <p>{t.deleteConfirmMessage}</p>
                            <p className="startup-dialog-path">{deleteConfirm}</p>
                        </div>
                        <div className="startup-dialog-footer">
                            <button
                                className="startup-dialog-btn"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                {t.cancel}
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
                                {t.delete}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
