/**
 * 论坛服务 - GitHub Discussions
 * Forum service - GitHub Discussions
 */
import { fetch } from '@tauri-apps/plugin-http';
import type {
    Category,
    Post,
    Reply,
    PostListParams,
    PaginatedResponse,
    CreatePostParams,
    CreateReplyParams,
    ForumUser,
    AuthState,
    PageInfo
} from './types';

type AuthStateCallback = (state: AuthState) => void;

/**
 * GitHub Device Flow 响应类型
 * GitHub Device Flow response types
 */
export interface DeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
}

interface OAuthTokenResponse {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
}

/** GitHub GraphQL API 端点 | GitHub GraphQL API endpoint */
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

/** 仓库信息 | Repository info */
const REPO_OWNER = 'esengine';
const REPO_NAME = 'ecs-framework';

export class ForumService {
    private authCallbacks = new Set<AuthStateCallback>();
    private currentUser: ForumUser | null = null;
    private isInitialized = false;
    private repositoryId: string | null = null;

    /** GitHub OAuth App Client ID for Forum */
    private readonly GITHUB_CLIENT_ID = 'Ov23liu5on5ud8oloMj2';

    /** localStorage key for token */
    private readonly TOKEN_STORAGE_KEY = 'esengine_forum_github_token';

    constructor() {
        this.initialize();
    }

    // =====================================================
    // GraphQL 请求 | GraphQL Request
    // =====================================================

