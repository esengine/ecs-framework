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
}

export class GitHubService {
    private accessToken: string | null = null;
    private user: GitHubUser | null = null;

    private readonly STORAGE_KEY = 'github-access-token';
    private readonly API_BASE = 'https://api.github.com';
    // GitHub OAuth App Client ID
    // 创建于: https://github.com/settings/developers
    private readonly CLIENT_ID = 'Ov23lianjdTqhHQ8EJkr';

    constructor() {
        this.loadToken();
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
        console.log('[GitHubService] Requesting device code...');
        console.log('[GitHubService] Client ID:', this.CLIENT_ID);

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

            console.log('[GitHubService] Response status:', response.status);
            console.log('[GitHubService] Response ok:', response.ok);

            if (!response.ok) {
                const error = await response.text();
                console.error('[GitHubService] Request device code failed:', error);
                throw new Error(`Failed to request device code (${response.status}): ${error}`);
            }

            const data = (await response.json()) as DeviceCodeResponse;
            console.log('[GitHubService] Device code received:', {
                user_code: data.user_code,
                verification_uri: data.verification_uri
            });

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

    async createBranch(owner: string, repo: string, branch: string, fromBranch: string = 'main'): Promise<void> {
        const refResponse = await this.request<GitHubRef>(`GET /repos/${owner}/${repo}/git/ref/heads/${fromBranch}`);
        const sha = refResponse.object.sha;

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

    async createPullRequest(options: CreatePROptions): Promise<string> {
        const response = await this.request<GitHubPullRequest>(`POST /repos/${options.owner}/${options.repo}/pulls`, {
            title: options.title,
            body: options.body,
            head: options.head,
            base: options.base
        });

        return response.html_url;
    }

    async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
        return await this.request<GitHubRepository>(`GET /repos/${owner}/${repo}`);
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

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
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
                console.log('[GitHubService] Loading stored token...');
                this.accessToken = stored;
                this.fetchUser()
                    .then((user) => {
                        console.log('[GitHubService] User loaded from stored token:', user.login);
                        this.user = user;
                    })
                    .catch((error) => {
                        console.error('[GitHubService] Failed to fetch user with stored token:', error);
                        this.accessToken = null;
                        this.user = null;
                        localStorage.removeItem(this.STORAGE_KEY);
                    });
            } else {
                console.log('[GitHubService] No stored token found');
            }
        } catch (error) {
            console.error('[GitHubService] Failed to load token:', error);
        }
    }

    private saveToken(token: string): void {
        localStorage.setItem(this.STORAGE_KEY, token);
    }
}
