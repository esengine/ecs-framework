import { useState, useEffect, useRef } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { Globe, ChevronDown } from 'lucide-react';
import '../styles/StartupPage.css';

type Locale = 'en' | 'zh';

interface StartupPageProps {
  onOpenProject: () => void;
  onCreateProject: () => void;
  onOpenRecentProject?: (projectPath: string) => void;
  onProfilerMode?: () => void;
  onLocaleChange?: (locale: Locale) => void;
  recentProjects?: string[];
  locale: string;
}

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
];

export function StartupPage({ onOpenProject, onCreateProject, onOpenRecentProject, onProfilerMode, onLocaleChange, recentProjects = [], locale }: StartupPageProps) {
    const [hoveredProject, setHoveredProject] = useState<string | null>(null);
    const [appVersion, setAppVersion] = useState<string>('');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
                setShowLangMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        getVersion().then(setAppVersion).catch(() => setAppVersion('1.0.0'));
    }, []);

    const translations = {
        en: {
            title: 'ECS Framework Editor',
            subtitle: 'Professional Game Development Tool',
            openProject: 'Open Project',
            createProject: 'Create Project',
            profilerMode: 'Profiler Mode',
            recentProjects: 'Recent Projects',
            noRecentProjects: 'No recent projects',
            comingSoon: 'Coming Soon'
        },
        zh: {
            title: 'ECS 框架编辑器',
            subtitle: '专业游戏开发工具',
            openProject: '打开项目',
            createProject: '创建新项目',
            profilerMode: '性能分析模式',
            recentProjects: '最近的项目',
            noRecentProjects: '没有最近的项目',
            comingSoon: '即将推出'
        }
    };

    const t = translations[locale as keyof typeof translations] || translations.en;
    const versionText = locale === 'zh' ? `版本 ${appVersion}` : `Version ${appVersion}`;

    return (
        <div className="startup-page">
            <div className="startup-header">
                <h1 className="startup-title">{t.title}</h1>
                <p className="startup-subtitle">{t.subtitle}</p>
            </div>

            <div className="startup-content">
                <div className="startup-actions">
                    <button className="startup-action-btn primary" onClick={onOpenProject}>
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" strokeWidth="2"/>
                        </svg>
                        <span>{t.openProject}</span>
                    </button>

                    <button className="startup-action-btn" onClick={onCreateProject}>
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 5V19M5 12H19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{t.createProject}</span>
                    </button>

                    <button className="startup-action-btn" onClick={onProfilerMode}>
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{t.profilerMode}</span>
                    </button>
                </div>

                <div className="startup-recent">
                    <h2 className="recent-title">{t.recentProjects}</h2>
                    {recentProjects.length === 0 ? (
                        <p className="recent-empty">{t.noRecentProjects}</p>
                    ) : (
                        <ul className="recent-list">
                            {recentProjects.map((project, index) => (
                                <li
                                    key={index}
                                    className={`recent-item ${hoveredProject === project ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHoveredProject(project)}
                                    onMouseLeave={() => setHoveredProject(null)}
                                    onClick={() => onOpenRecentProject?.(project)}
                                    style={{ cursor: onOpenRecentProject ? 'pointer' : 'default' }}
                                >
                                    <svg className="recent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" strokeWidth="2"/>
                                    </svg>
                                    <div className="recent-info">
                                        <div className="recent-name">{project.split(/[\\/]/).pop()}</div>
                                        <div className="recent-path">{project}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="startup-footer">
                <span className="startup-version">{versionText}</span>
                {onLocaleChange && (
                    <div className="startup-locale-dropdown" ref={langMenuRef}>
                        <button
                            className="startup-locale-btn"
                            onClick={() => setShowLangMenu(!showLangMenu)}
                        >
                            <Globe size={14} />
                            <span>{LANGUAGES.find(l => l.code === locale)?.name || 'English'}</span>
                            <ChevronDown size={12} />
                        </button>
                        {showLangMenu && (
                            <div className="startup-locale-menu">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`startup-locale-item ${locale === lang.code ? 'active' : ''}`}
                                        onClick={() => {
                                            onLocaleChange(lang.code as Locale);
                                            setShowLangMenu(false);
                                        }}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