    /**
     * 发送 GraphQL 请求
     * Send GraphQL request
     */
    private async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
        const token = this.currentUser?.accessToken;
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(GITHUB_GRAPHQL_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, variables })
        });

        const result = await response.json();

        if (result.errors) {
            console.error('[ForumService] GraphQL errors:', result.errors);
            throw new Error(result.errors[0]?.message || 'GraphQL request failed');
        }

        return result.data as T;
    }

    // =====================================================
    // 认证相关 | Authentication
    // =====================================================

    /**
     * 初始化服务
     * Initialize service
     */
    private async initialize(): Promise<void> {
        try {
            // 从 localStorage 恢复 token | Restore token from localStorage
            const savedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);

            if (savedToken) {
                // 验证 token 是否有效 | Verify token is valid
                const user = await this.verifyAndGetUser(savedToken);
                if (user) {
                    this.currentUser = user;
                    this.notifyAuthChange({ status: 'authenticated', user });
                } else {
                    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
                    this.notifyAuthChange({ status: 'unauthenticated' });
                }
            } else {
                this.notifyAuthChange({ status: 'unauthenticated' });
            }
        } catch (err) {
            console.error('[ForumService] Initialize error:', err);
            this.notifyAuthChange({ status: 'unauthenticated' });
        } finally {
            this.isInitialized = true;
        }
    }

    /**
     * 验证 token 并获取用户信息
     * Verify token and get user info
     */
    private async verifyAndGetUser(token: string): Promise<ForumUser | null> {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return {
                id: data.id.toString(),
                login: data.login,
                avatarUrl: data.avatar_url,
                accessToken: token
            };
        } catch {
            return null;
        }
    }

    /**
     * 订阅认证状态变化
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback: AuthStateCallback): () => void {
        this.authCallbacks.add(callback);

        if (this.isInitialized) {
            if (this.currentUser) {
                callback({ status: 'authenticated', user: this.currentUser });
            } else {
                callback({ status: 'unauthenticated' });
            }
        } else {
            callback({ status: 'loading' });
        }

        return () => {
            this.authCallbacks.delete(callback);
        };
    }

    private notifyAuthChange(state: AuthState): void {
        this.authCallbacks.forEach(cb => cb(state));
    }

    /**
     * 获取当前用户
     * Get current user
     */
    getCurrentUser(): ForumUser | null {
        return this.currentUser;
    }

    /**
     * 请求 GitHub Device Code
     * Request GitHub Device Code for Device Flow
     */
    async requestDeviceCode(): Promise<DeviceCodeResponse> {
        const response = await fetch('https://github.com/login/device/code', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: this.GITHUB_CLIENT_ID,
                scope: 'read:user public_repo write:discussion'
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to request device code: ${response.status}`);
        }

        return response.json();
    }

    /**
     * 使用 Device Flow 认证 GitHub
     * Authenticate with GitHub using Device Flow
     */
    async authenticateWithDeviceFlow(
        deviceCode: string,
        interval: number,
        onStatusChange?: (status: 'pending' | 'authorized' | 'error') => void
    ): Promise<string> {
        const pollInterval = Math.max(interval, 5) * 1000;

        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    const response = await fetch('https://github.com/login/oauth/access_token', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            client_id: this.GITHUB_CLIENT_ID,
                            device_code: deviceCode,
                            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                        })
                    });

                    const data: OAuthTokenResponse = await response.json();

                    if (data.access_token) {
                        onStatusChange?.('authorized');
                        resolve(data.access_token);
                        return;
                    }

                    if (data.error === 'authorization_pending') {
                        onStatusChange?.('pending');
                        setTimeout(poll, pollInterval);
                        return;
                    }

                    if (data.error === 'slow_down') {
                        setTimeout(poll, pollInterval + 5000);
                        return;
                    }

                    onStatusChange?.('error');
                    reject(new Error(data.error_description || data.error || 'Authorization failed'));
                } catch (err) {
                    onStatusChange?.('error');
                    reject(err);
                }
            };

            poll();
        });
    }

    /**
     * 使用 GitHub Access Token 登录
     * Sign in with GitHub access token
     */
    async signInWithGitHubToken(accessToken: string): Promise<{ error: Error | null }> {
        try {
            const user = await this.verifyAndGetUser(accessToken);
            if (!user) {
                return { error: new Error('Failed to verify GitHub token') };
            }

            // 保存 token | Save token
            localStorage.setItem(this.TOKEN_STORAGE_KEY, accessToken);

            this.currentUser = user;
            this.notifyAuthChange({ status: 'authenticated', user });

            return { error: null };
        } catch (err) {
            console.error('[ForumService] Sign in failed:', err);
            return { error: err instanceof Error ? err : new Error('Sign in failed') };
        }
    }

    /**
     * 登出
     * Sign out
     */
    async signOut(): Promise<void> {
        localStorage.removeItem(this.TOKEN_STORAGE_KEY);
        this.currentUser = null;
        this.notifyAuthChange({ status: 'unauthenticated' });
    }

    // =====================================================
    // 仓库信息 | Repository Info
    // =====================================================

    /**
     * 获取仓库 ID
     * Get repository ID
     */
    private async getRepositoryId(): Promise<string> {
        if (this.repositoryId) {
            return this.repositoryId;
        }

        const data = await this.graphql<{
            repository: { id: string }
        }>(`
            query {
                repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
                    id
                }
            }
        `);

        this.repositoryId = data.repository.id;
        return this.repositoryId;
    }

    // =====================================================
    // 分类 | Categories
    // =====================================================

    /**
     * 获取所有分类
     * Get all categories
     */
    async getCategories(): Promise<Category[]> {
        const data = await this.graphql<{
            repository: {
                discussionCategories: {
                    nodes: Category[]
                }
            }
        }>(`
            query {
                repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
                    discussionCategories(first: 20) {
                        nodes {
                            id
                            name
                            slug
                            emoji
                            description
                            isAnswerable
                        }
                    }
                }
            }
        `);

        return data.repository.discussionCategories.nodes;
    }

    // =====================================================
    // 帖子 | Posts (Discussions)
    // =====================================================

    /**
     * 获取帖子列表
     * Get post list
     */
    async getPosts(params: PostListParams = {}): Promise<PaginatedResponse<Post>> {
        const { categoryId, first = 20, after } = params;

        let categoryFilter = '';
        if (categoryId) {
            categoryFilter = `, categoryId: "${categoryId}"`;
        }

        let afterCursor = '';
        if (after) {
            afterCursor = `, after: "${after}"`;
        }

        const data = await this.graphql<{
            repository: {
                discussions: {
                    totalCount: number;
                    pageInfo: PageInfo;
                    nodes: Post[];
                }
            }
        }>(`
            query {
                repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
                    discussions(first: ${first}${afterCursor}${categoryFilter}, orderBy: {field: CREATED_AT, direction: DESC}) {
                        totalCount
                        pageInfo {
                            hasNextPage
                            hasPreviousPage
                            startCursor
                            endCursor
                        }
                        nodes {
                            id
                            number
                            title
                            body
                            bodyHTML
                            createdAt
                            updatedAt
                            upvoteCount
                            url
                            viewerHasUpvoted
                            viewerCanUpvote
                            answerChosenAt
                            author {
                                ... on User {
                                    id
                                    login
                                    avatarUrl
                                    url
                                }
                            }
                            category {
                                id
                                name
                                slug
                                emoji
                                description
                                isAnswerable
                            }
                            comments {
                                totalCount
                            }
                            answerChosenBy {
                                ... on User {
                                    login
                                }
                            }
                        }
                    }
                }
            }
        `);

        return {
            data: data.repository.discussions.nodes,
            totalCount: data.repository.discussions.totalCount,
            pageInfo: data.repository.discussions.pageInfo
        };
    }

    /**
     * 获取单个帖子
     * Get single post
     */
    async getPost(number: number): Promise<Post | null> {
        const data = await this.graphql<{
            repository: {
                discussion: Post | null
            }
        }>(`
            query {
                repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
                    discussion(number: ${number}) {
                        id
                        number
                        title
                        body
                        bodyHTML
                        createdAt
                        updatedAt
                        upvoteCount
                        url
                        viewerHasUpvoted
                        viewerCanUpvote
                        answerChosenAt
                        author {
                            ... on User {
                                id
                                login
                                avatarUrl
                                url
                            }
                        }
                        category {
                            id
                            name
                            slug
                            emoji
                            description
                            isAnswerable
                        }
                        comments {
                            totalCount
                        }
                        answerChosenBy {
                            ... on User {
                                login
                            }
                        }
                    }
                }
            }
        `);

        return data.repository.discussion;
    }

    /**
     * 创建帖子
     * Create post
     */
    async createPost(params: CreatePostParams): Promise<Post | null> {
        const repoId = await this.getRepositoryId();

        const data = await this.graphql<{
            createDiscussion: {
                discussion: Post
            }
        }>(`
            mutation CreateDiscussion($input: CreateDiscussionInput!) {
                createDiscussion(input: $input) {
                    discussion {
                        id
                        number
                        title
                        body
                        bodyHTML
                        createdAt
                        updatedAt
                        upvoteCount
                        url
                        viewerHasUpvoted
                        viewerCanUpvote
                        author {
                            ... on User {
                                id
                                login
                                avatarUrl
                                url
                            }
                        }
                        category {
                            id
                            name
                            slug
                            emoji
                            description
                            isAnswerable
                        }
                        comments {
                            totalCount
                        }
                    }
                }
            }
        `, {
            input: {
                repositoryId: repoId,
                categoryId: params.categoryId,
                title: params.title,
                body: params.body
            }
        });

        return data.createDiscussion.discussion;
    }

    /**
     * 点赞/取消点赞帖子
     * Upvote/remove upvote from post
     */
    async togglePostUpvote(discussionId: string, hasUpvoted: boolean): Promise<boolean> {
        try {
            if (hasUpvoted) {
                await this.graphql(`
                    mutation {
                        removeUpvote(input: { subjectId: "${discussionId}" }) {
                            subject {
                                id
                            }
                        }
                    }
                `);
            } else {
                await this.graphql(`
                    mutation {
                        addUpvote(input: { subjectId: "${discussionId}" }) {
                            subject {
                                id
                            }
                        }
                    }
                `);
            }
            return true;
        } catch (err) {
            console.error('[ForumService] Toggle upvote failed:', err);
            return false;
        }
    }

    // =====================================================
    // 回复 | Replies (Comments)
    // =====================================================

    /**
     * 获取帖子的回复列表
     * Get post replies
     */
    async getReplies(discussionNumber: number): Promise<Reply[]> {
        const data = await this.graphql<{
            repository: {
                discussion: {
                    comments: {
                        nodes: Reply[]
                    }
                } | null
            }
        }>(`
            query {
                repository(owner: "${REPO_OWNER}", name: "${REPO_NAME}") {
                    discussion(number: ${discussionNumber}) {
                        comments(first: 100) {
                            nodes {
                                id
                                body
                                bodyHTML
                                createdAt
                                updatedAt
                                upvoteCount
                                isAnswer
                                viewerHasUpvoted
                                viewerCanUpvote
                                author {
                                    ... on User {
                                        id
                                        login
                                        avatarUrl
                                        url
                                    }
                                }
                                replies(first: 50) {
                                    totalCount
                                    nodes {
                                        id
                                        body
                                        bodyHTML
                                        createdAt
                                        updatedAt
                                        upvoteCount
                                        isAnswer
                                        viewerHasUpvoted
                                        viewerCanUpvote
                                        author {
                                            ... on User {
                                                id
                                                login
                                                avatarUrl
                                                url
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `);

        return data.repository.discussion?.comments.nodes || [];
    }

    /**
     * 创建回复
     * Create reply
     */
    async createReply(params: CreateReplyParams): Promise<Reply | null> {
        try {
            if (params.replyToId) {
                // 回复评论 | Reply to comment
                const data = await this.graphql<{
                    addDiscussionComment: {
                        comment: Reply
                    }
                }>(`
                    mutation AddReply($input: AddDiscussionCommentInput!) {
                        addDiscussionComment(input: $input) {
                            comment {
                                id
                                body
                                bodyHTML
                                createdAt
                                updatedAt
                                upvoteCount
                                isAnswer
                                viewerHasUpvoted
                                viewerCanUpvote
                                author {
                                    ... on User {
                                        id
                                        login
                                        avatarUrl
                                        url
                                    }
                                }
                            }
                        }
                    }
                `, {
                    input: {
                        discussionId: params.discussionId,
                        replyToId: params.replyToId,
                        body: params.body
                    }
                });

                return data.addDiscussionComment.comment;
            } else {
                // 直接评论帖子 | Direct comment on discussion
                const data = await this.graphql<{
                    addDiscussionComment: {
                        comment: Reply
                    }
                }>(`
                    mutation AddComment($input: AddDiscussionCommentInput!) {
                        addDiscussionComment(input: $input) {
                            comment {
                                id
                                body
                                bodyHTML
                                createdAt
                                updatedAt
                                upvoteCount
                                isAnswer
                                viewerHasUpvoted
                                viewerCanUpvote
                                author {
                                    ... on User {
                                        id
                                        login
                                        avatarUrl
                                        url
                                    }
                                }
                            }
                        }
                    }
                `, {
                    input: {
                        discussionId: params.discussionId,
                        body: params.body
                    }
                });

                return data.addDiscussionComment.comment;
            }
        } catch (err) {
            console.error('[ForumService] Create reply failed:', err);
            return null;
        }
    }

    /**
     * 点赞/取消点赞回复
     * Upvote/remove upvote from reply
     */
    async toggleReplyUpvote(commentId: string, hasUpvoted: boolean): Promise<boolean> {
        try {
            if (hasUpvoted) {
                await this.graphql(`
                    mutation {
                        removeUpvote(input: { subjectId: "${commentId}" }) {
                            subject {
                                id
                            }
                        }
                    }
                `);
            } else {
                await this.graphql(`
                    mutation {
                        addUpvote(input: { subjectId: "${commentId}" }) {
                            subject {
                                id
                            }
                        }
                    }
                `);
            }
            return true;
        } catch (err) {
            console.error('[ForumService] Toggle reply upvote failed:', err);
            return false;
        }
    }

    // =====================================================
    // 图片上传 | Image Upload
    // =====================================================

    /** Imgur Client ID (匿名上传) | Imgur Client ID (anonymous upload) */
    private readonly IMGUR_CLIENT_ID = '546c25a59c58ad7';

    /**
     * 上传图片到 Imgur 图床
     * Upload image to Imgur
     * @param file 图片文件 | Image file
     * @param onProgress 进度回调 | Progress callback
     * @returns 图片 URL | Image URL
     */
    async uploadImage(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        // 验证文件类型 | Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Only PNG, JPEG, GIF, and WebP images are allowed');
        }

        // 限制文件大小 (10MB - Imgur 限制) | Limit file size (10MB - Imgur limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('Image size must be less than 10MB');
        }

        onProgress?.(10);

        // 读取文件为 base64 | Read file as base64
        const base64Content = await this.fileToBase64(file);

        onProgress?.(30);

        // 使用 Imgur API 上传 | Upload using Imgur API
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${this.IMGUR_CLIENT_ID}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: base64Content,
                type: 'base64'
            })
        });

        onProgress?.(80);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[ForumService] Imgur upload failed:', errorData);
            throw new Error(`Failed to upload image: ${response.status}`);
        }

        const data = await response.json();
        onProgress?.(100);

        if (!data.success || !data.data?.link) {
            throw new Error('Imgur upload failed: invalid response');
        }

        return data.data.link;
    }

    /**
     * 将文件转换为 base64
     * Convert file to base64
     */
    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // 移除 data:image/xxx;base64, 前缀 | Remove data:image/xxx;base64, prefix
                const base64 = result.split(',')[1] || '';
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// 单例实例 | Singleton instance
let forumServiceInstance: ForumService | null = null;

export function getForumService(): ForumService {
    if (!forumServiceInstance) {
        forumServiceInstance = new ForumService();
    }
    return forumServiceInstance;
}
