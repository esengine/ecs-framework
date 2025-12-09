/**
 * 论坛登录组件 - 使用 GitHub Device Flow
 * Forum auth component - using GitHub Device Flow
 */
import { AlertCircle, CheckCircle, ExternalLink, Github, Loader } from 'lucide-react';
import { useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { useLocale } from '../../hooks/useLocale';
import { useForumAuth } from '../../hooks/useForum';
import './ForumAuth.css';

type AuthStatus = 'idle' | 'pending' | 'authorized' | 'error';

export function ForumAuth() {
    const { t } = useLocale();
    const { requestDeviceCode, authenticateWithDeviceFlow, signInWithGitHubToken } = useForumAuth();

    const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
    const [userCode, setUserCode] = useState('');
    const [verificationUri, setVerificationUri] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleGitHubLogin = async () => {
        setAuthStatus('pending');
        setError(null);

        try {
            // 请求 Device Code | Request Device Code
            const deviceCodeResp = await requestDeviceCode();

            setUserCode(deviceCodeResp.user_code);
            setVerificationUri(deviceCodeResp.verification_uri);

            // 打开浏览器 | Open browser
            await open(deviceCodeResp.verification_uri);

            // 轮询等待授权 | Poll for authorization
            const accessToken = await authenticateWithDeviceFlow(
                deviceCodeResp.device_code,
                deviceCodeResp.interval,
                (status) => {
                    if (status === 'authorized') {
                        setAuthStatus('authorized');
                    } else if (status === 'error') {
                        setAuthStatus('error');
                    }
                }
            );

            // 使用 token 登录 Supabase | Sign in to Supabase with token
            const { error: signInError } = await signInWithGitHubToken(accessToken);

            if (signInError) {
                throw signInError;
            }

            setAuthStatus('authorized');
        } catch (err) {
            console.error('[ForumAuth] GitHub login failed:', err);
            setAuthStatus('error');
            setError(err instanceof Error ? err.message : t('forum.authFailed'));
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleRetry = () => {
        setAuthStatus('idle');
        setUserCode('');
        setVerificationUri('');
        setError(null);
    };

    return (
        <div className="forum-auth">
            <div className="forum-auth-card">
                <div className="forum-auth-header">
                    <Github size={32} className="forum-auth-icon" />
                    <h2>{t('forum.communityTitle')}</h2>
                    <p>{t('forum.signInWithGitHub')}</p>
                </div>

                {/* 初始状态 | Idle state */}
                {authStatus === 'idle' && (
                    <div className="forum-auth-content">
                        <div className="forum-auth-instructions">
                            <p>{t('forum.step1')}</p>
                            <p>{t('forum.step2')}</p>
                            <p>{t('forum.step3')}</p>
                        </div>
                        <button className="forum-auth-github-btn" onClick={handleGitHubLogin}>
                            <Github size={16} />
                            <span>{t('forum.continueWithGitHub')}</span>
                        </button>
                    </div>
                )}

                {/* 等待授权 | Pending state */}
                {authStatus === 'pending' && (
                    <div className="forum-auth-pending">
                        <Loader size={24} className="spinning" />
                        <p className="forum-auth-pending-text">
                            {t('forum.waitingForAuth')}
                        </p>

                        {userCode && (
                            <div className="forum-auth-code-section">
                                <label>{t('forum.enterCodeOnGitHub')}</label>
                                <div className="forum-auth-code-box">
                                    <span className="forum-auth-code">{userCode}</span>
                                    <button
                                        className="forum-auth-copy-btn"
                                        onClick={() => copyToClipboard(userCode)}
                                        title={t('forum.copyCode')}
                                    >
                                        📋
                                    </button>
                                </div>
                                <button
                                    className="forum-auth-link-btn"
                                    onClick={() => open(verificationUri)}
                                >
                                    <ExternalLink size={14} />
                                    <span>{t('forum.openGitHub')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 授权成功 | Success state */}
                {authStatus === 'authorized' && (
                    <div className="forum-auth-success">
                        <CheckCircle size={32} className="forum-auth-success-icon" />
                        <p>{t('forum.authSuccess')}</p>
                    </div>
                )}

                {/* 授权失败 | Error state */}
                {authStatus === 'error' && (
                    <div className="forum-auth-error-state">
                        <AlertCircle size={32} className="forum-auth-error-icon" />
                        <p>{t('forum.authFailed')}</p>
                        {error && <p className="forum-auth-error-detail">{error}</p>}
                        <button className="forum-auth-retry-btn" onClick={handleRetry}>
                            {t('forum.tryAgain')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
