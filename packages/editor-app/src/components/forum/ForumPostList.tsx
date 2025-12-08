/**
 * 帖子列表组件 - GitHub Discussions
 * Post list component - GitHub Discussions
 */
import { useState } from 'react';
import {
    Plus, RefreshCw, Search, MessageCircle, ThumbsUp,
    ExternalLink, CheckCircle, Flame, Clock, TrendingUp,
    Lightbulb, HelpCircle, Megaphone, BarChart3, Github
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import type { Post, Category, PostListParams } from '../../services/forum';
import { parseEmoji } from './utils';
import './ForumPostList.css';

interface ForumPostListProps {
    posts: Post[];
    categories: Category[];
    loading: boolean;
    totalCount: number;
    hasNextPage: boolean;
    params: PostListParams;
    isEnglish: boolean;
    onViewPost: (postNumber: number) => void;
    onCreatePost: () => void;
    onCategoryChange: (categoryId: string | undefined) => void;
    onSearch: (search: string) => void;
    onRefresh: () => void;
    onLoadMore: () => void;
}

/**
 * 获取分类图标 | Get category icon
 */
function getCategoryIcon(name: string) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('idea') || lowerName.includes('建议')) return <Lightbulb size={14} />;
    if (lowerName.includes('q&a') || lowerName.includes('问答')) return <HelpCircle size={14} />;
    if (lowerName.includes('show') || lowerName.includes('展示')) return <Megaphone size={14} />;
    if (lowerName.includes('poll') || lowerName.includes('投票')) return <BarChart3 size={14} />;
    return <MessageCircle size={14} />;
}

