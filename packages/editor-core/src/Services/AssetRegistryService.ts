/**
 * Asset Registry Service
 * 资产注册表服务
 *
 * 负责扫描项目资产目录，为每个资产生成唯一GUID，
 * 并维护 GUID ↔ 路径 的映射关系。
 * 使用 .meta 文件持久化存储每个资产的 GUID。
 *
 * Responsible for scanning project asset directories,
 * generating unique GUIDs for each asset, and maintaining
 * GUID ↔ path mappings.
 * Uses .meta files to persistently store each asset's GUID.
 */

import { Core, createLogger, PlatformDetector } from '@esengine/ecs-framework';
import { MessageHub } from './MessageHub';
import {
    AssetMetaManager,
    IAssetMeta,
    IMetaFileSystem,
    inferAssetType
} from '@esengine/asset-system-editor';
import type { IFileSystem, FileEntry } from './IFileSystem';
import { IFileSystemService } from './IFileSystem';

// Logger for AssetRegistry using core's logger
const logger = createLogger('AssetRegistry');

/**
 * Asset GUID type (simplified, no dependency on asset-system)
 */
export type AssetGUID = string;

/**
 * Asset type for registry (using different name to avoid conflict)
 */
export type AssetRegistryType = string;

/**
 * Asset metadata (simplified)
 */
export interface IAssetRegistryMetadata {
    guid: AssetGUID;
    path: string;
    type: AssetRegistryType;
    name: string;
    size: number;
    hash: string;
    lastModified: number;
}

/**
 * Asset catalog entry for export
 */
export interface IAssetRegistryCatalogEntry {
    guid: AssetGUID;
    path: string;
    type: AssetRegistryType;
    size: number;
    hash: string;
}

/**
 * Asset file info from filesystem scan
 */
export interface AssetFileInfo {
    /** Absolute path to the file */
    absolutePath: string;
    /** Path relative to project root */
    relativePath: string;
    /** File name without extension */
    name: string;
    /** File extension (e.g., '.png', '.btree') */
    extension: string;
    /** File size in bytes */
    size: number;
    /** Last modified timestamp */
    lastModified: number;
}

/**
 * Asset registry manifest stored in project
 * 存储在项目中的资产注册表清单
 */
export interface AssetManifest {
    version: string;
    createdAt: number;
    updatedAt: number;
    assets: Record<string, AssetManifestEntry>;
}

/**
 * Single asset entry in manifest
 */
export interface AssetManifestEntry {
    guid: AssetGUID;
    relativePath: string;
    type: AssetRegistryType;
    hash?: string;
}

/**
 * Extension to asset type mapping
 */
const EXTENSION_TYPE_MAP: Record<string, AssetRegistryType> = {
    // Textures
    '.png': 'texture',
    '.jpg': 'texture',
    '.jpeg': 'texture',
    '.webp': 'texture',
    '.gif': 'texture',
    // Audio
    '.mp3': 'audio',
    '.ogg': 'audio',
    '.wav': 'audio',
    // Data
    '.json': 'json',
    '.txt': 'text',
    // Scripts
    '.ts': 'script',
    '.js': 'script',
    // Custom types
    '.btree': 'btree',
    '.ecs': 'scene',
    '.prefab': 'prefab',
    '.tmx': 'tilemap',
    '.tsx': 'tileset',
};

// 使用从 IFileSystem.ts 导入的标准接口
// Using standard interface imported from IFileSystem.ts

/**
 * Simple in-memory asset database
 */
class SimpleAssetDatabase {
    private readonly _metadata = new Map<AssetGUID, IAssetRegistryMetadata>();
    private readonly _pathToGuid = new Map<string, AssetGUID>();
    private readonly _typeToGuids = new Map<AssetRegistryType, Set<AssetGUID>>();

    addAsset(metadata: IAssetRegistryMetadata): void {
        const { guid, type } = metadata;
        // Normalize path separators for consistent storage
        const normalizedPath = metadata.path.replace(/\\/g, '/');
        const normalizedMetadata = { ...metadata, path: normalizedPath };

        this._metadata.set(guid, normalizedMetadata);
        this._pathToGuid.set(normalizedPath, guid);

        if (!this._typeToGuids.has(type)) {
            this._typeToGuids.set(type, new Set());
        }
        this._typeToGuids.get(type)!.add(guid);
    }

    removeAsset(guid: AssetGUID): void {
        const metadata = this._metadata.get(guid);
        if (!metadata) return;

        this._metadata.delete(guid);
        // Path is already normalized when stored
        this._pathToGuid.delete(metadata.path);

        const typeSet = this._typeToGuids.get(metadata.type);
        if (typeSet) {
            typeSet.delete(guid);
        }
    }

