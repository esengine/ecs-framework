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
}

export type PublishStep =
    | 'checking-fork'
    | 'creating-fork'
    | 'checking-branch'
    | 'deleting-old-branch'
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

            try {
                // 尝试获取分支，如果存在则删除
                await this.githubService.getBranch(user.login, this.REGISTRY_REPO, branchName);

                this.notifyProgress('deleting-old-branch', `Branch already exists, deleting old branch...`, 30);
                await this.githubService.deleteBranch(user.login, this.REGISTRY_REPO, branchName);
                this.notifyProgress('deleting-old-branch', 'Old branch deleted', 35);
            } catch {
                // 分支不存在，这是好的
                this.notifyProgress('checking-branch', 'Branch does not exist, will create new one', 35);
            }

            // 3. 创建新分支
            this.notifyProgress('creating-branch', `Creating branch '${branchName}'...`, 40);

            try {
                await this.githubService.createBranch(user.login, this.REGISTRY_REPO, branchName, 'main');
                this.notifyProgress('creating-branch', 'Branch created successfully', 50);
            } catch (error) {
                throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : String(error)}`);
            }

            // 4. 生成 manifest.json
            this.notifyProgress('creating-manifest', 'Generating manifest.json...', 55);
            const manifest = this.generateManifest(publishInfo, user.login);
            const manifestPath = `plugins/${publishInfo.category}/${publishInfo.pluginMetadata.name}/manifest.json`;
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

            // 6. 创建 Pull Request
            this.notifyProgress('creating-pr', 'Creating pull request...', 80);

            const prTitle = `Add plugin: ${publishInfo.pluginMetadata.displayName} v${publishInfo.version}`;
            const prBody = this.generatePRDescription(publishInfo);

            try {
                const prUrl = await this.githubService.createPullRequest({
                    owner: this.REGISTRY_OWNER,
                    repo: this.REGISTRY_REPO,
                    title: prTitle,
                    body: prBody,
                    head: `${user.login}:${branchName}`,
                    base: 'main'
                });

                this.notifyProgress('complete', 'Pull request created successfully!', 100);
                return prUrl;
            } catch (error) {
                throw new Error(`Failed to create pull request: ${error instanceof Error ? error.message : String(error)}`);
            }
        } catch (error) {
            console.error('[PluginPublishService] Failed to publish plugin:', error);
            throw error;
        }
    }

    async publishPluginWithZip(publishInfo: PluginPublishInfo, pluginFolder: string): Promise<string> {
        // TODO: Implement ZIP upload functionality
        // This will:
        // 1. Build the plugin in pluginFolder
        // 2. Package dist/ as ZIP
        // 3. Upload ZIP to GitHub Release or repository
        // 4. Create manifest.json pointing to the ZIP
        // 5. Create PR with the manifest

        console.log('[PluginPublishService] publishPluginWithZip not yet implemented');
        console.log(`[PluginPublishService] Plugin folder: ${pluginFolder}`);

        // For now, use the existing publishPlugin method
        return this.publishPlugin(publishInfo);
    }

    private generateManifest(publishInfo: PluginPublishInfo, githubUsername: string): Record<string, unknown> {
        const { pluginMetadata, version, releaseNotes, repositoryUrl, category, tags, homepage, screenshots } =
            publishInfo;

        // 解析仓库 URL
        const repoMatch = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!repoMatch || !repoMatch[1] || !repoMatch[2]) {
            throw new Error('Invalid GitHub repository URL');
        }

        const owner = repoMatch[1];
        const repo = repoMatch[2];
        const repoName = repo.replace(/\.git$/, '');

        const zipUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repoName}@${version}/dist/index.zip`;

        return {
            id: pluginMetadata.name,
            name: pluginMetadata.displayName,
            author: {
                name: githubUsername,
                github: githubUsername
            },
            description: pluginMetadata.description || '',
            category: pluginMetadata.category,
            tags: tags || [],
            icon: pluginMetadata.icon || 'Package',
            repository: {
                type: 'github',
                url: repositoryUrl
            },
            license: 'MIT',
            homepage: homepage || repositoryUrl,
            screenshots: screenshots || [],
            versions: [
                {
                    version: version,
                    releaseDate: new Date().toISOString().split('T')[0],
                    changes: releaseNotes,
                    zipUrl: zipUrl,
                    requirements: {
                        'ecs-version': '>=2.0.0',
                        'editor-version': '>=1.0.0'
                    }
                }
            ],
            latest: version
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
