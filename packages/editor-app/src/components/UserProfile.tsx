import { useState, useRef, useEffect } from 'react';
import { Github, LogOut, User, LayoutDashboard, Loader2 } from 'lucide-react';
import type { GitHubService, GitHubUser } from '../services/GitHubService';
import '../styles/UserProfile.css';

interface UserProfileProps {
    githubService: GitHubService;
    onLogin: () => void;
    onOpenDashboard: () => void;
    locale: string;
}

export function UserProfile({ githubService, onLogin, onOpenDashboard, locale }: UserProfileProps) {
    const [user, setUser] = useState<GitHubUser | null>(githubService.getUser());
    const [showMenu, setShowMenu] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(githubService.isLoadingUserInfo());
    const menuRef = useRef<HTMLDivElement>(null);

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                login: '登录',
                logout: '登出',
                dashboard: '个人中心',
                profile: '个人信息',
                notLoggedIn: '未登录',
                loadingUser: '加载中...'
            },
            en: {
                login: 'Login',
                logout: 'Logout',
                dashboard: 'Dashboard',
                profile: 'Profile',
                notLoggedIn: 'Not logged in',
                loadingUser: 'Loading...'
            }
        };
        return translations[locale]?.[key] || translations.en?.[key] || key;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // 监听加载状态变化
        const unsubscribe = githubService.onUserLoadStateChange((isLoading) => {
            setIsLoadingUser(isLoading);
        });

        return unsubscribe;
    }, [githubService]);

    useEffect(() => {
        // 监听认证状态变化
        const checkUser = () => {
            const currentUser = githubService.getUser();
            setUser((prevUser) => {
                if (currentUser && (!prevUser || currentUser.login !== prevUser.login)) {
                    return currentUser;
                } else if (!currentUser && prevUser) {
                    return null;
                }
                return prevUser;
            });
        };

        // 每秒检查一次用户状态
        const interval = setInterval(checkUser, 1000);

        return () => clearInterval(interval);
    }, [githubService]);

    const handleLogout = () => {
        githubService.logout();
        setUser(null);
        setShowMenu(false);
    };

    if (!user) {
        return (
            <div className="user-profile">
                <button
                    className="login-button"
                    onClick={onLogin}
                    disabled={isLoadingUser}
                    title={isLoadingUser ? t('loadingUser') : undefined}
                >
                    {isLoadingUser ? (
                        <>
                            <Loader2 size={16} className="spinning" />
                            {t('loadingUser')}
                        </>
                    ) : (
                        <>
                            <Github size={16} />
                            {t('login')}
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="user-profile" ref={menuRef}>
            <button className="user-avatar-button" onClick={() => setShowMenu(!showMenu)}>
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="user-avatar" />
                ) : (
                    <div className="user-avatar-placeholder">
                        <User size={20} />
                    </div>
                )}
                <span className="user-name">{user.name || user.login}</span>
            </button>

            {showMenu && (
                <div className="user-menu">
                    <div className="user-menu-header">
                        <img src={user.avatar_url} alt={user.name} className="user-menu-avatar" />
                        <div className="user-menu-info">
                            <div className="user-menu-name">{user.name || user.login}</div>
                            <div className="user-menu-login">@{user.login}</div>
                        </div>
                    </div>

                    <div className="user-menu-divider" />

                    <button
                        className="user-menu-item"
                        onClick={() => {
                            setShowMenu(false);
                            onOpenDashboard();
                        }}
                    >
                        <LayoutDashboard size={16} />
                        {t('dashboard')}
                    </button>

                    <button className="user-menu-item" onClick={handleLogout}>
                        <LogOut size={16} />
                        {t('logout')}
                    </button>
                </div>
            )}
        </div>
    );
}
