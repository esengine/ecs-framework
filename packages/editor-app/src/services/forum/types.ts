/**
 * 论坛类型定义 - GitHub Discussions
 * Forum type definitions - GitHub Discussions
 */

/**
 * GitHub 用户信息
 * GitHub user info
 */
export interface GitHubUser {
    id: string;
    login: string;
    avatarUrl: string;
    url: string;
}

/**
 * Discussion 分类
 * Discussion category
 */
export interface Category {
    id: string;
    name: string;
    slug: string;
    emoji: string;
    description: string;
    isAnswerable: boolean;
}

/**
 * Discussion 帖子
 * Discussion post
 */
export interface Post {
    id: string;
    number: number;
    title: string;
    body: string;
    bodyHTML: string;
    author: GitHubUser;
    category: Category;
    createdAt: string;
    updatedAt: string;
    upvoteCount: number;
    comments: {
        totalCount: number;
    };
    answerChosenAt?: string;
    answerChosenBy?: GitHubUser;
    url: string;
    viewerHasUpvoted: boolean;
    viewerCanUpvote: boolean;
}

/**
 * Discussion 评论
 * Discussion comment
 */
export interface Reply {
    id: string;
    body: string;
    bodyHTML: string;
    author: GitHubUser;
    createdAt: string;
    updatedAt: string;
    upvoteCount: number;
    isAnswer: boolean;
    viewerHasUpvoted: boolean;
    viewerCanUpvote: boolean;
    replies?: {
        totalCount: number;
        nodes: Reply[];
    };
}

/**
 * 帖子列表查询参数
 * Post list query parameters
 */
export interface PostListParams {
    categoryId?: string;
    search?: string;
    first?: number;
    after?: string;
}

/**
 * 分页信息
 * Pagination info
 */
export interface PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
}

/**
 * 分页响应
 * Paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    totalCount: number;
    pageInfo: PageInfo;
}

/**
 * 创建帖子参数
 * Create post parameters
 */
export interface CreatePostParams {
    title: string;
    body: string;
    categoryId: string;
}

/**
 * 创建回复参数
 * Create reply parameters
 */
export interface CreateReplyParams {
    discussionId: string;
    body: string;
    replyToId?: string;
}

/**
 * 论坛用户状态
 * Forum user state
 */
export interface ForumUser {
    id: string;
    login: string;
    avatarUrl: string;
    accessToken: string;
}

/**
 * 认证状态
 * Auth state
 */
export type AuthState =
    | { status: 'loading' }
    | { status: 'authenticated'; user: ForumUser }
    | { status: 'unauthenticated' };
