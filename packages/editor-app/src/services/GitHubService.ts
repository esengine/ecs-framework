import { open } from '@tauri-apps/plugin-shell';
import { fetch } from '@tauri-apps/plugin-http';

export interface GitHubUser {
    login: string;
    name: string;
    email: string;
    avatar_url: string;
}

export interface CreatePROptions {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
}

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
    error_uri?: string;
}

interface GitHubRef {
    ref: string;
    node_id: string;
    url: string;
    object: {
        sha: string;
        type: string;
        url: string;
    };
}

interface GitHubFileContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: string;
    content: string;
    encoding: string;
}

interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    owner: GitHubUser;
    html_url: string;
    description: string | null;
    fork: boolean;
    url: string;
    default_branch: string;
}

interface GitHubPullRequest {
    id: number;
    number: number;
    state: string;
    title: string;
    body: string | null;
    html_url: string;
    user: GitHubUser;
    created_at: string;
    updated_at: string;
    merged_at: string | null;
    mergeable: boolean | null;
    mergeable_state: string;
    head: {
        ref: string;
        repo: {
            full_name: string;
        } | null;
    };
}

export interface PluginVersion {
    version: string;
    prUrl: string;
    publishedAt: string;
}

export interface PublishedPlugin {
    id: string;
    name: string;
    description: string;
    category: string;
    category_type: string;
    repositoryUrl: string;
    /** 最新版本号 */
    latestVersion: string;
    /** 所有已发布的版本 */
    versions: PluginVersion[];
}

export interface CheckStatus {
    conclusion: 'success' | 'failure' | 'pending' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | null;
    name: string;
    detailsUrl?: string;
    output?: {
        title: string;
        summary: string;
    };
}

interface GitHubCheckRun {
    id: number;
    name: string;
    status: string;
    conclusion: 'success' | 'failure' | 'pending' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | null;
    html_url: string;
    output: {
        title: string;
        summary: string;
    } | null;
}

interface GitHubCheckRunsResponse {
    total_count: number;
    check_runs: GitHubCheckRun[];
}

interface GitHubComment {
    id: number;
    user: {
        login: string;
        avatar_url: string;
    };
    body: string;
    created_at: string;
    html_url: string;
}

interface GitHubReview {
    id: number;
    user: {
        login: string;
        avatar_url: string;
    };
    body: string;
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
    submitted_at: string;
    html_url: string;
}

export interface PRComment {
    id: number;
    user: {
        login: string;
        avatar_url: string;
    };
    body: string;
    created_at: string;
    html_url: string;
}

export interface PRReview {
    id: number;
    user: {
        login: string;
        avatar_url: string;
    };
    body: string;
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
    submitted_at: string;
    html_url: string;
}

export interface PendingReview {
    prNumber: number;
    pluginName: string;
    version: string;
    status: 'open' | 'merged' | 'closed';
    createdAt: string;
    prUrl: string;
    checks?: CheckStatus[];
    comments?: PRComment[];
    reviews?: PRReview[];
    hasConflicts?: boolean;
    conflictFiles?: string[];
    headBranch?: string;
    headRepo?: string;
}

export class GitHubService {
    private accessToken: string | null = null;
    private user: GitHubUser | null = null;
    private retryTimer: number | null = null;
    private isLoadingUser: boolean = false;
    private userLoadStateChangeCallbacks: Set<(isLoading: boolean) => void> = new Set();

    private readonly STORAGE_KEY = 'github-access-token';
    private readonly API_BASE = 'https://api.github.com';
    // GitHub OAuth App Client ID
    // 创建于: https://github.com/settings/developers
    private readonly CLIENT_ID = 'Ov23lianjdTqhHQ8EJkr';

    constructor() {
        this.loadToken();
    }

    isLoadingUserInfo(): boolean {
        return this.isLoadingUser;
    }

    onUserLoadStateChange(callback: (isLoading: boolean) => void): () => void {
        this.userLoadStateChangeCallbacks.add(callback);
        callback(this.isLoadingUser);
        return () => {
            this.userLoadStateChangeCallbacks.delete(callback);
        };
    }

    private notifyUserLoadStateChange(isLoading: boolean): void {
        this.isLoadingUser = isLoading;
        this.userLoadStateChangeCallbacks.forEach((callback) => {
            try {
                callback(isLoading);
            } catch (error) {
                console.error('[GitHubService] Error in user load state change callback:', error);
            }
        });
    }