    getMetadata(guid: AssetGUID): IAssetRegistryMetadata | undefined {
        return this._metadata.get(guid);
    }

    getMetadataByPath(path: string): IAssetRegistryMetadata | undefined {
        // Normalize path separators for consistent lookup
        const normalizedPath = path.replace(/\\/g, '/');
        const guid = this._pathToGuid.get(normalizedPath);
        return guid ? this._metadata.get(guid) : undefined;
    }

    findAssetsByType(type: AssetRegistryType): AssetGUID[] {
        const guids = this._typeToGuids.get(type);
        return guids ? Array.from(guids) : [];
    }

    exportToCatalog(): IAssetRegistryCatalogEntry[] {
        const entries: IAssetRegistryCatalogEntry[] = [];
        this._metadata.forEach((metadata) => {
            entries.push({
                guid: metadata.guid,
                path: metadata.path,
                type: metadata.type,
                size: metadata.size,
                hash: metadata.hash
            });
        });
        return entries;
    }

    getStatistics(): { totalAssets: number } {
        return { totalAssets: this._metadata.size };
    }

    clear(): void {
        this._metadata.clear();
        this._pathToGuid.clear();
        this._typeToGuids.clear();
    }
}

/**
 * Asset Registry Service
 */
export class AssetRegistryService {
    private _database: SimpleAssetDatabase;
    private _projectPath: string | null = null;
    private _manifest: AssetManifest | null = null;
    private _fileSystem: IFileSystem | null = null;
    private _messageHub: MessageHub | null = null;
    private _initialized = false;

    /** Asset meta manager for .meta file management */
    private _metaManager: AssetMetaManager;

    /** Tauri event unlisten function | Tauri 事件取消监听函数 */
    private _eventUnlisten: (() => void) | undefined;

    /** Manifest file name */
    static readonly MANIFEST_FILE = 'asset-manifest.json';
    /** Current manifest version */
    static readonly MANIFEST_VERSION = '1.0.0';

    constructor() {
        this._database = new SimpleAssetDatabase();
        this._metaManager = new AssetMetaManager();
    }

    /**
     * Get the AssetMetaManager instance
     * 获取 AssetMetaManager 实例
     */
    get metaManager(): AssetMetaManager {
        return this._metaManager;
    }

    /**
     * Initialize the service
     */
    async initialize(): Promise<void> {
        if (this._initialized) return;

        // Get file system service using the exported Symbol
        // 使用导出的 Symbol 获取文件系统服务
        this._fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;

        // Get message hub
        this._messageHub = Core.services.tryResolve(MessageHub) as MessageHub | null;

        // Subscribe to project events
        if (this._messageHub) {
            this._messageHub.subscribe('project:opened', this._onProjectOpened.bind(this));
            this._messageHub.subscribe('project:closed', this._onProjectClosed.bind(this));
        } else {
            logger.warn('MessageHub not available, cannot subscribe to project events');
        }

        this._initialized = true;
    }

    /**
     * Handle project opened event
     */
    private async _onProjectOpened(data: { path: string }): Promise<void> {
        await this.loadProject(data.path);
    }

    /**
     * Handle project closed event
     */
    private _onProjectClosed(): void {
        this.unloadProject();
    }

    /**
     * Load project and scan assets
     */
    async loadProject(projectPath: string): Promise<void> {
        if (!this._fileSystem) {
            logger.warn('FileSystem service not available, skipping asset registry');
            return;
        }

        this._projectPath = projectPath;
        this._database.clear();
        this._metaManager.clear();

        // Setup MetaManager with file system adapter
        // 设置 MetaManager 的文件系统适配器
        const metaFs: IMetaFileSystem = {
            exists: (path: string) => this._fileSystem!.exists(path),
            readText: (path: string) => this._fileSystem!.readFile(path),
            writeText: (path: string, content: string) => this._fileSystem!.writeFile(path, content),
            delete: async (path: string) => {
                // Try to delete using deleteFile
                // 尝试使用 deleteFile 删除
                try {
                    await this._fileSystem!.deleteFile(path);
                } catch {
                    // Ignore delete errors
                }
            }
        };
        this._metaManager.setFileSystem(metaFs);

        // Try to load existing manifest (for backward compatibility)
        await this._loadManifest();

        // Scan assets directory (now uses .meta files)
        await this._scanAssetsDirectory();

        // Save updated manifest
        await this._saveManifest();

        // Subscribe to file change events (Tauri only)
        // 订阅文件变化事件（仅 Tauri 环境）
        await this._subscribeToFileChanges();

        logger.info(`Project assets loaded: ${this._database.getStatistics().totalAssets} assets`);

        // Publish event
        this._messageHub?.publish('assets:registry:loaded', {
            projectPath,
            assetCount: this._database.getStatistics().totalAssets
        });
    }

