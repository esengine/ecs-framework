import { useState, useEffect } from 'react';
import { X, RefreshCw, Check, AlertCircle, Download } from 'lucide-react';
import { checkForUpdates } from '../utils/updater';
import { getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-shell';
import '../styles/AboutDialog.css';

interface AboutDialogProps {
    onClose: () => void;
    locale?: string;
}

export function AboutDialog({ onClose, locale = 'en' }: AboutDialogProps) {
    const [checking, setChecking] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'latest' | 'error'>('idle');
    const [version, setVersion] = useState<string>('1.0.0');
    const [newVersion, setNewVersion] = useState<string>('');

    useEffect(() => {
        // Fetch version on mount
        const fetchVersion = async () => {
            try {
                const currentVersion = await getVersion();
                setVersion(currentVersion);
            } catch (error) {
                console.error('Failed to get version:', error);
            }
        };
        fetchVersion();
    }, []);

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            en: {
                title: 'About ECS Framework Editor',
                version: 'Version',
                description: 'High-performance ECS framework editor for game development',
                checkUpdate: 'Check for Updates',
                checking: 'Checking...',
                updateAvailable: 'New version available',
                latest: 'You are using the latest version',
                error: 'Failed to check for updates',
                download: 'Download Update',
                close: 'Close',
                copyright: '© 2025 ESEngine. All rights reserved.',
                website: 'Website',
                github: 'GitHub'
            },
            zh: {
                title: '关于 ECS Framework Editor',
                version: '版本',
                description: '高性能 ECS 框架编辑器，用于游戏开发',
                checkUpdate: '检查更新',
                checking: '检查中...',
                updateAvailable: '发现新版本',
                latest: '您正在使用最新版本',
                error: '检查更新失败',
                download: '下载更新',
                close: '关闭',
                copyright: '© 2025 ESEngine. 保留所有权利。',
                website: '官网',
                github: 'GitHub'
            }
        };
        return translations[locale]?.[key] || key;
    };

    const handleCheckUpdate = async () => {
        setChecking(true);
        setUpdateStatus('checking');

        try {
            const currentVersion = await getVersion();
            setVersion(currentVersion);

            // 使用我们的 updater 工具检查更新
            const result = await checkForUpdates(false);

            if (result.error) {
                setUpdateStatus('error');
            } else if (result.available) {
                setUpdateStatus('available');
                if (result.version) {
                    setNewVersion(result.version);
                }
            } else {
                setUpdateStatus('latest');
            }
        } catch (error: any) {
            console.error('Check update failed:', error);
            setUpdateStatus('error');
        } finally {
            setChecking(false);
        }
    };

    const getStatusIcon = () => {
        switch (updateStatus) {
            case 'checking':
                return <RefreshCw size={16} className="animate-spin" />;
            case 'available':
                return <Download size={16} className="status-available" />;
            case 'latest':
                return <Check size={16} className="status-latest" />;
            case 'error':
                return <AlertCircle size={16} className="status-error" />;
            default:
                return null;
        }
    };

    const getStatusText = () => {
        switch (updateStatus) {
            case 'checking':
                return t('checking');
            case 'available':
                return `${t('updateAvailable')} (v${newVersion})`;
            case 'latest':
                return t('latest');
            case 'error':
                return t('error');
            default:
                return '';
        }
    };

    const handleOpenGithub = async () => {
        try {
            await open('https://github.com/esengine/ecs-framework');
        } catch (error) {
            console.error('Failed to open GitHub link:', error);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="about-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="about-header">
                    <h2>{t('title')}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="about-content">
                    <div className="about-logo">
                        <div className="logo-placeholder">ECS</div>
                    </div>

                    <div className="about-info">
                        <h3>ECS Framework Editor</h3>
                        <p className="about-version">
                            {t('version')}: Editor {version}
                        </p>
                        <p className="about-description">
                            {t('description')}
                        </p>
                    </div>

                    <div className="about-update">
                        <button
                            className="update-btn"
                            onClick={handleCheckUpdate}
                            disabled={checking}
                        >
                            {checking ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    <span>{t('checking')}</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={16} />
                                    <span>{t('checkUpdate')}</span>
                                </>
                            )}
                        </button>

                        {updateStatus !== 'idle' && (
                            <div className={`update-status status-${updateStatus}`}>
                                {getStatusIcon()}
                                <span>{getStatusText()}</span>
                            </div>
                        )}
                    </div>

                    <div className="about-links">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleOpenGithub();
                            }}
                            className="about-link"
                        >
                            {t('github')}
                        </a>
                    </div>

                    <div className="about-footer">
                        <p>{t('copyright')}</p>
                    </div>
                </div>

                <div className="about-actions">
                    <button className="btn-primary" onClick={onClose}>
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
