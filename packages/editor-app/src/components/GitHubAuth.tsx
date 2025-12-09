import { useState } from 'react';
import { Github, AlertCircle, CheckCircle, Loader, ExternalLink } from 'lucide-react';
import { GitHubService } from '../services/GitHubService';
import { open } from '@tauri-apps/plugin-shell';
import { useLocale } from '../hooks/useLocale';
import '../styles/GitHubAuth.css';

interface GitHubAuthProps {
    githubService: GitHubService;
    onSuccess: () => void;
}

export function GitHubAuth({ githubService, onSuccess }: GitHubAuthProps) {
    const { t } = useLocale();
    const [useOAuth, setUseOAuth] = useState(true);
    const [githubToken, setGithubToken] = useState('');
    const [userCode, setUserCode] = useState('');
    const [verificationUri, setVerificationUri] = useState('');
    const [authStatus, setAuthStatus] = useState<'idle' | 'pending' | 'authorized' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleOAuthLogin = async () => {
        setAuthStatus('pending');
        setError('');

        try {
            const deviceCodeResp = await githubService.requestDeviceCode();

            setUserCode(deviceCodeResp.user_code);
            setVerificationUri(deviceCodeResp.verification_uri);

            await open(deviceCodeResp.verification_uri);

            await githubService.authenticateWithDeviceFlow(
                deviceCodeResp.device_code,
                deviceCodeResp.interval,
                (status) => {
                    setAuthStatus(status === 'pending' ? 'pending' : status === 'authorized' ? 'authorized' : 'error');
                }
            );

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
            setError(t('github.enterToken'));
            return;
        }

        try {
            await githubService.authenticate(githubToken);
            setError('');
            onSuccess();
        } catch (err) {
            console.error('[GitHubAuth] Token auth failed:', err);
            setError(t('github.authFailedToken'));
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
            <p>{t('github.githubLogin')}</p>

            <div className="auth-tabs">
                <button
                    className={`auth-tab ${useOAuth ? 'active' : ''}`}
                    onClick={() => setUseOAuth(true)}
                >
                    {t('github.oauthLogin')}
                </button>
                <button
                    className={`auth-tab ${!useOAuth ? 'active' : ''}`}
                    onClick={() => setUseOAuth(false)}
                >
                    {t('github.tokenLogin')}
                </button>
            </div>

            {useOAuth ? (
                <div className="oauth-auth">
                    {authStatus === 'idle' && (
                        <>
                            <div className="oauth-instructions">
                                <p>{t('github.oauthStep1')}</p>
                                <p>{t('github.oauthStep2')}</p>
                                <p>{t('github.oauthStep3')}</p>
                            </div>

                            <button className="btn-primary" onClick={handleOAuthLogin}>
                                <Github size={16} />
                                {t('github.startAuth')}
                            </button>
                        </>
                    )}

                    {authStatus === 'pending' && (
                        <div className="oauth-pending">
                            <Loader size={48} className="spinning" style={{ color: '#0366d6' }} />
                            <h4>{t('github.authorizing')}</h4>

                            {userCode && (
                                <div className="user-code-display">
                                    <label>{t('github.userCode')}</label>
                                    <div className="code-box">
                                        <span className="code-text">{userCode}</span>
                                        <button
                                            className="btn-copy"
                                            onClick={() => copyToClipboard(userCode)}
                                            title={t('github.copyCode')}
                                        >
                                            📋
                                        </button>
                                    </div>
                                    <button
                                        className="btn-link"
                                        onClick={() => open(verificationUri)}
                                    >
                                        <ExternalLink size={14} />
                                        {t('github.openBrowser')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {authStatus === 'authorized' && (
                        <div className="oauth-success">
                            <CheckCircle size={48} style={{ color: '#34c759' }} />
                            <h4>{t('github.authorized')}</h4>
                        </div>
                    )}

                    {authStatus === 'error' && (
                        <div className="oauth-error">
                            <AlertCircle size={48} style={{ color: '#ff3b30' }} />
                            <h4>{t('github.authFailed')}</h4>
                            {error && (
                                <div className="error-details">
                                    <pre>{error}</pre>
                                </div>
                            )}
                            <button className="btn-secondary" onClick={() => setAuthStatus('idle')}>
                                {t('github.back')}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="token-auth">
                    <div className="form-group">
                        <label>{t('github.tokenLabel')}</label>
                        <input
                            type="password"
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder={t('github.tokenPlaceholder')}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleTokenAuth();
                                }
                            }}
                        />
                        <small>{t('github.tokenHint')}</small>
                    </div>

                    <button className="btn-link" onClick={openCreateTokenPage}>
                        <ExternalLink size={14} />
                        {t('github.createToken')}
                    </button>

                    <button className="btn-primary" onClick={handleTokenAuth}>
                        {t('github.login')}
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
