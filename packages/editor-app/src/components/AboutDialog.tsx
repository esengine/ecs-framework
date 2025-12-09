import { useState, useEffect } from 'react';
import { X, RefreshCw, Check, AlertCircle, Download, Loader2 } from 'lucide-react';
import { checkForUpdates, installUpdate } from '../utils/updater';
import { getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-shell';
import { MiniParticleLogo } from './MiniParticleLogo';
import { useLocale } from '../hooks/useLocale';
import '../styles/AboutDialog.css';

interface AboutDialogProps {
    onClose: () => void;
}

export function AboutDialog({ onClose }: AboutDialogProps) {
    const { t } = useLocale();
    const [checking, setChecking] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'latest' | 'error' | 'installing'>('idle');
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

    const handleCheckUpdate = async () => {
        setChecking(true);
        setUpdateStatus('checking');

        try {
            const currentVersion = await getVersion();
            setVersion(currentVersion);

            // 使用我们的 updater 工具检查更新（仅检查，不自动安装）
            const result = await checkForUpdates();

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
        } catch (error) {
            console.error('Check update failed:', error);
            setUpdateStatus('error');
        } finally {
            setChecking(false);
        }
    };

    const handleInstallUpdate = async () => {
        setInstalling(true);
        setUpdateStatus('installing');

        try {
            const success = await installUpdate();
            if (!success) {
                setUpdateStatus('error');
                setInstalling(false);
            }
            // 如果成功，应用会重启，不需要处理
        } catch (error) {
            console.error('Install update failed:', error);
            setUpdateStatus('error');
            setInstalling(false);
        }
    };

    const getStatusIcon = () => {
        switch (updateStatus) {
            case 'checking':
                return <RefreshCw size={16} className="animate-spin" />;
            case 'available':
                return <Download size={16} className="status-available" />;
            case 'installing':
                return <Loader2 size={16} className="animate-spin" />;
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
                return t('about.checking');
            case 'available':
                return `${t('about.updateAvailable')} (v${newVersion})`;
            case 'installing':
                return t('about.installing');
            case 'latest':
                return t('about.latest');
            case 'error':
                return t('about.error');
            default:
                return '';
        }
    };

    const handleOpenGithub = async () => {
        try {
            await open('https://github.com/esengine/esengine');
        } catch (error) {
            console.error('Failed to open GitHub link:', error);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="about-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="about-header">
                    <h2>{t('about.title')}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="about-content">
                    <div className="about-logo">
                        <MiniParticleLogo text="ESEngine" width={360} height={60} fontSize={42} />
                    </div>

                    <div className="about-info">
                        <h3>ESEngine Editor</h3>
                        <p className="about-version">
                            {t('about.version')}: Editor {version}
                        </p>
                        <p className="about-description">
                            {t('about.description')}
                        </p>
                    </div>

                    <div className="about-update">
                        <button
                            className="update-btn"
                            onClick={handleCheckUpdate}
                            disabled={checking || installing}
                        >
                            {checking ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    <span>{t('about.checking')}</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={16} />
                                    <span>{t('about.checkUpdate')}</span>
                                </>
                            )}
                        </button>

                        {updateStatus !== 'idle' && (
                            <div className={`update-status status-${updateStatus}`}>
                                {getStatusIcon()}
                                <span>{getStatusText()}</span>
                            </div>
                        )}

                        {updateStatus === 'available' && (
                            <button
                                className="update-btn install-btn"
                                onClick={handleInstallUpdate}
                                disabled={installing}
                            >
                                {installing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>{t('about.installing')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        <span>{t('about.download')}</span>
                                    </>
                                )}
                            </button>
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
                            {t('about.github')}
                        </a>
                    </div>

                    <div className="about-footer">
                        <p>{t('about.copyright')}</p>
                    </div>
                </div>

                <div className="about-actions">
                    <button className="btn-primary" onClick={onClose}>
                        {t('about.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