    isAuthenticated(): boolean {
        return this.accessToken !== null;
    }

    getUser(): GitHubUser | null {
        return this.user;
    }

    async authenticate(token: string): Promise<GitHubUser> {
        this.accessToken = token;

        try {
            const user = await this.fetchUser();
            this.user = user;
            this.saveToken(token);
            return user;
        } catch (error) {
            this.accessToken = null;
            this.user = null;
            throw error;
        }
    }

    logout(): void {
        this.accessToken = null;
        this.user = null;
        localStorage.removeItem(this.STORAGE_KEY);
    }

    async openAuthorizationPage(): Promise<void> {
        const url =
            'https://github.com/settings/tokens/new?scopes=repo,workflow&description=ECS%20Editor%20Plugin%20Publisher';
        await open(url);
    }

    /**
     * 使用 GitHub Device Flow 进行 OAuth 登录
     * 返回设备代码信息，包含用户需要访问的 URL 和输入的代码
     */
    async requestDeviceCode(): Promise<DeviceCodeResponse> {
        try {
            const response = await fetch('https://github.com/login/device/code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    client_id: this.CLIENT_ID,
                    scope: 'repo workflow'
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('[GitHubService] Request device code failed:', error);
                throw new Error(`Failed to request device code (${response.status}): ${error}`);
            }

            const data = (await response.json()) as DeviceCodeResponse;
            return data;
        } catch (error) {
            console.error('[GitHubService] Error requesting device code:', error);
            throw error;
        }
    }

    /**
     * 轮询 GitHub API 检查用户是否完成授权
     * 成功后自动保存 token 和用户信息
     */
    async authenticateWithDeviceFlow(
        deviceCode: string,
        interval: number,
        onProgress?: (status: 'pending' | 'authorized' | 'error') => void
    ): Promise<GitHubUser> {
        const pollInterval = (interval || 5) * 1000;
        let attempts = 0;
        const maxAttempts = 60; // 最多轮询 5 分钟

        while (attempts < maxAttempts) {
            try {
                const response = await fetch('https://github.com/login/oauth/access_token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify({
                        client_id: this.CLIENT_ID,
                        device_code: deviceCode,
                        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                    })
                });

                const data = (await response.json()) as OAuthTokenResponse;

                if (data.error) {
                    if (data.error === 'authorization_pending') {
                        // 用户还未授权，继续等待
                        onProgress?.('pending');
                        await this.sleep(pollInterval);
                        attempts++;
                        continue;
                    } else if (data.error === 'slow_down') {
                        // 轮询太频繁，增加间隔
                        await this.sleep(pollInterval + 5000);
                        attempts++;
                        continue;
                    } else if (data.error === 'expired_token') {
                        throw new Error('Device code expired. Please try again.');
                    } else if (data.error === 'access_denied') {
                        throw new Error('Authorization denied by user.');
                    } else {
                        throw new Error(`OAuth error: ${data.error}`);
                    }
                }

