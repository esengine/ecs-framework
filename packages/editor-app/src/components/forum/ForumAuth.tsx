/**
 * 论坛登录组件 - 使用 GitHub Device Flow
 * Forum auth component - using GitHub Device Flow
 */
import { AlertCircle, CheckCircle, ExternalLink, Github, Loader } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import { useForumAuth } from '../../hooks/useForum';
import './ForumAuth.css';

type AuthStatus = 'idle' | 'pending' | 'authorized' | 'error';

export function ForumAuth() {
    const { i18n } = useTranslation();
    const { requestDeviceCode, authenticateWithDeviceFlow, signInWithGitHubToken } = useForumAuth();

    const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
    const [userCode, setUserCode] = useState('');
    const [verificationUri, setVerificationUri] = useState('');
    const [error, setError] = useState<string | null>(null);

    const isEnglish = i18n.language === 'en';

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
            setError(err instanceof Error ? err.message : (isEnglish ? 'Authorization failed' : '授权失败'));
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
                    <h2>{isEnglish ? 'ESEngine Community' : 'ESEngine 社区'}</h2>
                    <p>{isEnglish ? 'Sign in with GitHub to join the discussion' : '使用 GitHub 登录参与讨论'}</p>
                </div>

                {/* 初始状态 | Idle state */}
                {authStatus === 'idle' && (
                    <div className="forum-auth-content">
                        <div className="forum-auth-instructions">
                            <p>{isEnglish ? '1. Click the button below' : '1. 点击下方按钮'}</p>
                            <p>{isEnglish ? '2. Enter the code on GitHub' : '2. 在 GitHub 页面输入验证码'}</p>
                            <p>{isEnglish ? '3. Authorize the application' : '3. 授权应用'}</p>
                        </div>
                        <button className="forum-auth-github-btn" onClick={handleGitHubLogin}>
                            <Github size={16} />
                            <span>{isEnglish ? 'Continue with GitHub' : '使用 GitHub 登录'}</span>
                        </button>
                    </div>
                )}

                {/* 等待授权 | Pending state */}
                {authStatus === 'pending' && (
                    <div className="forum-auth-pending">
                        <Loader size={24} className="spinning" />
                        <p className="forum-auth-pending-text">
                            {isEnglish ? 'Waiting for authorization...' : '等待授权中...'}
                        </p>

                        {userCode && (
                            <div className="forum-auth-code-section">
                                <label>{isEnglish ? 'Enter this code on GitHub:' : '在 GitHub 输入此验证码：'}</label>
                                <div className="forum-auth-code-box">
                                    <span className="forum-auth-code">{userCode}</span>
                                    <button
                                        className="forum-auth-copy-btn"
                                        onClick={() => copyToClipboard(userCode)}
                                        title={isEnglish ? 'Copy code' : '复制验证码'}
                                    >
                                        📋
                                    </button>
                                </div>
                                <button
                                    className="forum-auth-link-btn"
                                    onClick={() => open(verificationUri)}
                                >
                                    <ExternalLink size={14} />
                                    <span>{isEnglish ? 'Open GitHub' : '打开 GitHub'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 授权成功 | Success state */}
                {authStatus === 'authorized' && (
                    <div className="forum-auth-success">
                        <CheckCircle size={32} className="forum-auth-success-icon" />
                        <p>{isEnglish ? 'Authorization successful!' : '授权成功！'}</p>
                    </div>
                )}

                {/* 授权失败 | Error state */}
                {authStatus === 'error' && (
                    <div className="forum-auth-error-state">
                        <AlertCircle size={32} className="forum-auth-error-icon" />
                        <p>{isEnglish ? 'Authorization failed' : '授权失败'}</p>
                        {error && <p className="forum-auth-error-detail">{error}</p>}
                        <button className="forum-auth-retry-btn" onClick={handleRetry}>
                            {isEnglish ? 'Try Again' : '重试'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
