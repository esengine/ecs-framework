import { X } from 'lucide-react';
import { GitHubService } from '../services/GitHubService';
import { GitHubAuth } from './GitHubAuth';
import { useLocale } from '../hooks/useLocale';
import '../styles/GitHubLoginDialog.css';

interface GitHubLoginDialogProps {
    githubService: GitHubService;
    onClose: () => void;
}

export function GitHubLoginDialog({ githubService, onClose }: GitHubLoginDialogProps) {
    const { t } = useLocale();

    return (
        <div className="github-login-overlay" onClick={onClose}>
            <div className="github-login-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="github-login-header">
                    <h2>{t('github.title')}</h2>
                    <button className="github-login-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="github-login-content">
                    <GitHubAuth
                        githubService={githubService}
                        onSuccess={onClose}
                    />
                </div>
            </div>
        </div>
    );
}
