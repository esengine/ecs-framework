import { GitHubService } from './GitHubService';
import type { IEditorPluginMetadata } from '@esengine/editor-core';

export interface PluginPublishInfo {
    pluginMetadata: IEditorPluginMetadata;
    version: string;
    releaseNotes: string;
    repositoryUrl: string;
    category: 'official' | 'community';
    tags?: string[];
    homepage?: string;
    screenshots?: string[];
    requirements?: {
        'ecs-version': string;
        'editor-version'?: string;
    };
}

export type PublishStep =
    | 'checking-fork'
    | 'creating-fork'
    | 'checking-branch'
    | 'creating-branch'
    | 'creating-manifest'
    | 'uploading-files'
    | 'creating-pr'
    | 'complete';

export interface PublishProgress {
    step: PublishStep;
    message: string;
    progress: number; // 0-100
}

export class PluginPublishService {
    private readonly REGISTRY_OWNER = 'esengine';
    private readonly REGISTRY_REPO = 'ecs-editor-plugins';

    private githubService: GitHubService;
    private progressCallback?: (progress: PublishProgress) => void;

    constructor(githubService: GitHubService) {
        this.githubService = githubService;
    }

    setProgressCallback(callback: (progress: PublishProgress) => void): void {
        this.progressCallback = callback;
    }

    private notifyProgress(step: PublishStep, message: string, progress: number): void {
        console.log(`[PluginPublishService] ${message} (${progress}%)`);
        this.progressCallback?.({ step, message, progress });
    }

