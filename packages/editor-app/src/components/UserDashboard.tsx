import { useState, useEffect } from 'react';
import { X, Package, GitPullRequest, ExternalLink, RefreshCw, Trash2, CheckCircle, XCircle, AlertCircle, Clock, MessageSquare, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { open } from '@tauri-apps/plugin-shell';
import type { GitHubService, PublishedPlugin, PendingReview, CheckStatus, PRComment, PRReview } from '../services/GitHubService';
import '../styles/UserDashboard.css';

interface UserDashboardProps {
    githubService: GitHubService;
    onClose: () => void;
    locale: string;
}

type Tab = 'published' | 'pending';
type PRFilter = 'all' | 'open' | 'merged' | 'closed';

export function UserDashboard({ githubService, onClose, locale }: UserDashboardProps) {
    const [activeTab, setActiveTab] = useState<Tab>('published');
    const [publishedPlugins, setPublishedPlugins] = useState<PublishedPlugin[]>([]);
    const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingPR, setDeletingPR] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [prFilter, setPRFilter] = useState<PRFilter>('open');
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
    const [confirmDeletePlugin, setConfirmDeletePlugin] = useState<PublishedPlugin | null>(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deletingPlugin, setDeletingPlugin] = useState(false);
    const [deleteProgress, setDeleteProgress] = useState({ message: '', progress: 0 });

    const user = githubService.getUser();

    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            zh: {
                title: '个人中心',
                published: '已发布插件',
                pending: '审核中',
                refresh: '刷新',
                loading: '加载中...',
                error: '加载失败',
                noPublished: '还没有发布任何插件',
                noPending: '没有待审核的插件',
                version: '版本',
                category: '分类',
                publishedAt: '发布于',
                createdAt: '提交于',
                status: '状态',
                viewPR: '查看PR',
                viewRepo: '查看仓库',
                statusOpen: '审核中',
                statusMerged: '已合并',
                statusClosed: '已关闭',
                deletePR: '删除PR',
                confirmDeleteTitle: '确认删除',
                confirmDeleteMessage: '确定要关闭并删除这个 Pull Request 吗？此操作无法撤销。',
                confirm: '确认',
                cancel: '取消',
                deleting: '删除中...',
                deleteSuccess: '删除成功',
                deleteFailed: '删除失败',
                filterAll: '全部',
                filterOpen: '进行中',
                filterMerged: '已合并',
                filterClosed: '已关闭',
                ciChecks: 'CI检查',
                ciPassing: '通过',
                ciFailed: '失败',
                ciPending: '等待中',
                viewDetails: '查看详情',
                comments: '评论',
                reviews: '审查意见',
                reviewApproved: '已批准',
                reviewChangesRequested: '需要修改',
                reviewCommented: '已评论',
                noCommentsYet: '暂无评论',
                showComments: '显示评论',
                hideComments: '隐藏评论',
                deletePlugin: '删除插件',
                confirmDeletePluginTitle: '确认删除插件',
                confirmDeletePluginMessage: '确定要删除插件 "{{name}}" 吗？这将创建一个删除请求PR，需要审核后才会从市场移除。',
                deleteReasonLabel: '删除原因（必填）',
                deleteReasonPlaceholder: '请说明删除此插件的原因...',
                confirmDelete: '确认删除',
                deletePluginError: '删除插件失败'
            },
            en: {
                title: 'User Dashboard',
                published: 'Published Plugins',
                pending: 'Pending Reviews',
                refresh: 'Refresh',
                loading: 'Loading...',
                error: 'Failed to load',
                noPublished: 'No published plugins yet',
                noPending: 'No pending reviews',
                version: 'Version',
                category: 'Category',
                publishedAt: 'Published at',
                createdAt: 'Submitted at',
                status: 'Status',
                viewPR: 'View PR',
                viewRepo: 'View Repository',
                statusOpen: 'Open',
                statusMerged: 'Merged',
                statusClosed: 'Closed',
                deletePR: 'Delete PR',
                confirmDeleteTitle: 'Confirm Delete',
                confirmDeleteMessage: 'Are you sure you want to close and delete this Pull Request? This action cannot be undone.',
                confirm: 'Confirm',
                cancel: 'Cancel',
                deleting: 'Deleting...',
                deleteSuccess: 'Deleted successfully',
                deleteFailed: 'Failed to delete',
                filterAll: 'All',
                filterOpen: 'Open',
                filterMerged: 'Merged',
                filterClosed: 'Closed',
                ciChecks: 'CI Checks',
                ciPassing: 'Passing',
                ciFailed: 'Failed',
                ciPending: 'Pending',
                viewDetails: 'View Details',
                comments: 'Comments',
                reviews: 'Reviews',
                reviewApproved: 'Approved',
                reviewChangesRequested: 'Changes Requested',
                reviewCommented: 'Commented',
                noCommentsYet: 'No comments yet',
                showComments: 'Show Comments',
                hideComments: 'Hide Comments',
                deletePlugin: 'Delete Plugin',
                confirmDeletePluginTitle: 'Confirm Plugin Deletion',
                confirmDeletePluginMessage: 'Are you sure you want to delete plugin "{{name}}"? This will create a deletion request PR that requires review before removal from marketplace.',
                deleteReasonLabel: 'Reason for Deletion (Required)',
                deleteReasonPlaceholder: 'Please explain why you want to delete this plugin...',
                confirmDelete: 'Confirm Delete',
                deletePluginError: 'Failed to delete plugin'
            }
        };
        return translations[locale]?.[key] || translations.en?.[key] || key;
    };

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [published, pending] = await Promise.all([
                githubService.getPublishedPlugins(),
                githubService.getPendingReviews()
            ]);
            setPublishedPlugins(published);
            setPendingReviews(pending);
        } catch (err) {
            console.error('[UserDashboard] Failed to load data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'open':
                return 'status-badge status-open';
            case 'merged':
                return 'status-badge status-merged';
            case 'closed':
                return 'status-badge status-closed';
            default:
                return 'status-badge';
        }
    };

    const handleDeletePlugin = async () => {
        if (!confirmDeletePlugin || !deleteReason.trim()) {
            return;
        }

        setDeletingPlugin(true);
        setDeleteProgress({ message: '', progress: 0 });

        try {
            const { PluginPublishService } = await import('../services/PluginPublishService');
            const publishService = new PluginPublishService(githubService);

            publishService.setProgressCallback((progress) => {
                setDeleteProgress({ message: progress.message, progress: progress.progress });
            });

            const prUrl = await publishService.deletePlugin(
                confirmDeletePlugin.id,
                confirmDeletePlugin.name,
                confirmDeletePlugin.category_type as 'official' | 'community',
                deleteReason
            );

            console.log(`[UserDashboard] Delete PR created:`, prUrl);

            setConfirmDeletePlugin(null);
            setDeleteReason('');
            await loadData();
        } catch (err) {
            console.error('[UserDashboard] Failed to delete plugin:', err);
            alert(t('deletePluginError') + ': ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setDeletingPlugin(false);
        }
    };

    const handleDeletePR = async (prNumber: number) => {
        setDeletingPR(prNumber);
        try {
            await githubService.closePullRequest('esengine', 'ecs-editor-plugins', prNumber);
            console.log(`[UserDashboard] Successfully closed PR #${prNumber}`);
            await loadData();
            setConfirmDelete(null);
        } catch (err) {
            console.error('[UserDashboard] Failed to close PR:', err);
            setError(t('deleteFailed') + ': ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setDeletingPR(null);
        }
    };

    const getCheckIcon = (check: CheckStatus) => {
        if (!check.conclusion || check.conclusion === 'pending') {
            return <Clock size={16} className="check-icon-pending" />;
        }
        if (check.conclusion === 'success') {
            return <CheckCircle size={16} className="check-icon-success" />;
        }
        return <XCircle size={16} className="check-icon-failure" />;
    };

    const getCheckClassName = (check: CheckStatus) => {
        if (!check.conclusion || check.conclusion === 'pending') {
            return 'check-status check-pending';
        }
        if (check.conclusion === 'success') {
            return 'check-status check-success';
        }
        return 'check-status check-failure';
    };

    const getFilteredReviews = () => {
        if (prFilter === 'all') {
            return pendingReviews;
        }
        return pendingReviews.filter(review => review.status === prFilter);
    };

    const handleLinkClick = (href: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        open(href).catch(err => {
            console.error('[UserDashboard] Failed to open link:', err);
        });
    };

    const MarkdownLink = ({ href, children }: { href?: string; children: React.ReactNode }) => {
        if (!href) return <a>{children}</a>;
        return (
            <a href={href} onClick={handleLinkClick(href)} className="markdown-link">
                {children}
            </a>
        );
    };

    const toggleComments = (prNumber: number) => {
        const newExpanded = new Set(expandedComments);
        if (newExpanded.has(prNumber)) {
            newExpanded.delete(prNumber);
        } else {
            newExpanded.add(prNumber);
        }
        setExpandedComments(newExpanded);
    };

    const getReviewStateLabel = (state: string) => {
        switch (state) {
            case 'APPROVED':
                return t('reviewApproved');
            case 'CHANGES_REQUESTED':
                return t('reviewChangesRequested');
            case 'COMMENTED':
                return t('reviewCommented');
            default:
                return state;
        }
    };

    const getReviewStateClass = (state: string) => {
        switch (state) {
            case 'APPROVED':
                return 'review-state-approved';
            case 'CHANGES_REQUESTED':
                return 'review-state-changes';
            case 'COMMENTED':
                return 'review-state-commented';
            default:
                return '';
        }
    };

    const renderPublishedPlugins = () => {
        if (loading) {
            return <div className="dashboard-loading">{t('loading')}</div>;
        }

        if (error) {
            return <div className="dashboard-error">{t('error')}: {error}</div>;
        }

        if (publishedPlugins.length === 0) {
            return <div className="dashboard-empty">{t('noPublished')}</div>;
        }

        return (
            <div className="plugin-list">
                {publishedPlugins.map((plugin) => (
                    <div key={plugin.id} className="plugin-card">
                        <div className="plugin-header">
                            <Package size={20} />
                            <div className="plugin-info">
                                <h3 className="plugin-name">{plugin.name}</h3>
                                <p className="plugin-description">{plugin.description}</p>
                            </div>
                        </div>
                        <div className="plugin-meta">
                            <span className="plugin-meta-item">
                                {t('version')}: <strong>{plugin.version}</strong>
                            </span>
                            <span className="plugin-meta-item">
                                {t('category')}: <strong>{plugin.category}</strong>
                            </span>
                            <span className="plugin-meta-item">
                                {t('publishedAt')}: {formatDate(plugin.publishedAt)}
                            </span>
                        </div>
                        <div className="plugin-actions">
                            {plugin.repositoryUrl && (
                                <a
                                    href={plugin.repositoryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="plugin-link"
                                >
                                    {t('viewRepo')} <ExternalLink size={14} />
                                </a>
                            )}
                            <a href={plugin.prUrl} target="_blank" rel="noopener noreferrer" className="plugin-link">
                                {t('viewPR')} <ExternalLink size={14} />
                            </a>
                            <button
                                className="btn-delete"
                                onClick={() => setConfirmDeletePlugin(plugin)}
                                title={t('deletePlugin')}
                            >
                                <Trash2 size={14} />
                                {t('deletePlugin')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderPendingReviews = () => {
        if (loading) {
            return <div className="dashboard-loading">{t('loading')}</div>;
        }

        if (error) {
            return <div className="dashboard-error">{t('error')}: {error}</div>;
        }

        const filteredReviews = getFilteredReviews();

        if (filteredReviews.length === 0) {
            return <div className="dashboard-empty">{t('noPending')}</div>;
        }

        return (
            <>
                <div className="review-filters">
                    <button
                        className={`filter-btn ${prFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setPRFilter('all')}
                    >
                        {t('filterAll')} ({pendingReviews.length})
                    </button>
                    <button
                        className={`filter-btn ${prFilter === 'open' ? 'active' : ''}`}
                        onClick={() => setPRFilter('open')}
                    >
                        {t('filterOpen')} ({pendingReviews.filter(r => r.status === 'open').length})
                    </button>
                    <button
                        className={`filter-btn ${prFilter === 'merged' ? 'active' : ''}`}
                        onClick={() => setPRFilter('merged')}
                    >
                        {t('filterMerged')} ({pendingReviews.filter(r => r.status === 'merged').length})
                    </button>
                    <button
                        className={`filter-btn ${prFilter === 'closed' ? 'active' : ''}`}
                        onClick={() => setPRFilter('closed')}
                    >
                        {t('filterClosed')} ({pendingReviews.filter(r => r.status === 'closed').length})
                    </button>
                </div>
                <div className="review-list">
                    {filteredReviews.map((review) => (
                        <div key={review.prNumber} className="review-card">
                            <div className="review-header">
                                <GitPullRequest size={20} />
                                <div className="review-info">
                                    <h3 className="review-name">
                                        {review.pluginName} <span className="review-version">v{review.version}</span>
                                    </h3>
                                    <span className={getStatusBadgeClass(review.status)}>
                                        {t(`status${review.status.charAt(0).toUpperCase()}${review.status.slice(1)}`)}
                                    </span>
                                </div>
                            </div>
                            <div className="review-meta">
                                <span className="review-meta-item">
                                    PR #{review.prNumber}
                                </span>
                                <span className="review-meta-item">
                                    {t('createdAt')}: {formatDate(review.createdAt)}
                                </span>
                            </div>
                            {review.checks && review.checks.length > 0 && (
                                <div className="review-checks">
                                    <div className="checks-header">{t('ciChecks')}:</div>
                                    <div className="checks-list">
                                        {review.checks.map((check, index) => (
                                            <div key={index} className={getCheckClassName(check)}>
                                                {getCheckIcon(check)}
                                                <span className="check-name">{check.name}</span>
                                                {check.detailsUrl && (
                                                    <a
                                                        href={check.detailsUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="check-details-link"
                                                    >
                                                        {t('viewDetails')}
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {((review.reviews && review.reviews.length > 0) || (review.comments && review.comments.length > 0)) && (
                                <div className="review-feedback">
                                    <button
                                        className="feedback-toggle-btn"
                                        onClick={() => toggleComments(review.prNumber)}
                                    >
                                        <MessageSquare size={14} />
                                        {expandedComments.has(review.prNumber) ? t('hideComments') : t('showComments')}
                                        {' '}({(review.reviews?.length || 0) + (review.comments?.length || 0)})
                                    </button>
                                    {expandedComments.has(review.prNumber) && (
                                        <div className="feedback-content">
                                            {review.reviews && review.reviews.length > 0 && (
                                                <div className="reviews-section">
                                                    <div className="section-header">{t('reviews')}:</div>
                                                    {review.reviews.map((reviewItem) => (
                                                        <div key={reviewItem.id} className="review-item">
                                                            <div className="review-item-header">
                                                                <img
                                                                    src={reviewItem.user.avatar_url}
                                                                    alt={reviewItem.user.login}
                                                                    className="reviewer-avatar"
                                                                />
                                                                <div className="reviewer-info">
                                                                    <span className="reviewer-name">{reviewItem.user.login}</span>
                                                                    <span className={`review-state-badge ${getReviewStateClass(reviewItem.state)}`}>
                                                                        {getReviewStateLabel(reviewItem.state)}
                                                                    </span>
                                                                </div>
                                                                <span className="review-date">
                                                                    {formatDate(reviewItem.submitted_at)}
                                                                </span>
                                                            </div>
                                                            <div className="review-item-body markdown-content">
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    rehypePlugins={[rehypeRaw]}
                                                                    components={{
                                                                        a: MarkdownLink as any
                                                                    }}
                                                                >
                                                                    {reviewItem.body}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {review.comments && review.comments.length > 0 && (
                                                <div className="comments-section">
                                                    <div className="section-header">{t('comments')}:</div>
                                                    {review.comments.map((comment) => (
                                                        <div key={comment.id} className="comment-item">
                                                            <div className="comment-item-header">
                                                                <img
                                                                    src={comment.user.avatar_url}
                                                                    alt={comment.user.login}
                                                                    className="commenter-avatar"
                                                                />
                                                                <div className="commenter-info">
                                                                    <span className="commenter-name">{comment.user.login}</span>
                                                                    <span className="comment-date">
                                                                        {formatDate(comment.created_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="comment-item-body markdown-content">
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    rehypePlugins={[rehypeRaw]}
                                                                    components={{
                                                                        a: MarkdownLink as any
                                                                    }}
                                                                >
                                                                    {comment.body}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="review-actions">
                                <a href={review.prUrl} target="_blank" rel="noopener noreferrer" className="review-link">
                                    {t('viewPR')} <ExternalLink size={14} />
                                </a>
                                {review.status === 'open' && (
                                    <button
                                        className="review-delete-btn"
                                        onClick={() => setConfirmDelete(review.prNumber)}
                                        disabled={deletingPR === review.prNumber}
                                        title={t('deletePR')}
                                    >
                                        <Trash2 size={14} />
                                        {deletingPR === review.prNumber ? t('deleting') : t('deletePR')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <div className="user-dashboard-overlay">
            <div className="user-dashboard">
                <div className="dashboard-header">
                    <h2 className="dashboard-title">{t('title')}</h2>
                    <div className="dashboard-header-actions">
                        <button className="dashboard-refresh-btn" onClick={loadData} disabled={loading}>
                            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                            {t('refresh')}
                        </button>
                        <button className="dashboard-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {user && (
                    <div className="dashboard-user-info">
                        <img src={user.avatar_url} alt={user.name} className="dashboard-user-avatar" />
                        <div className="dashboard-user-details">
                            <div className="dashboard-user-name">{user.name || user.login}</div>
                            <div className="dashboard-user-login">@{user.login}</div>
                        </div>
                    </div>
                )}

                <div className="dashboard-tabs">
                    <button
                        className={`dashboard-tab ${activeTab === 'published' ? 'active' : ''}`}
                        onClick={() => setActiveTab('published')}
                    >
                        <Package size={16} />
                        {t('published')} ({publishedPlugins.length})
                    </button>
                    <button
                        className={`dashboard-tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        <GitPullRequest size={16} />
                        {t('pending')} ({pendingReviews.filter((r) => r.status === 'open').length})
                    </button>
                </div>

                <div className="dashboard-content">
                    {activeTab === 'published' ? renderPublishedPlugins() : renderPendingReviews()}
                </div>

                {confirmDelete && (
                    <div className="confirm-dialog-overlay">
                        <div className="confirm-dialog">
                            <h3>{t('confirmDeleteTitle')}</h3>
                            <p>{t('confirmDeleteMessage')}</p>
                            <div className="confirm-dialog-actions">
                                <button
                                    className="confirm-dialog-cancel"
                                    onClick={() => setConfirmDelete(null)}
                                    disabled={deletingPR !== null}
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    className="confirm-dialog-confirm"
                                    onClick={() => handleDeletePR(confirmDelete)}
                                    disabled={deletingPR !== null}
                                >
                                    {deletingPR === confirmDelete ? t('deleting') : t('confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {confirmDeletePlugin && (
                    <div className="confirm-dialog-overlay">
                        <div className="confirm-dialog">
                            <h3>{t('confirmDeletePluginTitle')}</h3>
                            <p>{t('confirmDeletePluginMessage').replace('{{name}}', confirmDeletePlugin.name)}</p>

                            <div className="confirm-dialog-input-group">
                                <label htmlFor="delete-reason">{t('deleteReasonLabel')}</label>
                                <textarea
                                    id="delete-reason"
                                    className="confirm-dialog-textarea"
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder={t('deleteReasonPlaceholder')}
                                    rows={4}
                                    disabled={deletingPlugin}
                                />
                            </div>

                            {deletingPlugin && (
                                <div className="confirm-dialog-progress">
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${deleteProgress.progress}%` }}></div>
                                    </div>
                                    <p className="progress-message">{deleteProgress.message}</p>
                                </div>
                            )}

                            <div className="confirm-dialog-actions">
                                <button
                                    className="confirm-dialog-cancel"
                                    onClick={() => {
                                        setConfirmDeletePlugin(null);
                                        setDeleteReason('');
                                    }}
                                    disabled={deletingPlugin}
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    className="confirm-dialog-confirm confirm-dialog-danger"
                                    onClick={handleDeletePlugin}
                                    disabled={deletingPlugin || !deleteReason.trim()}
                                >
                                    {deletingPlugin ? t('deleting') : t('confirmDelete')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
