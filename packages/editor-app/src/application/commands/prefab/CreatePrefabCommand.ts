/**
 * 创建预制体命令
 * Create prefab command
 *
 * 从选中的实体创建预制体资产并保存到文件系统。
 * Creates a prefab asset from the selected entity and saves it to the file system.
 */

import { Core, Entity, HierarchySystem, PrefabSerializer } from '@esengine/ecs-framework';
import type { PrefabData } from '@esengine/ecs-framework';
import type { MessageHub, IFileAPI, ProjectService, AssetRegistryService } from '@esengine/editor-core';
import { BaseCommand } from '../BaseCommand';

/**
 * 创建预制体命令选项
 * Create prefab command options
 */
export interface CreatePrefabOptions {
    /** 预制体名称 | Prefab name */
    name: string;
    /** 保存路径（不包含文件名） | Save path (without filename) */
    savePath?: string;
    /** 预制体描述 | Prefab description */
    description?: string;
    /** 预制体标签 | Prefab tags */
    tags?: string[];
    /** 是否包含子实体 | Whether to include child entities */
    includeChildren?: boolean;
}

/**
 * 创建预制体命令
 * Create prefab command
 */
export class CreatePrefabCommand extends BaseCommand {
    private savedFilePath: string | null = null;
    private savedGuid: string | null = null;

    constructor(
        private messageHub: MessageHub,
        private fileAPI: IFileAPI,
        private projectService: ProjectService | undefined,
        private assetRegistry: AssetRegistryService | null,
        private sourceEntity: Entity,
        private options: CreatePrefabOptions
    ) {
        super();
    }

    async execute(): Promise<void> {
        const scene = Core.scene;
        if (!scene) {
            throw new Error('场景未初始化 | Scene not initialized');
        }

        // 获取层级系统 | Get hierarchy system
        const hierarchySystem = scene.getSystem(HierarchySystem);

        // 创建预制体数据 | Create prefab data
        const prefabData = PrefabSerializer.createPrefab(
            this.sourceEntity,
            {
                name: this.options.name,
                description: this.options.description,
                tags: this.options.tags,
                includeChildren: this.options.includeChildren ?? true
            },
            hierarchySystem ?? undefined
        );

        // 序列化为 JSON | Serialize to JSON
        const prefabJson = PrefabSerializer.serialize(prefabData, true);

        // 确定保存路径 | Determine save path
        let savePath = this.options.savePath;
        if (!savePath && this.projectService?.isProjectOpen()) {
            // 默认保存到项目的 prefabs 目录 | Default save to project's prefabs directory
            const currentProject = this.projectService.getCurrentProject();
            if (currentProject) {
                const projectRoot = currentProject.path;
                const sep = projectRoot.includes('\\') ? '\\' : '/';
                savePath = `${projectRoot}${sep}assets${sep}prefabs`;
                // 确保目录存在 | Ensure directory exists
                await this.fileAPI.createDirectory(savePath);
            }
        }

        // 构建完整文件路径 | Build complete file path
        let fullPath: string | null = null;
        if (savePath) {
            const sep = savePath.includes('\\') ? '\\' : '/';
            fullPath = `${savePath}${sep}${this.options.name}.prefab`;
        } else {
            // 打开保存对话框 | Open save dialog
            fullPath = await this.fileAPI.saveSceneDialog(`${this.options.name}.prefab`);
        }

        if (!fullPath) {
            throw new Error('保存被取消 | Save cancelled');
        }

        // 确保扩展名正确 | Ensure correct extension
        if (!fullPath.endsWith('.prefab')) {
            fullPath += '.prefab';
        }

        // 保存文件 | Save file
        await this.fileAPI.writeFileContent(fullPath, prefabJson);
        this.savedFilePath = fullPath;

        // 注册资产以生成 .meta 文件 | Register asset to generate .meta file
        if (this.assetRegistry) {
            const guid = await this.assetRegistry.registerAsset(fullPath);
            this.savedGuid = guid;
            console.log(`[CreatePrefabCommand] Registered prefab asset with GUID: ${guid}`);
        }

        // 发布事件 | Publish event
        await this.messageHub.publish('prefab:created', {
            path: fullPath,
            guid: this.savedGuid,
            name: this.options.name,
            sourceEntityId: this.sourceEntity.id,
            sourceEntityName: this.sourceEntity.name
        });
    }

    undo(): void {
        // 预制体创建是一个文件系统操作，撤销意味着删除文件
        // Prefab creation is a file system operation, undo means deleting the file
        // 但为了安全，我们不自动删除文件，只是清除引用
        // But for safety, we don't auto-delete the file, just clear the reference
        this.savedFilePath = null;

        // TODO: 如果需要完整撤销，可以实现文件删除
        // TODO: If full undo is needed, implement file deletion
    }

    getDescription(): string {
        return `创建预制体: ${this.options.name}`;
    }

    /**
     * 获取保存的文件路径
     * Get saved file path
     */
    getSavedFilePath(): string | null {
        return this.savedFilePath;
    }
}