    /**
     * Subscribe to file change events from Tauri backend
     * 订阅来自 Tauri 后端的文件变化事件
     */
    private async _subscribeToFileChanges(): Promise<void> {
        // Only in Tauri environment
        // 仅在 Tauri 环境中
        if (!PlatformDetector.isTauriEnvironment()) {
            return;
        }

        try {
            const { listen } = await import('@tauri-apps/api/event');

            // Listen to user-code:file-changed event
            // 监听 user-code:file-changed 事件
            this._eventUnlisten = await listen<{
                changeType: string;
                paths: string[];
            }>('user-code:file-changed', async (event) => {
                const { changeType, paths } = event.payload;

                logger.debug('File change event received | 收到文件变化事件', { changeType, paths });

                // Handle file creation - register new assets and generate .meta
                // 处理文件创建 - 注册新资产并生成 .meta
                if (changeType === 'create' || changeType === 'modify') {
                    for (const absolutePath of paths) {
                        // Skip .meta files
                        if (absolutePath.endsWith('.meta')) continue;

                        // Register or refresh the asset
                        await this.registerAsset(absolutePath);
                    }
                } else if (changeType === 'remove') {
                    for (const absolutePath of paths) {
                        // Skip .meta files
                        if (absolutePath.endsWith('.meta')) continue;

                        // Unregister the asset
                        await this.unregisterAsset(absolutePath);
                    }
                }
            });

            logger.info('Subscribed to file change events | 已订阅文件变化事件');
        } catch (error) {
            logger.warn('Failed to subscribe to file change events | 订阅文件变化事件失败:', error);
        }
    }

    /**
     * Unsubscribe from file change events
     * 取消订阅文件变化事件
     */
    private _unsubscribeFromFileChanges(): void {
        if (this._eventUnlisten) {
            this._eventUnlisten();
            this._eventUnlisten = undefined;
            logger.debug('Unsubscribed from file change events | 已取消订阅文件变化事件');
        }
    }

    /**
     * Unload current project
     */
    unloadProject(): void {
        // Unsubscribe from file change events
        // 取消订阅文件变化事件
        this._unsubscribeFromFileChanges();

        this._projectPath = null;
        this._manifest = null;
        this._database.clear();
        logger.info('Project assets unloaded');
    }

    /**
     * Load manifest from project
     */
    private async _loadManifest(): Promise<void> {
        if (!this._fileSystem || !this._projectPath) return;

        const manifestPath = this._getManifestPath();

        try {
            const exists = await this._fileSystem.exists(manifestPath);
            if (exists) {
                const content = await this._fileSystem.readFile(manifestPath);
                this._manifest = JSON.parse(content);
                logger.debug('Loaded existing asset manifest');
            } else {
                this._manifest = this._createEmptyManifest();
                logger.debug('Created new asset manifest');
            }
        } catch (error) {
            logger.warn('Failed to load manifest, creating new one:', error);
            this._manifest = this._createEmptyManifest();
        }
    }

    /**
     * Save manifest to project
     */
    private async _saveManifest(): Promise<void> {
        if (!this._fileSystem || !this._projectPath || !this._manifest) return;

        const manifestPath = this._getManifestPath();
        this._manifest.updatedAt = Date.now();

        try {
            const content = JSON.stringify(this._manifest, null, 2);
            await this._fileSystem.writeFile(manifestPath, content);
            logger.debug('Saved asset manifest');
        } catch (error) {
            logger.error('Failed to save manifest:', error);
        }
    }

    /**
     * Get manifest file path
     */
    private _getManifestPath(): string {
        const sep = this._projectPath!.includes('\\') ? '\\' : '/';
        return `${this._projectPath}${sep}${AssetRegistryService.MANIFEST_FILE}`;
    }

    /**
     * Create empty manifest
     */
    private _createEmptyManifest(): AssetManifest {
        return {
            version: AssetRegistryService.MANIFEST_VERSION,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            assets: {}
        };
    }

