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

    /**
     * 发布插件到市场
     * @param publishInfo 插件发布信息
     * @param zipPath 插件 ZIP 文件路径（必需）
     * @returns Pull Request URL
     */
    async publishPlugin(publishInfo: PluginPublishInfo, zipPath: string): Promise<string> {
        console.log('[PluginPublishService] Publishing plugin with ZIP:', zipPath);
        console.log('[PluginPublishService] Plugin info:', publishInfo);

        if (!this.githubService.isAuthenticated()) {
            throw new Error('Please login to GitHub first');
        }

        try {
            const { branchName, existingPR } = await this.preparePublishEnvironment(
                publishInfo.pluginMetadata.name,
                publishInfo.version
            );

            const user = this.githubService.getUser()!;
            const pluginId = this.generatePluginId(publishInfo.pluginMetadata.name);

            // 上传 ZIP 文件
            await this.uploadZipFile(user.login, branchName, pluginId, publishInfo, zipPath);

            // 生成并上传 manifest
            this.notifyProgress('creating-manifest', 'Generating manifest.json...', 60);
            const manifest = this.generateManifest(publishInfo, user.login);
            const manifestPath = `plugins/${publishInfo.category}/${pluginId}/manifest.json`;

            await this.uploadManifest(user.login, branchName, manifestPath, manifest, publishInfo);

            // 创建或更新 PR
            return await this.createOrUpdatePR(existingPR, branchName, publishInfo, user.login);
        } catch (error) {
            console.error('[PluginPublishService] Failed to publish plugin:', error);
            throw error;
        }
    }

    private async preparePublishEnvironment(
        pluginName: string,
        version: string
    ): Promise<{ branchName: string; existingPR: { number: number; html_url: string } | null }> {
        const user = this.githubService.getUser();
        if (!user) {
            throw new Error('User information not available');
        }

        this.notifyProgress('checking-fork', 'Checking if fork exists...', 10);

        try {
            await this.githubService.getRepository(user.login, this.REGISTRY_REPO);
            this.notifyProgress('checking-fork', 'Fork already exists', 15);
        } catch {
            this.notifyProgress('creating-fork', 'Creating fork...', 12);
            await this.githubService.forkRepository(this.REGISTRY_OWNER, this.REGISTRY_REPO);
            await this.sleep(3000);
            this.notifyProgress('creating-fork', 'Fork created successfully', 15);
        }

        const branchName = `add-plugin-${pluginName}-v${version}`;
        this.notifyProgress('checking-branch', `Checking if branch '${branchName}' exists...`, 20);

        let branchExists = false;
        let existingPR: { number: number; html_url: string } | null = null;

        try {
            await this.githubService.getBranch(user.login, this.REGISTRY_REPO, branchName);
            branchExists = true;

            const headBranch = `${user.login}:${branchName}`;
            existingPR = await this.githubService.findPullRequestByBranch(
                this.REGISTRY_OWNER,
                this.REGISTRY_REPO,
                headBranch
            );

            if (existingPR) {
                this.notifyProgress(
                    'checking-branch',
                    `Branch and PR already exist, will update existing PR #${existingPR.number}`,
                    30
                );
            } else {
                this.notifyProgress('checking-branch', 'Branch exists, will reuse it', 30);
            }
        } catch {
            this.notifyProgress('checking-branch', 'Branch does not exist, will create new one', 25);
        }

        if (!branchExists) {
            this.notifyProgress('creating-branch', `Creating branch '${branchName}'...`, 27);
            try {
                await this.githubService.createBranch(
                    user.login,
                    this.REGISTRY_REPO,
                    branchName,
                    'main'
                );
                this.notifyProgress('creating-branch', 'Branch created successfully', 30);
            } catch (error) {
                throw new Error(
                    `Failed to create branch: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }

        return { branchName, existingPR };
    }

    private generatePluginId(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    private async uploadZipFile(
        owner: string,
        branch: string,
        pluginId: string,
        publishInfo: PluginPublishInfo,
        zipPath: string
    ): Promise<void> {
        const { TauriAPI } = await import('../api/tauri');
        const base64Zip = await TauriAPI.readFileAsBase64(zipPath);

        this.notifyProgress('uploading-files', 'Uploading plugin ZIP file...', 30);

        const zipFilePath = `plugins/${publishInfo.category}/${pluginId}/versions/${publishInfo.version}.zip`;

        try {
            await this.githubService.createOrUpdateBinaryFile(
                owner,
                this.REGISTRY_REPO,
                zipFilePath,
                base64Zip,
                `Add ${publishInfo.pluginMetadata.displayName} v${publishInfo.version} ZIP`,
                branch
            );
            this.notifyProgress('uploading-files', 'ZIP file uploaded successfully', 55);
        } catch (error) {
            throw new Error(`Failed to upload ZIP: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async getExistingManifest(
        pluginId: string,
        category: 'official' | 'community'
    ): Promise<Record<string, any> | null> {
        try {
            const manifestPath = `plugins/${category}/${pluginId}/manifest.json`;
            const content = await this.githubService.getFileContent(
                this.REGISTRY_OWNER,
                this.REGISTRY_REPO,
                manifestPath,
                'main'
            );
            return JSON.parse(content);
        } catch (error) {
            console.log(`[PluginPublishService] No existing manifest found, will create new one`);
            return null;
        }
    }

    private async uploadManifest(
        owner: string,
        branch: string,
        manifestPath: string,
        manifest: Record<string, unknown>,
        publishInfo: PluginPublishInfo
    ): Promise<void> {
        this.notifyProgress('uploading-files', `Checking for existing manifest...`, 65);

        const pluginId = this.generatePluginId(publishInfo.pluginMetadata.name);
        const existingManifest = await this.getExistingManifest(pluginId, publishInfo.category);

        let finalManifest = manifest;

        if (existingManifest) {
            this.notifyProgress('uploading-files', `Merging with existing manifest...`, 68);
            finalManifest = this.mergeManifestVersions(existingManifest, manifest, publishInfo.version);
        }

        this.notifyProgress('uploading-files', `Uploading manifest to ${manifestPath}...`, 70);

        try {
            await this.githubService.createOrUpdateFile(
                owner,
                this.REGISTRY_REPO,
                manifestPath,
                JSON.stringify(finalManifest, null, 2),
                `Add ${publishInfo.pluginMetadata.displayName} v${publishInfo.version}`,
                branch
            );
            this.notifyProgress('uploading-files', 'Manifest uploaded successfully', 80);
        } catch (error) {
            throw new Error(`Failed to upload manifest: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private mergeManifestVersions(
        existingManifest: Record<string, any>,
        newManifest: Record<string, any>,
        newVersion: string
    ): Record<string, any> {
        const existingVersions: any[] = Array.isArray(existingManifest.versions)
            ? existingManifest.versions
            : [];

        const newVersionInfo = (newManifest.versions as any[])[0];

        const versionExists = existingVersions.some((v: any) => v.version === newVersion);

        let updatedVersions: any[];
        if (versionExists) {
            updatedVersions = existingVersions.map((v: any) =>
                v.version === newVersion ? newVersionInfo : v
            );
        } else {
            updatedVersions = [...existingVersions, newVersionInfo];
        }

        updatedVersions.sort((a: any, b: any) => {
            const [aMajor, aMinor, aPatch] = a.version.split('.').map(Number);
            const [bMajor, bMinor, bPatch] = b.version.split('.').map(Number);

            if (aMajor !== bMajor) return bMajor - aMajor;
            if (aMinor !== bMinor) return bMinor - aMinor;
            return bPatch - aPatch;
        });

        const mergedManifest: any = {
            ...existingManifest,
            ...newManifest,
            latestVersion: updatedVersions[0].version,
            versions: updatedVersions
        };

        delete mergedManifest.version;
        delete mergedManifest.distribution;

        return mergedManifest as Record<string, any>;
    }

    private async createOrUpdatePR(
        existingPR: { number: number; html_url: string } | null,
        branchName: string,
        publishInfo: PluginPublishInfo,
        userLogin: string
    ): Promise<string> {
        let prUrl: string;

        if (existingPR) {
            prUrl = existingPR.html_url;
            this.notifyProgress('complete', `Pull request #${existingPR.number} updated successfully!`, 100);
        } else {
            this.notifyProgress('creating-pr', 'Creating pull request...', 85);

            const prTitle = `Add plugin: ${publishInfo.pluginMetadata.displayName} v${publishInfo.version}`;
            const prBody = this.generatePRDescription(publishInfo);

            try {
                prUrl = await this.githubService.createPullRequest({
                    owner: this.REGISTRY_OWNER,
                    repo: this.REGISTRY_REPO,
                    title: prTitle,
                    body: prBody,
                    head: `${userLogin}:${branchName}`,
                    base: 'main'
                });

                this.notifyProgress('complete', 'Pull request created successfully!', 100);
            } catch (error) {
                throw new Error(
                    `Failed to create pull request: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }

        return prUrl;
    }

    private generateManifest(publishInfo: PluginPublishInfo, githubUsername: string): Record<string, unknown> {
        const { pluginMetadata, version, releaseNotes, repositoryUrl, category, tags, homepage, screenshots, requirements } =
            publishInfo;

        const repoMatch = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!repoMatch || !repoMatch[1] || !repoMatch[2]) {
            throw new Error('Invalid GitHub repository URL');
        }

        const owner = repoMatch[1];
        const repo = repoMatch[2];
        const repoName = repo.replace(/\.git$/, '');

        const pluginId = this.generatePluginId(pluginMetadata.name);

        const zipUrl = `https://cdn.jsdelivr.net/gh/${this.REGISTRY_OWNER}/${this.REGISTRY_REPO}@gh-pages/plugins/${category}/${pluginId}/versions/${version}.zip`;

        const categoryMap: Record<string, string> = {
            'editor': 'Window',
            'tool': 'Tool',
            'inspector': 'Inspector',
            'system': 'System',
            'import-export': 'ImportExport'
        };

        const validCategory = categoryMap[pluginMetadata.category?.toLowerCase() || ''] || 'Tool';

        const versionInfo = {
            version: version,
            releaseDate: new Date().toISOString(),
            changes: releaseNotes || 'No release notes provided',
            zipUrl: zipUrl,
            requirements: requirements || {
                'ecs-version': '>=1.0.0',
                'editor-version': '>=1.0.0'
            }
        };

        return {
            id: pluginId,
            name: pluginMetadata.displayName,
            latestVersion: version,
            versions: [versionInfo],
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

    async deletePlugin(pluginId: string, pluginName: string, category: 'official' | 'community', reason: string, forceRecreate: boolean = false): Promise<string> {
        if (!this.githubService.isAuthenticated()) {
            throw new Error('Please login to GitHub first');
        }

        const user = this.githubService.getUser();
        if (!user) {
            throw new Error('User information not available');
        }

        this.notifyProgress('checking-fork', 'Checking if fork exists...', 5);

        try {
            let forkedRepo: string;

            try {
                await this.githubService.getRepository(user.login, this.REGISTRY_REPO);
                forkedRepo = `${user.login}/${this.REGISTRY_REPO}`;
                this.notifyProgress('checking-fork', 'Fork already exists', 10);
            } catch {
                this.notifyProgress('creating-fork', 'Creating fork...', 7);
                forkedRepo = await this.githubService.forkRepository(this.REGISTRY_OWNER, this.REGISTRY_REPO);
                await this.sleep(3000);
                this.notifyProgress('creating-fork', 'Fork created successfully', 10);
            }

            const branchName = `remove-plugin-${pluginId}`;
            this.notifyProgress('checking-branch', `Checking if branch '${branchName}' exists...`, 15);

            let branchExists = false;
            let existingPR: { number: number; html_url: string } | null = null;

            try {
                await this.githubService.getBranch(user.login, this.REGISTRY_REPO, branchName);
                branchExists = true;

                if (forceRecreate) {
                    this.notifyProgress('checking-branch', 'Deleting old branch to recreate...', 16);
                    await this.githubService.deleteBranch(user.login, this.REGISTRY_REPO, branchName);
                    branchExists = false;
                    this.notifyProgress('checking-branch', 'Old branch deleted', 17);
                } else {
                    const headBranch = `${user.login}:${branchName}`;
                    existingPR = await this.githubService.findPullRequestByBranch(this.REGISTRY_OWNER, this.REGISTRY_REPO, headBranch);

                    if (existingPR) {
                        this.notifyProgress('checking-branch', `Branch and PR already exist, will update existing PR #${existingPR.number}`, 20);
                    } else {
                        this.notifyProgress('checking-branch', 'Branch exists, will reuse it', 20);
                    }
                }
            } catch {
                this.notifyProgress('checking-branch', 'Branch does not exist, will create new one', 18);
            }

            if (!branchExists) {
                this.notifyProgress('creating-branch', `Creating branch '${branchName}' from main repository...`, 19);

                try {
                    const mainRef = await this.githubService.getRef(this.REGISTRY_OWNER, this.REGISTRY_REPO, 'heads/main');
                    await this.githubService.createBranchFromSha(user.login, this.REGISTRY_REPO, branchName, mainRef.object.sha);
                    this.notifyProgress('creating-branch', 'Branch created successfully', 20);
                } catch (error) {
                    throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : String(error)}`);
                }
            }

            this.notifyProgress('uploading-files', 'Collecting plugin files...', 25);

            const pluginPath = `plugins/${category}/${pluginId}`;

            const contents = await this.githubService.getDirectoryContents(
                this.REGISTRY_OWNER,
                this.REGISTRY_REPO,
                pluginPath,
                'main'
            );

            if (contents.length === 0) {
                throw new Error(`Plugin directory not found: ${pluginPath}`);
            }

            const filesToDelete: Array<{ path: string; sha: string }> = [];

            for (const item of contents) {
                if (item.type === 'file') {
                    filesToDelete.push({ path: item.path, sha: item.sha });
                } else if (item.type === 'dir') {
                    const subContents = await this.githubService.getDirectoryContents(
                        this.REGISTRY_OWNER,
                        this.REGISTRY_REPO,
                        item.path,
                        'main'
                    );
                    for (const subItem of subContents) {
                        if (subItem.type === 'file') {
                            filesToDelete.push({ path: subItem.path, sha: subItem.sha });
                        }
                    }
                }
            }

            if (filesToDelete.length === 0) {
                throw new Error(`No files found to delete in ${pluginPath}`);
            }

            console.log(`[PluginPublishService] Files to delete:`, filesToDelete.map(f => f.path));
            this.notifyProgress('uploading-files', `Deleting ${filesToDelete.length} files...`, 40);

            let deletedCount = 0;
            const errors: string[] = [];

            for (const file of filesToDelete) {
                try {
                    console.log(`[PluginPublishService] Deleting file: ${file.path} (SHA: ${file.sha}) from ${user.login}/${this.REGISTRY_REPO}:${branchName}`);
                    await this.githubService.deleteFileWithSha(
                        user.login,
                        this.REGISTRY_REPO,
                        file.path,
                        file.sha,
                        `Remove ${pluginName}`,
                        branchName
                    );
                    deletedCount++;
                    console.log(`[PluginPublishService] Successfully deleted: ${file.path}`);
                    const progress = 40 + Math.floor((deletedCount / filesToDelete.length) * 40);
                    this.notifyProgress('uploading-files', `Deleted ${deletedCount}/${filesToDelete.length} files`, progress);
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    console.error(`[PluginPublishService] Failed to delete ${file.path}:`, errorMsg);
                    errors.push(`${file.path}: ${errorMsg}`);
                }
            }

            if (errors.length > 0) {
                throw new Error(`Failed to delete ${errors.length} file(s):\n${errors.join('\n')}`);
            }

            if (deletedCount === 0) {
                throw new Error('No files were deleted');
            }

            let prUrl: string;

            if (existingPR) {
                prUrl = existingPR.html_url;
                this.notifyProgress('complete', `Pull request #${existingPR.number} updated successfully!`, 100);
            } else {
                this.notifyProgress('creating-pr', 'Creating pull request...', 85);

                const prTitle = `Remove plugin: ${pluginName}`;
                const prBody = `## Plugin Removal Request

### Plugin Information

- **Name**: ${pluginName}
- **ID**: ${pluginId}
- **Category**: ${category}

### Reason for Removal

${reason}

---

**Submitted via ECS Editor Plugin Manager**
`;

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
            console.error('[PluginPublishService] Failed to delete plugin:', error);
            throw error;
        }
    }
}
