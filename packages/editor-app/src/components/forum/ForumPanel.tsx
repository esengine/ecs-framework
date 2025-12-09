/**
 * 论坛面板主组件 - GitHub Discussions
 * Forum panel main component - GitHub Discussions
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import { useForumAuth, useCategories, usePosts } from '../../hooks/useForum';
import { ForumAuth } from './ForumAuth';
import { ForumPostList } from './ForumPostList';
import { ForumPostDetail } from './ForumPostDetail';
import { ForumCreatePost } from './ForumCreatePost';
import { ForumProfile } from './ForumProfile';
import type { PostListParams, ForumUser } from '../../services/forum';
import './ForumPanel.css';

type ForumView = 'list' | 'detail' | 'create';

/**
 * 认证后的论坛内容组件 | Authenticated forum content component
 * 只有在用户认证后才会渲染，确保 hooks 能正常工作
 */
function ForumContent({ user }: { user: ForumUser }) {
    const { t } = useLocale();
    const { categories, refetch: refetchCategories } = useCategories();
    const [view, setView] = useState<ForumView>('list');
    const [selectedPostNumber, setSelectedPostNumber] = useState<number | null>(null);
    const [listParams, setListParams] = useState<PostListParams>({ first: 20 });
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const { data: posts, loading, totalCount, pageInfo, refetch, loadMore } = usePosts(listParams);

    // 点击外部关闭个人资料面板 | Close profile panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowProfile(false);
            }
        };

        if (showProfile) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfile]);

    const handleViewPost = useCallback((postNumber: number) => {
        setSelectedPostNumber(postNumber);
        setView('detail');
    }, []);

    const handleBack = useCallback(() => {
        setView('list');
        setSelectedPostNumber(null);
    }, []);

    const handleCreatePost = useCallback(() => {
        setView('create');
    }, []);

    const handlePostCreated = useCallback(() => {
        setView('list');
        refetch();
    }, [refetch]);

    const handleCategoryChange = useCallback((categoryId: string | undefined) => {
        setListParams(prev => ({ ...prev, categoryId }));
    }, []);

    const handleSearch = useCallback((search: string) => {
        setListParams(prev => ({ ...prev, search }));
    }, []);

    return (
        <>
            {/* 顶部栏 | Header */}
            <div className="forum-header">
                <div className="forum-header-left">
                    <MessageSquare size={18} />
                    <span className="forum-title">
                        {t('forum.community')}
                    </span>
                </div>
                <div className="forum-header-right">
                    <div
                        className="forum-user"
                        onClick={() => setShowProfile(!showProfile)}
                        title={t('forum.clickToViewProfile')}
                    >
                        <img
                            src={user.avatarUrl}
                            alt={user.login}
                            className="forum-user-avatar"
                        />
                        <span className="forum-user-name">
                            {user.login}
                        </span>
                    </div>

                    {/* 个人资料下拉面板 | Profile dropdown panel */}
                    {showProfile && (
                        <div className="forum-profile-dropdown" ref={profileRef}>
                            <ForumProfile onClose={() => setShowProfile(false)} />
                        </div>
                    )}
                </div>
            </div>

            {/* 内容区 | Content */}
            <div className="forum-content">
                {view === 'list' && (
                    <ForumPostList
                        posts={posts}
                        categories={categories}
                        loading={loading}
                        totalCount={totalCount}
                        hasNextPage={pageInfo.hasNextPage}
                        params={listParams}
                        onViewPost={handleViewPost}
                        onCreatePost={handleCreatePost}
                        onCategoryChange={handleCategoryChange}
                        onSearch={handleSearch}
                        onRefresh={refetch}
                        onLoadMore={loadMore}
                    />
                )}
                {view === 'detail' && selectedPostNumber && (
                    <ForumPostDetail
                        postNumber={selectedPostNumber}
                        currentUserId={user.id}
                        onBack={handleBack}
                    />
                )}
                {view === 'create' && (
                    <ForumCreatePost
                        categories={categories}
                        onBack={handleBack}
                        onCreated={handlePostCreated}
                    />
                )}
            </div>
        </>
    );
}

export function ForumPanel() {
    const { t } = useLocale();
    const { authState } = useForumAuth();

    // 加载状态 | Loading state
    if (authState.status === 'loading') {
        return (
            <div className="forum-panel">
                <div className="forum-loading">
                    <RefreshCw className="spin" size={24} />
                    <span>{t('forum.loading')}</span>
                </div>
            </div>
        );
    }

    // 未登录状态 | Unauthenticated state
    if (authState.status === 'unauthenticated') {
        return (
            <div className="forum-panel">
                <ForumAuth />
            </div>
        );
    }

    // 已登录状态 - 渲染内容组件 | Authenticated state - render content component
    return (
        <div className="forum-panel">
            <ForumContent user={authState.user} />
        </div>
    );
}
