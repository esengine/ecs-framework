/**
 * 论坛 React Hooks - GitHub Discussions
 * Forum React hooks - GitHub Discussions
 */
import { useState, useEffect, useCallback } from 'react';
import { getForumService } from '../services/forum';
import type {
    AuthState,
    Category,
    Post,
    Reply,
    PostListParams,
    PaginatedResponse
} from '../services/forum';

/**
 * 认证状态 hook
 * Auth state hook
 */
export function useForumAuth() {
    const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
    const forumService = getForumService();

    useEffect(() => {
        const unsubscribe = forumService.onAuthStateChange(setAuthState);

        // 超时保护：5秒后如果还在 loading，则设置为未认证
        // Timeout protection: if still loading after 5s, set to unauthenticated
        const timeout = setTimeout(() => {
            setAuthState(prev => {
                if (prev.status === 'loading') {
                    console.warn('[useForumAuth] Timeout waiting for auth state, setting to unauthenticated');
                    return { status: 'unauthenticated' };
                }
                return prev;
            });
        }, 5000);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const requestDeviceCode = useCallback(async () => {
        return forumService.requestDeviceCode();
    }, []);

    const authenticateWithDeviceFlow = useCallback(async (
        deviceCode: string,
        interval: number,
        onStatusChange?: (status: 'pending' | 'authorized' | 'error') => void
    ) => {
        return forumService.authenticateWithDeviceFlow(deviceCode, interval, onStatusChange);
    }, []);

    const signInWithGitHubToken = useCallback(async (accessToken: string) => {
        return forumService.signInWithGitHubToken(accessToken);
    }, []);

    const signOut = useCallback(async () => {
        return forumService.signOut();
    }, []);

    return {
        authState,
        requestDeviceCode,
        authenticateWithDeviceFlow,
        signInWithGitHubToken,
        signOut
    };
}

/**
 * 分类列表 hook
 * Categories hook
 */
export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const forumService = getForumService();

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const data = await forumService.getCategories();
            setCategories(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { categories, loading, error, refetch: fetchCategories };
}

/**
 * 帖子列表 hook
 * Post list hook
 */
export function usePosts(params: PostListParams = {}) {
    const [data, setData] = useState<PaginatedResponse<Post>>({
        data: [],
        totalCount: 0,
        pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const forumService = getForumService();

    const fetchPosts = useCallback(async (fetchParams: PostListParams = params) => {
        try {
            setLoading(true);
            const result = await forumService.getPosts(fetchParams);
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch posts'));
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(params)]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const loadMore = useCallback(async () => {
        if (!data.pageInfo.hasNextPage || !data.pageInfo.endCursor) return;

        try {
            const result = await forumService.getPosts({
                ...params,
                after: data.pageInfo.endCursor
            });
            setData(prev => ({
                ...result,
                data: [...prev.data, ...result.data]
            }));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load more posts'));
        }
    }, [data.pageInfo, params]);

    return { ...data, loading, error, refetch: fetchPosts, loadMore };
}

/**
 * 单个帖子 hook
 * Single post hook
 */
export function usePost(postNumber: number | null) {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const forumService = getForumService();

    const fetchPost = useCallback(async () => {
        if (postNumber === null) {
            setPost(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const result = await forumService.getPost(postNumber);
            setPost(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch post'));
        } finally {
            setLoading(false);
        }
    }, [postNumber]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    const toggleUpvote = useCallback(async () => {
        if (!post) return;
        const success = await forumService.togglePostUpvote(post.id, post.viewerHasUpvoted);
        if (success) {
            setPost({
                ...post,
                viewerHasUpvoted: !post.viewerHasUpvoted,
                upvoteCount: post.viewerHasUpvoted ? post.upvoteCount - 1 : post.upvoteCount + 1
            });
        }
    }, [post]);

    return { post, loading, error, refetch: fetchPost, toggleUpvote };
}

/**
 * 回复列表 hook
 * Replies hook
 */
export function useReplies(postNumber: number | null) {
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const forumService = getForumService();

    const fetchReplies = useCallback(async () => {
        if (postNumber === null) {
            setReplies([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const result = await forumService.getReplies(postNumber);
            setReplies(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch replies'));
        } finally {
            setLoading(false);
        }
    }, [postNumber]);

    useEffect(() => {
        fetchReplies();
    }, [fetchReplies]);

    const createReply = useCallback(async (discussionId: string, content: string, replyToId?: string) => {
        const reply = await forumService.createReply({
            discussionId,
            body: content,
            replyToId
        });
        if (reply) {
            await fetchReplies();
        }
        return reply;
    }, [fetchReplies]);

    return { replies, loading, error, refetch: fetchReplies, createReply };
}
