/**
 * 论坛帖子详情组件 - GitHub Discussions
 * Forum post detail component - GitHub Discussions
 */
import { useState } from 'react';
import {
    ArrowLeft, ThumbsUp, MessageCircle, Clock,
    Send, RefreshCw, CornerDownRight, ExternalLink, CheckCircle
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { usePost, useReplies } from '../../hooks/useForum';
import { getForumService } from '../../services/forum';
import type { Reply } from '../../services/forum';
import { parseEmoji } from './utils';
import './ForumPostDetail.css';

interface ForumPostDetailProps {
    postNumber: number;
    isEnglish: boolean;
    currentUserId: string;
    onBack: () => void;
}

export function ForumPostDetail({ postNumber, isEnglish, currentUserId, onBack }: ForumPostDetailProps) {
    const { post, loading: postLoading, toggleUpvote, refetch: refetchPost } = usePost(postNumber);
    const { replies, loading: repliesLoading, createReply, refetch: refetchReplies } = useReplies(postNumber);
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const forumService = getForumService();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim() || submitting || !post) return;

        setSubmitting(true);
        try {
            await createReply(post.id, replyContent, replyingTo || undefined);
            setReplyContent('');
            setReplyingTo(null);
            refetchPost();
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleReplyUpvote = async (replyId: string, hasUpvoted: boolean) => {
        await forumService.toggleReplyUpvote(replyId, hasUpvoted);
        refetchReplies();
    };

    const openInGitHub = async (url: string) => {
        await open(url);
    };

    const renderReply = (reply: Reply, depth: number = 0) => {
        return (
            <div key={reply.id} className="forum-reply" style={{ marginLeft: depth * 24 }}>
                <div className="forum-reply-header">
                    <div className="forum-reply-author">
                        <img src={reply.author.avatarUrl} alt={reply.author.login} />
                        <span className="forum-reply-author-name">
                            @{reply.author.login}
                        </span>
                        {reply.isAnswer && (
                            <span className="forum-reply-answer-badge">
                                <CheckCircle size={12} />
                                {isEnglish ? 'Answer' : '已采纳'}
                            </span>
                        )}
                    </div>
                    <span className="forum-reply-time">
                        <Clock size={12} />
                        {formatDate(reply.createdAt)}
                    </span>
                </div>

                <div
                    className="forum-reply-content"
                    dangerouslySetInnerHTML={{ __html: reply.bodyHTML }}
                />

                <div className="forum-reply-actions">
                    <button
                        className={`forum-reply-action ${reply.viewerHasUpvoted ? 'liked' : ''}`}
                        onClick={() => handleToggleReplyUpvote(reply.id, reply.viewerHasUpvoted)}
                    >
                        <ThumbsUp size={14} />
                        <span>{reply.upvoteCount}</span>
                    </button>
                    <button
                        className="forum-reply-action"
                        onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                    >
                        <CornerDownRight size={14} />
                        <span>{isEnglish ? 'Reply' : '回复'}</span>
                    </button>
                </div>

                {replyingTo === reply.id && post && (
                    <form className="forum-reply-form nested" onSubmit={handleSubmitReply}>
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={isEnglish
                                ? `Reply to @${reply.author.login}...`
                                : `回复 @${reply.author.login}...`}
                            rows={2}
                        />
                        <div className="forum-reply-form-actions">
                            <button
                                type="button"
                                className="forum-btn"
                                onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                            >
                                {isEnglish ? 'Cancel' : '取消'}
                            </button>
                            <button
                                type="submit"
                                className="forum-btn forum-btn-primary"
                                disabled={!replyContent.trim() || submitting}
                            >
                                <Send size={14} />
                                <span>{isEnglish ? 'Reply' : '回复'}</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* 嵌套回复 | Nested replies */}
                {reply.replies?.nodes.map(child => renderReply(child, depth + 1))}
            </div>
        );
    };

    if (postLoading || !post) {
        return (
            <div className="forum-post-detail">
                <div className="forum-detail-loading">
                    <RefreshCw className="spin" size={24} />
                    <span>{isEnglish ? 'Loading...' : '加载中...'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="forum-post-detail">
            {/* 返回按钮 | Back button */}
            <button className="forum-back-btn" onClick={onBack}>
                <ArrowLeft size={18} />
                <span>{isEnglish ? 'Back to list' : '返回列表'}</span>
            </button>

            {/* 帖子内容 | Post content */}
            <article className="forum-detail-article">
                <header className="forum-detail-header">
                    <div className="forum-detail-category-row">
                        <span className="forum-detail-category">
                            {parseEmoji(post.category.emoji)} {post.category.name}
                        </span>
                        {post.answerChosenAt && (
                            <span className="forum-detail-answered">
                                <CheckCircle size={14} />
                                {isEnglish ? 'Answered' : '已解决'}
                            </span>
                        )}
                        <button
                            className="forum-detail-external"
                            onClick={() => openInGitHub(post.url)}
                            title={isEnglish ? 'Open in GitHub' : '在 GitHub 中打开'}
                        >
                            <ExternalLink size={14} />
                            <span>GitHub</span>
                        </button>
                    </div>
                    <h1 className="forum-detail-title">{post.title}</h1>

                    <div className="forum-detail-meta">
                        <div className="forum-detail-author">
                            <img src={post.author.avatarUrl} alt={post.author.login} />
                            <span>@{post.author.login}</span>
                        </div>
                        <span className="forum-detail-time">
                            <Clock size={14} />
                            {formatDate(post.createdAt)}
                        </span>
                    </div>
                </header>

                <div
                    className="forum-detail-content"
                    dangerouslySetInnerHTML={{ __html: post.bodyHTML }}
                />

                <footer className="forum-detail-footer">
                    <div className="forum-detail-stats">
                        <button
                            className={`forum-detail-stat interactive ${post.viewerHasUpvoted ? 'liked' : ''}`}
                            onClick={toggleUpvote}
                        >
                            <ThumbsUp size={16} />
                            <span>{post.upvoteCount}</span>
                        </button>
                        <div className="forum-detail-stat">
                            <MessageCircle size={16} />
                            <span>{post.comments.totalCount}</span>
                        </div>
                    </div>
                </footer>
            </article>

            {/* 回复区 | Replies section */}
            <section className="forum-replies-section">
                <h2 className="forum-replies-title">
                    <MessageCircle size={18} />
                    <span>
                        {isEnglish ? 'Comments' : '评论'}
                        {post.comments.totalCount > 0 && ` (${post.comments.totalCount})`}
                    </span>
                </h2>

                {/* 回复输入框 | Reply input */}
                {replyingTo === null && (
                    <form className="forum-reply-form" onSubmit={handleSubmitReply}>
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={isEnglish ? 'Write a comment... (Markdown supported)' : '写下你的评论...（支持 Markdown）'}
                            rows={3}
                        />
                        <div className="forum-reply-form-actions">
                            <button
                                type="submit"
                                className="forum-btn forum-btn-primary"
                                disabled={!replyContent.trim() || submitting}
                            >
                                <Send size={14} />
                                <span>{submitting
                                    ? (isEnglish ? 'Posting...' : '发送中...')
                                    : (isEnglish ? 'Post Comment' : '发表评论')}</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* 回复列表 | Reply list */}
                <div className="forum-replies-list">
                    {repliesLoading ? (
                        <div className="forum-replies-loading">
                            <RefreshCw className="spin" size={20} />
                        </div>
                    ) : replies.length === 0 ? (
                        <div className="forum-replies-empty">
                            <p>{isEnglish ? 'No comments yet. Be the first to comment!' : '暂无评论，来发表第一条评论吧！'}</p>
                        </div>
                    ) : (
                        replies.map(reply => renderReply(reply))
                    )}
                </div>
            </section>
        </div>
    );
}