    /**
     * Scan all project directories for assets
     * 扫描项目中所有目录的资产
     */
    private async _scanAssetsDirectory(): Promise<void> {
        if (!this._fileSystem || !this._projectPath) return;

        const sep = this._projectPath.includes('\\') ? '\\' : '/';

        // 扫描多个目录：assets, scripts, scenes
        // Scan multiple directories: assets, scripts, scenes
        const directoriesToScan = [
            { path: `${this._projectPath}${sep}assets`, name: 'assets' },
            { path: `${this._projectPath}${sep}scripts`, name: 'scripts' },
            { path: `${this._projectPath}${sep}scenes`, name: 'scenes' }
        ];

        for (const dir of directoriesToScan) {
            try {
                const exists = await this._fileSystem.exists(dir.path);
                if (!exists) continue;

                await this._scanDirectory(dir.path, dir.name);
            } catch (error) {
                logger.error(`Failed to scan ${dir.name} directory:`, error);
            }
        }
    }

    /**
     * Recursively scan a directory
     * 递归扫描目录
     */
    private async _scanDirectory(absolutePath: string, relativePath: string): Promise<void> {
        if (!this._fileSystem) return;

        try {
            // 使用标准 IFileSystem.listDirectory
            // Use standard IFileSystem.listDirectory
            const entries: FileEntry[] = await this._fileSystem.listDirectory(absolutePath);
            const sep = absolutePath.includes('\\') ? '\\' : '/';

            for (const entry of entries) {
                const entryAbsPath = entry.path || `${absolutePath}${sep}${entry.name}`;
                const entryRelPath = `${relativePath}/${entry.name}`;

                try {
                    if (entry.isDirectory) {
                        // Recursively scan subdirectory
                        await this._scanDirectory(entryAbsPath, entryRelPath);
                    } else {
                        // Register file as asset with size from entry
                        await this._registerAssetFile(entryAbsPath, entryRelPath, entry.size, entry.modified);
                    }
                } catch (error) {
                    logger.warn(`Failed to process entry ${entry.name}:`, error);
                }
            }
        } catch (error) {
            logger.warn(`Failed to read directory ${absolutePath}:`, error);
        }
    }

    /**
     * Register a single asset file
     * 注册单个资产文件
     *
     * @param absolutePath - 绝对路径 | Absolute path
     * @param relativePath - 相对路径 | Relative path
     * @param size - 文件大小（可选）| File size (optional)
     * @param modified - 修改时间（可选）| Modified time (optional)
     */
    private async _registerAssetFile(
        absolutePath: string,
        relativePath: string,
        size?: number,
        modified?: Date
    ): Promise<void> {
        if (!this._fileSystem || !this._manifest) return;

        // Skip .meta files
        if (relativePath.endsWith('.meta')) return;

        // Get file extension
        const lastDot = relativePath.lastIndexOf('.');
        if (lastDot === -1) return; // Skip files without extension

        const extension = relativePath.substring(lastDot).toLowerCase();
        const assetType = EXTENSION_TYPE_MAP[extension] || inferAssetType(relativePath);

        // Skip unknown file types
        if (!assetType || assetType === 'binary') return;

        // Use provided size/modified or default values
        const fileSize = size ?? 0;
        const fileMtime = modified ? modified.getTime() : Date.now();

        // Use MetaManager to get or create meta (with .meta file)
        let meta: IAssetMeta;
        try {
            logger.debug(`Creating/loading meta for: ${relativePath}`);
            meta = await this._metaManager.getOrCreateMeta(absolutePath);
            logger.debug(`Meta created/loaded for ${relativePath}: guid=${meta.guid}`);
        } catch (e) {
            logger.warn(`Failed to get meta for ${relativePath}:`, e);
            return;
        }

        const guid = meta.guid;

        // Update manifest for backward compatibility
        if (!this._manifest.assets[relativePath]) {
            this._manifest.assets[relativePath] = {
                guid,
                relativePath,
                type: assetType
            };
        }

        // Get file name
        const lastSlash = relativePath.lastIndexOf('/');
        const fileName = lastSlash >= 0 ? relativePath.substring(lastSlash + 1) : relativePath;
        const name = fileName.substring(0, fileName.lastIndexOf('.'));

        // Create metadata
        const metadata: IAssetRegistryMetadata = {
            guid,
            path: relativePath,
            type: assetType,
            name,
            size: fileSize,
            hash: '', // Could compute hash if needed
            lastModified: fileMtime
        };

        // Register in database
        this._database.addAsset(metadata);
    }

