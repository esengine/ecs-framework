/**
 * 用户资料组件 - GitHub
 * User profile component - GitHub
 */
import { Github, LogOut, ExternalLink } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useLocale } from '../../hooks/useLocale';
import { useForumAuth } from '../../hooks/useForum';
import './ForumProfile.css';

interface ForumProfileProps {
    onClose?: () => void;
}

export function ForumProfile({ onClose }: ForumProfileProps) {
    const { t } = useLocale();
    const { authState, signOut } = useForumAuth();

    const user = authState.status === 'authenticated' ? authState.user : null;

    const handleSignOut = async () => {
        await signOut();
        onClose?.();
    };

    const openGitHubProfile = async () => {
        if (user) {
            await open(`https://github.com/${user.login}`);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="forum-profile">
            <div className="forum-profile-header">
                <div className="forum-profile-avatar">
                    <img src={user.avatarUrl} alt={user.login} />
                </div>
                <div className="forum-profile-info">
                    <h3 className="forum-profile-name">@{user.login}</h3>
                    <button
                        className="forum-profile-github-link"
                        onClick={openGitHubProfile}
                    >
                        <Github size={12} />
                        <span>{t('forum.viewGitHubProfile')}</span>
                        <ExternalLink size={10} />
                    </button>
                </div>
            </div>

            <div className="forum-profile-divider" />

            <div className="forum-profile-actions">
                <button className="forum-profile-btn logout" onClick={handleSignOut}>
                    <LogOut size={14} />
                    <span>{t('forum.signOut')}</span>
                </button>
            </div>
        </div>
    );
}