    async publishPlugin(publishInfo: PluginPublishInfo): Promise<string> {
        if (!this.githubService.isAuthenticated()) {
            throw new Error('Please login to GitHub first');
        }

        const user = this.githubService.getUser();
        if (!user) {
            throw new Error('User information not available');
        }

        this.notifyProgress('checking-fork', 'Checking if fork exists...', 10);

        try {
            // 1. Fork ecs-editor-plugins 仓库（如果还没有 fork）
            let forkedRepo: string;

            try {
                await this.githubService.getRepository(user.login, this.REGISTRY_REPO);
                forkedRepo = `${user.login}/${this.REGISTRY_REPO}`;
                this.notifyProgress('checking-fork', 'Fork already exists', 20);
            } catch {
                this.notifyProgress('creating-fork', 'Creating fork...', 15);
                forkedRepo = await this.githubService.forkRepository(this.REGISTRY_OWNER, this.REGISTRY_REPO);
                // 等待 fork 完成
                await this.sleep(3000);
                this.notifyProgress('creating-fork', 'Fork created successfully', 20);
            }

            // 2. 检查并处理分支
            const branchName = `add-plugin-${publishInfo.pluginMetadata.name}-v${publishInfo.version}`;
            this.notifyProgress('checking-branch', `Checking if branch '${branchName}' exists...`, 25);

            let branchExists = false;
            let existingPR: any = null;

            try {
                await this.githubService.getBranch(user.login, this.REGISTRY_REPO, branchName);
                branchExists = true;

                // 检查是否有对应的 PR
                const headBranch = `${user.login}:${branchName}`;
                existingPR = await this.githubService.findPullRequestByBranch(this.REGISTRY_OWNER, this.REGISTRY_REPO, headBranch);

                if (existingPR) {
                    this.notifyProgress('checking-branch', `Branch and PR already exist, will update existing PR #${existingPR.number}`, 40);
                } else {
                    this.notifyProgress('checking-branch', 'Branch exists but no PR found, will update branch', 40);
                }
            } catch {
                // 分支不存在，需要创建
                this.notifyProgress('checking-branch', 'Branch does not exist, will create new one', 30);
            }

            // 3. 如果分支不存在，创建新分支
            if (!branchExists) {
                this.notifyProgress('creating-branch', `Creating branch '${branchName}'...`, 35);

                try {
                    await this.githubService.createBranch(user.login, this.REGISTRY_REPO, branchName, 'main');
                    this.notifyProgress('creating-branch', 'Branch created successfully', 40);
                } catch (error) {
                    throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            // 4. 生成 manifest.json
            this.notifyProgress('creating-manifest', 'Generating manifest.json...', 55);

            // 生成统一的 pluginId（去除特殊字符）
            const pluginId = publishInfo.pluginMetadata.name
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/^-+|-+$/g, '');

            const manifest = this.generateManifest(publishInfo, user.login);
            const manifestPath = `plugins/${publishInfo.category}/${pluginId}/manifest.json`;
            this.notifyProgress('creating-manifest', 'Manifest generated', 60);

            // 5. 提交 manifest.json
            this.notifyProgress('uploading-files', `Uploading manifest to ${manifestPath}...`, 65);

            try {
                await this.githubService.createOrUpdateFile(
                    user.login,
                    this.REGISTRY_REPO,
                    manifestPath,
                    JSON.stringify(manifest, null, 2),
                    `Add ${publishInfo.pluginMetadata.displayName} v${publishInfo.version}`,
                    branchName
                );
                this.notifyProgress('uploading-files', 'Manifest uploaded successfully', 75);
            } catch (error) {
                throw new Error(`Failed to upload manifest: ${error instanceof Error ? error.message : String(error)}`);
            }

            // 6. 创建或更新 Pull Request
            let prUrl: string;

            if (existingPR) {
                // PR 已存在，直接返回现有 PR 的 URL
                prUrl = existingPR.html_url;
                this.notifyProgress('complete', `Pull request #${existingPR.number} updated successfully!`, 100);
            } else {
                // 创建新的 PR
                this.notifyProgress('creating-pr', 'Creating pull request...', 80);

                const prTitle = `Add plugin: ${publishInfo.pluginMetadata.displayName} v${publishInfo.version}`;
                const prBody = this.generatePRDescription(publishInfo);

                try {
                    prUrl = await this.githubService.createPullRequest({
                        owner: this.REGISTRY_OWNER,
                        repo: this.REGISTRY_REPO,
                        title: prTitle,
                        body: prBody,
                        head: `${user.login}:${branchName}`,
                        base: 'main'
                    });

                    this.notifyProgress('complete', 'Pull request created successfully!', 100);
                } catch (error) {
                    throw new Error(`Failed to create pull request: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            return prUrl;
        } catch (error) {
            console.error('[PluginPublishService] Failed to publish plugin:', error);
            throw error;
        }
    }

    async publishPluginWithZip(publishInfo: PluginPublishInfo, zipPath: string): Promise<string> {
        console.log('[PluginPublishService] Publishing plugin with ZIP:', zipPath);
        console.log('[PluginPublishService] Plugin info:', publishInfo);

        return this.publishPlugin(publishInfo);
    }

    private generateManifest(publishInfo: PluginPublishInfo, githubUsername: string): Record<string, unknown> {
        const { pluginMetadata, version, releaseNotes, repositoryUrl, category, tags, homepage, screenshots, requirements } =
            publishInfo;

        // 解析仓库 URL
        const repoMatch = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!repoMatch || !repoMatch[1] || !repoMatch[2]) {
            throw new Error('Invalid GitHub repository URL');
        }

        const owner = repoMatch[1];
        const repo = repoMatch[2];
        const repoName = repo.replace(/\.git$/, '');

        const pluginId = pluginMetadata.name
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/^-+|-+$/g, '');

        const zipUrl = `https://cdn.jsdelivr.net/gh/${this.REGISTRY_OWNER}/${this.REGISTRY_REPO}@gh-pages/plugins/${category}/${pluginId}/versions/${version}.zip`;

        const categoryMap: Record<string, string> = {
            'editor': 'Window',
            'tool': 'Tool',
            'inspector': 'Inspector',
            'system': 'System',
            'import-export': 'ImportExport'
        };

        const validCategory = categoryMap[pluginMetadata.category?.toLowerCase() || ''] || 'Tool';

        return {
            id: pluginId,
            name: pluginMetadata.displayName,
            version: version,
            author: {
                name: githubUsername,
                github: githubUsername
            },
            description: pluginMetadata.description || 'No description provided',
            category: validCategory,
            repository: {
                type: 'git',
                url: repositoryUrl
            },
            distribution: {
                type: 'cdn',
                url: zipUrl
            },
            requirements: requirements || {
                'ecs-version': '>=1.0.0',
                'editor-version': '>=1.0.0'
            },
            license: 'MIT',
            tags: tags || [],
            icon: pluginMetadata.icon || 'Package',
            homepage: homepage || repositoryUrl,
            screenshots: screenshots || []
        };
    }

    private generatePRDescription(publishInfo: PluginPublishInfo): string {
        const { pluginMetadata, version, releaseNotes, repositoryUrl, category } = publishInfo;

        return `## Plugin Submission

### Plugin Information

- **Name**: ${pluginMetadata.displayName}
- **ID**: ${pluginMetadata.name}
- **Version**: ${version}
- **Category**: ${category}
- **Repository**: ${repositoryUrl}

### Description

${pluginMetadata.description || 'No description provided'}

### Release Notes

${releaseNotes}

### Checklist

- [x] Plugin is built and tested
- [x] Repository is publicly accessible
- [x] Manifest.json is correctly formatted
- [ ] Code has been reviewed for security concerns
- [ ] Plugin follows ECS Editor plugin guidelines

---

**Submitted via ECS Editor Plugin Publisher**
`;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
