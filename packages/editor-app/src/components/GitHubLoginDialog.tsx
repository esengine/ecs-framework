import { X } from 'lucide-react';
import { GitHubService } from '../services/GitHubService';
import { GitHubAuth } from './GitHubAuth';
import '../styles/GitHubLoginDialog.css';

interface GitHubLoginDialogProps {
    githubService: GitHubService;
    onClose: () => void;
    locale: string;
}

export function GitHubLoginDialog({ githubService, onClose, locale }: GitHubLoginDialogProps) {
    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                title: 'GitHub 登录'
            },
            en: {
                title: 'GitHub Login'
            }
        };
        return translations[locale]?.[key] || translations.en?.[key] || key;
    };

    return (
        <div className="github-login-overlay" onClick={onClose}>
            <div className="github-login-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="github-login-header">
                    <h2>{t('title')}</h2>
                    <button className="github-login-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="github-login-content">
                    <GitHubAuth
                        githubService={githubService}
                        onSuccess={onClose}
                        locale={locale}
                    />
                </div>
            </div>
        </div>
    );
}