    /**
     * Generate a unique GUID
     */
    private _generateGUID(): AssetGUID {
        // Simple UUID v4 generation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // ==================== Public API ====================

    /**
     * Get asset metadata by GUID
     */
    getAsset(guid: AssetGUID): IAssetRegistryMetadata | undefined {
        return this._database.getMetadata(guid);
    }

    /**
     * Get asset metadata by relative path
     */
    getAssetByPath(relativePath: string): IAssetRegistryMetadata | undefined {
        return this._database.getMetadataByPath(relativePath);
    }

    /**
     * Get GUID for a relative path
     */
    getGuidByPath(relativePath: string): AssetGUID | undefined {
        const metadata = this._database.getMetadataByPath(relativePath);
        if (!metadata) {
            // Debug: show registered paths if not found
            const stats = this._database.getStatistics();
            logger.debug(`[AssetRegistry] GUID not found for path: "${relativePath}", total assets: ${stats.totalAssets}`);
        }
        return metadata?.guid;
    }

    /**
     * Get relative path for a GUID
     */
    getPathByGuid(guid: AssetGUID): string | undefined {
        const metadata = this._database.getMetadata(guid);
        return metadata?.path;
    }

    /**
     * Convert absolute path to relative path
     */
    absoluteToRelative(absolutePath: string): string | null {
        if (!this._projectPath) return null;

        const normalizedAbs = absolutePath.replace(/\\/g, '/');
        const normalizedProject = this._projectPath.replace(/\\/g, '/');

        if (normalizedAbs.startsWith(normalizedProject)) {
            return normalizedAbs.substring(normalizedProject.length + 1);
        }

        return null;
    }

    /**
     * Convert relative path to absolute path
     */
    relativeToAbsolute(relativePath: string): string | null {
        if (!this._projectPath) return null;

        const sep = this._projectPath.includes('\\') ? '\\' : '/';
        return `${this._projectPath}${sep}${relativePath.replace(/\//g, sep)}`;
    }

    /**
     * Find assets by type
     */
    findAssetsByType(type: AssetRegistryType): IAssetRegistryMetadata[] {
        const guids = this._database.findAssetsByType(type);
        return guids
            .map(guid => this._database.getMetadata(guid))
            .filter((m): m is IAssetRegistryMetadata => m !== undefined);
    }

    /**
     * Get all registered assets
     */
    getAllAssets(): IAssetRegistryMetadata[] {
        const entries = this._database.exportToCatalog();
        return entries.map(entry => this._database.getMetadata(entry.guid))
            .filter((m): m is IAssetRegistryMetadata => m !== undefined);
    }

    /**
     * Export catalog for runtime use
     * 导出运行时使用的资产目录
     */
    exportCatalog(): IAssetRegistryCatalogEntry[] {
        return this._database.exportToCatalog();
    }

    /**
     * Export catalog as JSON string
     */
    exportCatalogJSON(): string {
        const entries = this._database.exportToCatalog();
        const catalog = {
            version: '1.0.0',
            createdAt: Date.now(),
            entries: Object.fromEntries(entries.map(e => [e.guid, e]))
        };
        return JSON.stringify(catalog, null, 2);
    }

    /**
     * Register a new asset (e.g., when a file is created)
     */
    async registerAsset(absolutePath: string): Promise<AssetGUID | null> {
        const relativePath = this.absoluteToRelative(absolutePath);
        if (!relativePath) return null;

        await this._registerAssetFile(absolutePath, relativePath);
        await this._saveManifest();

        const metadata = this._database.getMetadataByPath(relativePath);
        return metadata?.guid ?? null;
    }

    /**
     * Unregister an asset (e.g., when a file is deleted)
     */
    async unregisterAsset(absolutePath: string): Promise<void> {
        const relativePath = this.absoluteToRelative(absolutePath);
        if (!relativePath || !this._manifest) return;

        const metadata = this._database.getMetadataByPath(relativePath);
        if (metadata) {
            this._database.removeAsset(metadata.guid);
            delete this._manifest.assets[relativePath];
            await this._saveManifest();
        }
    }

    /**
     * Refresh a single asset (e.g., when file is modified)
     */
    async refreshAsset(absolutePath: string): Promise<void> {
        const relativePath = this.absoluteToRelative(absolutePath);
        if (!relativePath) return;

        // Re-register the asset
        await this._registerAssetFile(absolutePath, relativePath);
        await this._saveManifest();
    }

    /**
     * Get database statistics
     */
    getStatistics() {
        return this._database.getStatistics();
    }

    /**
     * Check if service is ready
     */
    get isReady(): boolean {
        return this._initialized && this._projectPath !== null;
    }

    /**
     * Get current project path
     */
    get projectPath(): string | null {
        return this._projectPath;
    }

    /**
     * Dispose the service
     */
    dispose(): void {
        this._unsubscribeFromFileChanges();
        this.unloadProject();
        this._initialized = false;
    }
}
