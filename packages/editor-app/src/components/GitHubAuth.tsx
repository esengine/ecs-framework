import { useState } from 'react';
import { Github, AlertCircle, CheckCircle, Loader, ExternalLink } from 'lucide-react';
import { GitHubService } from '../services/GitHubService';
import { open } from '@tauri-apps/plugin-shell';
import '../styles/GitHubAuth.css';

interface GitHubAuthProps {
    githubService: GitHubService;
    onSuccess: () => void;
    locale: string;
}

export function GitHubAuth({ githubService, onSuccess, locale }: GitHubAuthProps) {
    const [useOAuth, setUseOAuth] = useState(true);
    const [githubToken, setGithubToken] = useState('');
    const [userCode, setUserCode] = useState('');
    const [verificationUri, setVerificationUri] = useState('');
    const [authStatus, setAuthStatus] = useState<'idle' | 'pending' | 'authorized' | 'error'>('idle');
    const [error, setError] = useState('');

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                githubLogin: 'GitHub 登录',
                oauthLogin: 'OAuth 登录（推荐）',
                tokenLogin: 'Token 登录',
                oauthStep1: '1. 点击"开始授权"按钮',
                oauthStep2: '2. 在浏览器中打开 GitHub 授权页面',
                oauthStep3: '3. 输入下方显示的代码并授权',
                startAuth: '开始授权',
                authorizing: '等待授权中...',
                authorized: '授权成功！',
                authFailed: '授权失败',
                userCode: '授权码',
                copyCode: '复制代码',
                openBrowser: '打开浏览器',
                tokenLabel: 'GitHub Personal Access Token',
                tokenPlaceholder: '粘贴你的 GitHub Token',
                tokenHint: '需要 repo 和 workflow 权限',
                createToken: '创建 Token',
                login: '登录',
                back: '返回'
            },
            en: {
                githubLogin: 'GitHub Login',
                oauthLogin: 'OAuth Login (Recommended)',
                tokenLogin: 'Token Login',
                oauthStep1: '1. Click "Start Authorization"',
                oauthStep2: '2. Open GitHub authorization page in browser',
                oauthStep3: '3. Enter the code shown below and authorize',
                startAuth: 'Start Authorization',
                authorizing: 'Waiting for authorization...',
                authorized: 'Authorized!',
                authFailed: 'Authorization failed',
                userCode: 'Authorization Code',
                copyCode: 'Copy Code',
                openBrowser: 'Open Browser',
                tokenLabel: 'GitHub Personal Access Token',
                tokenPlaceholder: 'Paste your GitHub Token',
                tokenHint: 'Requires repo and workflow permissions',
                createToken: 'Create Token',
                login: 'Login',
                back: 'Back'
            }
        };
        return translations[locale]?.[key] || translations.en?.[key] || key;
    };

    const handleOAuthLogin = async () => {
        setAuthStatus('pending');
        setError('');

        try {
            console.log('[GitHubAuth] Starting OAuth login...');

            const deviceCodeResp = await githubService.requestDeviceCode();
            console.log('[GitHubAuth] Device code received:', deviceCodeResp.user_code);

            setUserCode(deviceCodeResp.user_code);
            setVerificationUri(deviceCodeResp.verification_uri);

            console.log('[GitHubAuth] Opening browser...');
            await open(deviceCodeResp.verification_uri);

            console.log('[GitHubAuth] Starting authentication polling...');
            await githubService.authenticateWithDeviceFlow(
                deviceCodeResp.device_code,
                deviceCodeResp.interval,
                (status) => {
                    console.log('[GitHubAuth] Auth status changed:', status);
                    setAuthStatus(status === 'pending' ? 'pending' : status === 'authorized' ? 'authorized' : 'error');
                }
            );

            console.log('[GitHubAuth] Authorization successful!');
            setAuthStatus('authorized');
            setTimeout(() => {
                onSuccess();
            }, 1000);
        } catch (err) {
            console.error('[GitHubAuth] OAuth failed:', err);
            setAuthStatus('error');
            const errorMessage = err instanceof Error ? err.message : 'OAuth authorization failed';
            const fullError = err instanceof Error && err.stack ? `${errorMessage}\n\nDetails: ${err.stack}` : errorMessage;
            setError(fullError);
        }
    };

    const handleTokenAuth = async () => {
        if (!githubToken.trim()) {
            setError(locale === 'zh' ? '请输入 Token' : 'Please enter a token');
            return;
        }

        try {
            await githubService.authenticate(githubToken);
            setError('');
            onSuccess();
        } catch (err) {
            console.error('[GitHubAuth] Token auth failed:', err);
            setError(locale === 'zh' ? '认证失败，请检查你的 Token' : 'Authentication failed. Please check your token.');
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const openCreateTokenPage = async () => {
        await githubService.openAuthorizationPage();
    };

    return (
        <div className="github-auth">
            <Github size={48} style={{ color: '#0366d6' }} />
            <p>{t('githubLogin')}</p>

            <div className="auth-tabs">
                <button
                    className={`auth-tab ${useOAuth ? 'active' : ''}`}
                    onClick={() => setUseOAuth(true)}
                >
                    {t('oauthLogin')}
                </button>
                <button
                    className={`auth-tab ${!useOAuth ? 'active' : ''}`}
                    onClick={() => setUseOAuth(false)}
                >
                    {t('tokenLogin')}
                </button>
            </div>

            {useOAuth ? (
                <div className="oauth-auth">
                    {authStatus === 'idle' && (
                        <>
                            <div className="oauth-instructions">
                                <p>{t('oauthStep1')}</p>
                                <p>{t('oauthStep2')}</p>
                                <p>{t('oauthStep3')}</p>
                            </div>

                            <button className="btn-primary" onClick={handleOAuthLogin}>
                                <Github size={16} />
                                {t('startAuth')}
                            </button>
                        </>
                    )}

                    {authStatus === 'pending' && (
                        <div className="oauth-pending">
                            <Loader size={48} className="spinning" style={{ color: '#0366d6' }} />
                            <h4>{t('authorizing')}</h4>

                            {userCode && (
                                <div className="user-code-display">
                                    <label>{t('userCode')}</label>
                                    <div className="code-box">
                                        <span className="code-text">{userCode}</span>
                                        <button
                                            className="btn-copy"
                                            onClick={() => copyToClipboard(userCode)}
                                            title={t('copyCode')}
                                        >
                                            📋
                                        </button>
                                    </div>
                                    <button
                                        className="btn-link"
                                        onClick={() => open(verificationUri)}
                                    >
                                        <ExternalLink size={14} />
                                        {t('openBrowser')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {authStatus === 'authorized' && (
                        <div className="oauth-success">
                            <CheckCircle size={48} style={{ color: '#34c759' }} />
                            <h4>{t('authorized')}</h4>
                        </div>
                    )}

                    {authStatus === 'error' && (
                        <div className="oauth-error">
                            <AlertCircle size={48} style={{ color: '#ff3b30' }} />
                            <h4>{t('authFailed')}</h4>
                            {error && (
                                <div className="error-details">
                                    <pre>{error}</pre>
                                </div>
                            )}
                            <button className="btn-secondary" onClick={() => setAuthStatus('idle')}>
                                {t('back')}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="token-auth">
                    <div className="form-group">
                        <label>{t('tokenLabel')}</label>
                        <input
                            type="password"
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder={t('tokenPlaceholder')}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleTokenAuth();
                                }
                            }}
                        />
                        <small>{t('tokenHint')}</small>
                    </div>

                    <button className="btn-link" onClick={openCreateTokenPage}>
                        <ExternalLink size={14} />
                        {t('createToken')}
                    </button>

                    <button className="btn-primary" onClick={handleTokenAuth}>
                        {t('login')}
                    </button>
                </div>
            )}

            {error && !useOAuth && (
                <div className="error-message">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
        </div>
    );
}