export function ForumPostList({
    posts,
    categories,
    loading,
    totalCount,
    hasNextPage,
    params,
    isEnglish,
    onViewPost,
    onCreatePost,
    onCategoryChange,
    onSearch,
    onRefresh,
    onLoadMore
}: ForumPostListProps) {
    const [searchInput, setSearchInput] = useState(params.search || '');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchInput);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const mins = Math.floor(diff / (1000 * 60));
                if (mins < 1) return isEnglish ? 'Just now' : '刚刚';
                return isEnglish ? `${mins}m ago` : `${mins}分钟前`;
            }
            return isEnglish ? `${hours}h ago` : `${hours}小时前`;
        }
        if (days === 1) return isEnglish ? 'Yesterday' : '昨天';
        if (days < 7) return isEnglish ? `${days}d ago` : `${days}天前`;
        return date.toLocaleDateString();
    };

    const openInGitHub = async (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await open(url);
    };

    // 检查帖子是否是热门（高点赞或评论）| Check if post is hot
    const isHotPost = (post: Post) => post.upvoteCount >= 5 || post.comments.totalCount >= 3;

    // 检查帖子是否是新帖（24小时内）| Check if post is recent
    const isRecentPost = (post: Post) => {
        const diff = Date.now() - new Date(post.createdAt).getTime();
        return diff < 24 * 60 * 60 * 1000;
    };

    const openGitHubDiscussions = async () => {
        await open('https://github.com/esengine/esengine/discussions');
    };

    return (
        <div className="forum-post-list">
            {/* 欢迎横幅 | Welcome banner */}
            {!params.categoryId && !params.search && (
                <div className="forum-welcome-banner">
                    <div className="forum-welcome-content">
                        <div className="forum-welcome-text">
                            <h2>{isEnglish ? 'ESEngine Community' : 'ESEngine 社区'}</h2>
                            <p>
                                {isEnglish
                                    ? 'Ask questions, share ideas, and connect with other developers'
                                    : '提出问题、分享想法，与其他开发者交流'}
                            </p>
                        </div>
                        <div className="forum-welcome-actions">
                            <button className="forum-btn forum-btn-primary" onClick={onCreatePost}>
                                <Plus size={14} />
                                <span>{isEnglish ? 'New Discussion' : '发起讨论'}</span>
                            </button>
                            <button className="forum-btn forum-btn-github" onClick={openGitHubDiscussions}>
                                <Github size={14} />
                                <span>{isEnglish ? 'View on GitHub' : '在 GitHub 查看'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 分类卡片 | Category cards */}
            {!params.categoryId && !params.search && categories.length > 0 && (
                <div className="forum-category-cards">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className="forum-category-card"
                            onClick={() => onCategoryChange(cat.id)}
                        >
                            <span className="forum-category-card-icon">
                                {getCategoryIcon(cat.name)}
                            </span>
                            <span className="forum-category-card-emoji">{parseEmoji(cat.emoji)}</span>
                            <span className="forum-category-card-name">{cat.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* 工具栏 | Toolbar */}
            <div className="forum-toolbar">
                <div className="forum-toolbar-left">
                    <select
                        className="forum-select"
                        value={params.categoryId || ''}
                        onChange={(e) => onCategoryChange(e.target.value || undefined)}
                    >
                        <option value="">{isEnglish ? 'All Categories' : '全部分类'}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {parseEmoji(cat.emoji)} {cat.name}
                            </option>
                        ))}
                    </select>

                    <form onSubmit={handleSearchSubmit} className="forum-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder={isEnglish ? 'Search discussions...' : '搜索讨论...'}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </form>
                </div>

                <div className="forum-toolbar-right">
                    <button
                        className="forum-btn"
                        onClick={onRefresh}
                        disabled={loading}
                        title={isEnglish ? 'Refresh' : '刷新'}
                    >
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    </button>
                    <button
                        className="forum-btn forum-btn-primary"
                        onClick={onCreatePost}
                    >
                        <Plus size={14} />
                        <span>{isEnglish ? 'New' : '发帖'}</span>
                    </button>
                </div>
            </div>

            {/* 帖子统计 | Post stats */}
            <div className="forum-stats">
                <div className="forum-stats-left">
                    <TrendingUp size={14} />
                    <span>{totalCount} {isEnglish ? 'discussions' : '条讨论'}</span>
                </div>
                {params.categoryId && (
                    <button
                        className="forum-stats-clear"
                        onClick={() => onCategoryChange(undefined)}
                    >
                        {isEnglish ? 'Clear filter' : '清除筛选'}
                    </button>
                )}
            </div>

            {/* 帖子列表 | Post list */}
            <div className={`forum-posts ${loading ? 'loading' : ''}`}>
                {/* 加载覆盖层 | Loading overlay */}
                {loading && posts.length > 0 && (
                    <div className="forum-posts-overlay">
                        <RefreshCw size={20} className="spin" />
                    </div>
                )}

                {loading && posts.length === 0 ? (
                    <div className="forum-posts-loading">
                        <RefreshCw size={16} className="spin" />
                        <span>{isEnglish ? 'Loading...' : '加载中...'}</span>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="forum-posts-empty">
                        <MessageCircle size={32} />
                        <p>{isEnglish ? 'No discussions yet' : '暂无讨论'}</p>
                        <button className="forum-btn forum-btn-primary" onClick={onCreatePost}>
                            <Plus size={14} />
                            <span>{isEnglish ? 'Start a discussion' : '发起讨论'}</span>
                        </button>
                    </div>
                ) : (
                    <>
                        {posts.map(post => (
                            <div
                                key={post.id}
                                className={`forum-post-item ${isHotPost(post) ? 'hot' : ''}`}
                                onClick={() => onViewPost(post.number)}
                            >
                                <div className="forum-post-avatar">
                                    <img
                                        src={post.author.avatarUrl}
                                        alt={post.author.login}
                                    />
                                    {isHotPost(post) && (
                                        <span className="forum-post-avatar-badge hot">
                                            <Flame size={10} />
                                        </span>
                                    )}
                                </div>
                                <div className="forum-post-content">
                                    <div className="forum-post-header">
                                        <div className="forum-post-badges">
                                            {isRecentPost(post) && (
                                                <span className="forum-post-badge new">
                                                    <Clock size={10} />
                                                    {isEnglish ? 'New' : '新'}
                                                </span>
                                            )}
                                            {isHotPost(post) && (
                                                <span className="forum-post-badge hot">
                                                    <Flame size={10} />
                                                    {isEnglish ? 'Hot' : '热门'}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="forum-post-title">{post.title}</h3>
                                        <button
                                            className="forum-post-external"
                                            onClick={(e) => openInGitHub(post.url, e)}
                                            title={isEnglish ? 'Open in GitHub' : '在 GitHub 中打开'}
                                        >
                                            <ExternalLink size={12} />
                                        </button>
                                    </div>
                                    <div className="forum-post-meta">
                                        <span className="forum-post-category">
                                            {parseEmoji(post.category.emoji)} {post.category.name}
                                        </span>
                                        <span className="forum-post-author">
                                            <img
                                                src={post.author.avatarUrl}
                                                alt={post.author.login}
                                                className="forum-post-author-avatar"
                                            />
                                            @{post.author.login}
                                        </span>
                                        <span className="forum-post-time">
                                            <Clock size={11} />
                                            {formatDate(post.createdAt)}
                                        </span>
                                    </div>
                                    <div className="forum-post-stats">
                                        <span className={`forum-post-stat ${post.viewerHasUpvoted ? 'active' : ''}`}>
                                            <ThumbsUp size={12} />
                                            {post.upvoteCount}
                                        </span>
                                        <span className="forum-post-stat">
                                            <MessageCircle size={12} />
                                            {post.comments.totalCount}
                                        </span>
                                        {post.answerChosenAt && (
                                            <span className="forum-post-answered">
                                                <CheckCircle size={12} />
                                                {isEnglish ? 'Answered' : '已解决'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 加载更多 | Load more */}
                        {hasNextPage && (
                            <div className="forum-load-more">
                                <button
                                    className="forum-btn"
                                    onClick={onLoadMore}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw size={14} className="spin" />
                                            <span>{isEnglish ? 'Loading...' : '加载中...'}</span>
                                        </>
                                    ) : (
                                        <span>{isEnglish ? 'Load More' : '加载更多'}</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