                if (data.access_token) {
                    // 授权成功，保存 token
                    this.accessToken = data.access_token;
                    const user = await this.fetchUser();
                    this.user = user;
                    this.saveToken(data.access_token);
                    onProgress?.('authorized');
                    return user;
                }
            } catch (error) {
                onProgress?.('error');
                throw error;
            }
        }

        throw new Error('Authentication timeout. Please try again.');
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async forkRepository(owner: string, repo: string): Promise<string> {
        const response = await this.request<GitHubRepository>(`POST /repos/${owner}/${repo}/forks`);

        return response.full_name;
    }

    async getRef(owner: string, repo: string, ref: string): Promise<GitHubRef> {
        return await this.request<GitHubRef>(`GET /repos/${owner}/${repo}/git/ref/${ref}`);
    }

    async createBranch(owner: string, repo: string, branch: string, fromBranch: string = 'main'): Promise<void> {
        const refResponse = await this.request<GitHubRef>(`GET /repos/${owner}/${repo}/git/ref/heads/${fromBranch}`);
        const sha = refResponse.object.sha;

        await this.request<GitHubRef>(`POST /repos/${owner}/${repo}/git/refs`, {
            ref: `refs/heads/${branch}`,
            sha: sha
        });
    }

    async createBranchFromSha(owner: string, repo: string, branch: string, sha: string): Promise<void> {
        await this.request<GitHubRef>(`POST /repos/${owner}/${repo}/git/refs`, {
            ref: `refs/heads/${branch}`,
            sha: sha
        });
    }

    async getBranch(owner: string, repo: string, branch: string): Promise<GitHubRef> {
        return await this.request<GitHubRef>(`GET /repos/${owner}/${repo}/git/ref/heads/${branch}`);
    }

    async deleteBranch(owner: string, repo: string, branch: string): Promise<void> {
        await this.request<void>(`DELETE /repos/${owner}/${repo}/git/refs/heads/${branch}`);
    }

    async createOrUpdateFile(
        owner: string,
        repo: string,
        path: string,
        content: string,
        message: string,
        branch: string
    ): Promise<void> {
        let sha: string | undefined;

        try {
            const existing = await this.request<GitHubFileContent>(`GET /repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
            sha = existing.sha;
        } catch {
            // 文件不存在
        }

        // GitHub API 要求内容为 base64 编码
        const utf8Bytes = new TextEncoder().encode(content);
        let binaryString = '';
        for (let i = 0; i < utf8Bytes.length; i++) {
            binaryString += String.fromCharCode(utf8Bytes[i]!);
        }
        const base64Content = btoa(binaryString);

        const body: Record<string, string> = {
            message: message,
            content: base64Content,
            branch: branch
        };

        if (sha) {
            body.sha = sha;
        }

        await this.request<GitHubFileContent>(`PUT /repos/${owner}/${repo}/contents/${path}`, body);
    }

    async createOrUpdateBinaryFile(
        owner: string,
        repo: string,
        path: string,
        base64Content: string,
        message: string,
        branch: string
    ): Promise<void> {
        let sha: string | undefined;

        try {
            const existing = await this.request<GitHubFileContent>(`GET /repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
            sha = existing.sha;
        } catch {
            // 文件不存在
        }

        const body: Record<string, string> = {
            message: message,
            content: base64Content,
            branch: branch
        };

        if (sha) {
            body.sha = sha;
        }

        await this.request<GitHubFileContent>(`PUT /repos/${owner}/${repo}/contents/${path}`, body);
    }

    async getDirectoryContents(owner: string, repo: string, path: string, branch: string = 'main'): Promise<GitHubFileContent[]> {
        try {
            const response = await this.request<GitHubFileContent | GitHubFileContent[]>(
                `GET /repos/${owner}/${repo}/contents/${path}?ref=${branch}`
            );
            return Array.isArray(response) ? response : [response];
        } catch {
            return [];
        }
    }

    async getFileContent(owner: string, repo: string, path: string, branch: string = 'main'): Promise<string> {
        const response = await this.request<GitHubFileContent>(
            `GET /repos/${owner}/${repo}/contents/${path}?ref=${branch}`
        );

        if (!response.content) {
            throw new Error(`File ${path} does not have content`);
        }

        return atob(response.content.replace(/\n/g, ''));
    }

    async deleteFile(owner: string, repo: string, path: string, message: string, branch: string): Promise<void> {
        const existing = await this.request<GitHubFileContent>(`GET /repos/${owner}/${repo}/contents/${path}?ref=${branch}`);

        if (!existing || !existing.sha) {
            throw new Error(`Failed to get file SHA for ${path}`);
        }

        await this.request<void>(`DELETE /repos/${owner}/${repo}/contents/${path}`, {
            message: message,
            sha: existing.sha,
            branch: branch
        });
    }

    async deleteFileWithSha(owner: string, repo: string, path: string, sha: string, message: string, branch: string): Promise<void> {
        await this.request<void>(`DELETE /repos/${owner}/${repo}/contents/${path}`, {
            message: message,
            sha: sha,
            branch: branch
        });
    }

    async createPullRequest(options: CreatePROptions): Promise<string> {
        const response = await this.request<GitHubPullRequest>(`POST /repos/${options.owner}/${options.repo}/pulls`, {
            title: options.title,
            body: options.body,
            head: options.head,
            base: options.base
        });

        return response.html_url;
    }

    async findPullRequestByBranch(owner: string, repo: string, headBranch: string): Promise<GitHubPullRequest | null> {
        try {
            const response = await this.request<GitHubPullRequest[]>(`GET /repos/${owner}/${repo}/pulls`, {
                head: headBranch,
                state: 'open'
            });

            return response.length > 0 && response[0] ? response[0] : null;
        } catch {
            return null;
        }
    }

    async closePullRequest(owner: string, repo: string, pullNumber: number): Promise<void> {
        await this.request<GitHubPullRequest>(`PATCH /repos/${owner}/${repo}/pulls/${pullNumber}`, {
            state: 'closed'
        });
    }

    async updatePRBranch(owner: string, repo: string, prNumber: number): Promise<void> {
        await this.request<any>(`PUT /repos/${owner}/${repo}/pulls/${prNumber}/update-branch`, {
            expected_head_sha: undefined
        });
    }

    async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
        return await this.request<GitHubRepository>(`GET /repos/${owner}/${repo}`);
    }

    async getUserPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all'): Promise<GitHubPullRequest[]> {
        if (!this.user) {
            throw new Error('User not authenticated');
        }

        const prs = await this.request<GitHubPullRequest[]>(`GET /repos/${owner}/${repo}/pulls?state=${state}&per_page=100`);

        return prs.filter((pr) => pr.user.login === this.user!.login);
    }

    async getPublishedPlugins(): Promise<PublishedPlugin[]> {
        try {
            const prs = await this.getUserPullRequests('esengine', 'ecs-editor-plugins', 'closed');
            const mergedPRs = prs.filter((pr) => pr.merged_at !== null);

            // 存储已删除的插件
            const deletedPlugins = new Map<string, Date>();
            // 按插件 ID 分组的版本信息
            const pluginVersionsMap = new Map<string, {
                id: string;
                name: string;
                description: string;
                category: string;
                category_type: string;
                repositoryUrl: string;
                versions: PluginVersion[];
            }>();

            // 第一遍：收集已删除的插件
            for (const pr of mergedPRs) {
                const removeMatch = pr.title.match(/Remove plugin: (.+)/);
                if (removeMatch && removeMatch[1] && pr.merged_at) {
                    const pluginName = removeMatch[1];
                    const mergedDate = new Date(pr.merged_at);
                    deletedPlugins.set(pluginName, mergedDate);
                }
            }

            // 第二遍：收集所有版本信息
            for (const pr of mergedPRs) {
                const match = pr.title.match(/Add plugin: (.+) v([\d.]+)/);
                if (match && match[1] && match[2]) {
                    const pluginName = match[1];
                    const version = match[2];

                    // 检查插件是否已被删除
                    const deletedDate = deletedPlugins.get(pluginName);
                    if (deletedDate && pr.merged_at) {
                        const addedDate = new Date(pr.merged_at);
                        if (deletedDate > addedDate) {
                            continue;
                        }
                    }

                    // 提取插件信息
                    const repoMatch = pr.body?.match(/\*\*Repository\*\*: (.+)/);
                    const repositoryUrl = repoMatch?.[1] || '';

                    const categoryMatch = pr.body?.match(/\*\*Category\*\*: (.+)/);
                    const category = categoryMatch?.[1] || 'community';

                    const descMatch = pr.body?.match(/### Description\n\n(.+)\n/);
                    const description = descMatch?.[1] || '';

                    const branchName = pr.head.ref;
                    const idMatch = branchName.match(/add-plugin-(.+)-v/);
                    const rawId = idMatch?.[1] || pluginName.toLowerCase().replace(/\s+/g, '-');

                    const id = rawId
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')
                        .replace(/^-+|-+$/g, '');

                    const categoryType = id.startsWith('esengine-') ? 'official' : 'community';

                    // 获取或创建插件记录
                    if (!pluginVersionsMap.has(id)) {
                        pluginVersionsMap.set(id, {
                            id,
                            name: pluginName,
                            description,
                            category,
                            category_type: categoryType,
                            repositoryUrl,
                            versions: []
                        });
                    }

                    // 添加版本信息
                    const pluginData = pluginVersionsMap.get(id)!;
                    pluginData.versions.push({
                        version,
                        prUrl: pr.html_url,
                        publishedAt: pr.merged_at || pr.created_at
                    });
                }
            }

            // 转换为最终结果，并对版本排序
            const plugins: PublishedPlugin[] = Array.from(pluginVersionsMap.values()).map((plugin) => {
                // 按版本号降序排序（最新版本在前）
                const sortedVersions = plugin.versions.sort((a, b) => {
                    const parseVersion = (v: string) => {
                        const parts = v.split('.').map(Number);
                        return (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
                    };
                    return parseVersion(b.version) - parseVersion(a.version);
                });

                return {
                    ...plugin,
                    latestVersion: sortedVersions[0]?.version || '0.0.0',
                    versions: sortedVersions
                };
            });

            return plugins;
        } catch (error) {
            console.error('[GitHubService] Failed to fetch published plugins:', error);
            return [];
        }
    }

    async getPRCheckStatus(owner: string, repo: string, prNumber: number): Promise<CheckStatus[]> {
        try {
            const pr = await this.request<GitHubPullRequest>(`GET /repos/${owner}/${repo}/pulls/${prNumber}`);

            if (!pr.head.repo) {
                return [];
            }

            const headRepoOwner = pr.head.repo.full_name.split('/')[0];
            if (!headRepoOwner) {
                return [];
            }

            const checkRuns = await this.request<GitHubCheckRunsResponse>(
                `GET /repos/${headRepoOwner}/${repo}/commits/${pr.head.ref}/check-runs`
            );

            return checkRuns.check_runs.map((run) => ({
                conclusion: run.conclusion,
                name: run.name,
                detailsUrl: run.html_url,
                output: run.output
                    ? {
                        title: run.output.title || '',
                        summary: run.output.summary || ''
                    }
                    : undefined
            }));
        } catch (error) {
            console.error('[GitHubService] Failed to fetch PR check status:', error);
            return [];
        }
    }

    async getPRComments(owner: string, repo: string, prNumber: number): Promise<PRComment[]> {
        try {
            const comments = await this.request<GitHubComment[]>(
                `GET /repos/${owner}/${repo}/issues/${prNumber}/comments`
            );
            return comments.map((comment) => ({
                id: comment.id,
                user: {
                    login: comment.user.login,
                    avatar_url: comment.user.avatar_url
                },
                body: comment.body,
                created_at: comment.created_at,
                html_url: comment.html_url
            }));
        } catch (error) {
            console.error('[GitHubService] Failed to fetch PR comments:', error);
            return [];
        }
    }

    async getPRReviews(owner: string, repo: string, prNumber: number): Promise<PRReview[]> {
        try {
            const reviews = await this.request<GitHubReview[]>(
                `GET /repos/${owner}/${repo}/pulls/${prNumber}/reviews`
            );
            return reviews
                .filter((review) => review.body && review.body.trim())
                .map((review) => ({
                    id: review.id,
                    user: {
                        login: review.user.login,
                        avatar_url: review.user.avatar_url
                    },
                    body: review.body,
                    state: review.state,
                    submitted_at: review.submitted_at,
                    html_url: review.html_url
                }));
        } catch (error) {
            console.error('[GitHubService] Failed to fetch PR reviews:', error);
            return [];
        }
    }

    async getPRConflictFiles(owner: string, repo: string, prNumber: number): Promise<{ hasConflicts: boolean; conflictFiles: string[] }> {
        try {
            const pr = await this.request<GitHubPullRequest>(`GET /repos/${owner}/${repo}/pulls/${prNumber}`);

            const hasConflicts = pr.mergeable === false || pr.mergeable_state === 'dirty' || pr.mergeable_state === 'conflicts';

            if (!hasConflicts) {
                return { hasConflicts: false, conflictFiles: [] };
            }

            const files = await this.request<any[]>(`GET /repos/${owner}/${repo}/pulls/${prNumber}/files`);
            const conflictFiles = files
                .filter((file) => file.status === 'modified' || file.status === 'added' || file.status === 'deleted')
                .map((file) => file.filename);

            return {
                hasConflicts: true,
                conflictFiles
            };
        } catch (error) {
            console.error('[GitHubService] Failed to fetch PR conflict files:', error);
            return { hasConflicts: false, conflictFiles: [] };
        }
    }

    async getPendingReviews(): Promise<PendingReview[]> {
        try {
            const prs = await this.getUserPullRequests('esengine', 'ecs-editor-plugins', 'all');

            const reviewsWithDetails = await Promise.all(
                prs.map(async (pr) => {
                    let pluginName = 'Unknown Plugin';
                    let version = '0.0.0';

                    const addMatch = pr.title.match(/Add plugin: (.+) v([\d.]+)/);
                    const removeMatch = pr.title.match(/Remove plugin: (.+)/);

                    if (addMatch && addMatch[1] && addMatch[2]) {
                        pluginName = addMatch[1];
                        version = addMatch[2];
                    } else if (removeMatch && removeMatch[1]) {
                        pluginName = removeMatch[1];
                        version = '(删除请求)';
                    }

                    let checks: CheckStatus[] = [];
                    let comments: PRComment[] = [];
                    let reviews: PRReview[] = [];
                    let hasConflicts = false;
                    let conflictFiles: string[] = [];

                    if (pr.state === 'open') {
                        const results = await Promise.all([
                            this.getPRCheckStatus('esengine', 'ecs-editor-plugins', pr.number),
                            this.getPRComments('esengine', 'ecs-editor-plugins', pr.number),
                            this.getPRReviews('esengine', 'ecs-editor-plugins', pr.number),
                            this.getPRConflictFiles('esengine', 'ecs-editor-plugins', pr.number)
                        ]);

                        checks = results[0];
                        comments = results[1];
                        reviews = results[2];
                        hasConflicts = results[3].hasConflicts;
                        conflictFiles = results[3].conflictFiles;
                    }

                    const status: 'open' | 'merged' | 'closed' = pr.merged_at
                        ? 'merged'
                        : (pr.state as 'open' | 'closed');

                    return {
                        prNumber: pr.number,
                        pluginName,
                        version,
                        status,
                        createdAt: pr.created_at,
                        prUrl: pr.html_url,
                        checks,
                        comments,
                        reviews,
                        hasConflicts,
                        conflictFiles,
                        headBranch: pr.head.ref,
                        headRepo: pr.head.repo?.full_name
                    };
                })
            );

            return reviewsWithDetails;
        } catch (error) {
            console.error('[GitHubService] Failed to fetch pending reviews:', error);
            return [];
        }
    }

    private async fetchUser(): Promise<GitHubUser> {
        return await this.request<GitHubUser>('GET /user');
    }

    private async request<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        const [method, path] = endpoint.split(' ');
        const url = `${this.API_BASE}${path}`;

        const options: RequestInit = {
            method: method,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            }
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GitHub API error: ${response.status} - ${error}`);
        }

        if (response.status === 204) {
            return null as T;
        }

        return (await response.json()) as T;
    }

    private loadToken(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.accessToken = stored;
                this.notifyUserLoadStateChange(true);
                this.fetchUser()
                    .then((user) => {
                        this.user = user;
                        if (this.retryTimer) {
                            clearTimeout(this.retryTimer);
                            this.retryTimer = null;
                        }
                        this.notifyUserLoadStateChange(false);
                    })
                    .catch((error) => {
                        console.error('[GitHubService] Failed to fetch user with stored token:', error);

                        const errorMessage = error instanceof Error ? error.message : String(error);
                        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                            this.accessToken = null;
                            this.user = null;
                            localStorage.removeItem(this.STORAGE_KEY);
                            this.notifyUserLoadStateChange(false);
                        } else {
                            this.scheduleRetryLoadUser();
                        }
                    });
            }
        } catch (error) {
            console.error('[GitHubService] Failed to load token:', error);
            this.notifyUserLoadStateChange(false);
        }
    }

    private scheduleRetryLoadUser(): void {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
        }

        this.retryTimer = window.setTimeout(() => {
            if (this.accessToken && !this.user) {
                this.fetchUser()
                    .then((user) => {
                        this.user = user;
                        this.retryTimer = null;
                        this.notifyUserLoadStateChange(false);
                    })
                    .catch((error) => {
                        console.error('[GitHubService] Retry failed:', error);
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                            this.accessToken = null;
                            this.user = null;
                            localStorage.removeItem(this.STORAGE_KEY);
                            this.notifyUserLoadStateChange(false);
                        } else {
                            this.retryTimer = window.setTimeout(() => this.scheduleRetryLoadUser(), 10000);
                        }
                    });
            }
        }, 5000);
    }

    private saveToken(token: string): void {
        localStorage.setItem(this.STORAGE_KEY, token);
    }
}
