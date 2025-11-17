import { singleton } from 'tsyringe';
import { invoke } from '@tauri-apps/api/core';
import { IService } from '@esengine/ecs-framework';

/**
 * 文件系统服务
 * 封装所有文件读写操作
 */
@singleton()
export class FileSystemService implements IService {
    /**
     * 读取行为树文件
     */
    async readBehaviorTreeFile(filePath: string): Promise<string> {
        try {
            return await invoke<string>('read_behavior_tree_file', { filePath });
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error}`);
        }
    }

    /**
     * 写入行为树文件
     */
    async writeBehaviorTreeFile(filePath: string, content: string): Promise<void> {
        try {
            await invoke('write_behavior_tree_file', { filePath, content });
        } catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error}`);
        }
    }

    /**
     * 读取全局黑板配置
     */
    async readGlobalBlackboard(projectPath: string): Promise<string> {
        try {
            return await invoke<string>('read_global_blackboard', { projectPath });
        } catch (error) {
            throw new Error(`Failed to read global blackboard: ${error}`);
        }
    }

    /**
     * 写入全局黑板配置
     */
    async writeGlobalBlackboard(projectPath: string, content: string): Promise<void> {
        try {
            await invoke('write_global_blackboard', { projectPath, content });
        } catch (error) {
            throw new Error(`Failed to write global blackboard: ${error}`);
        }
    }

    /**
     * 释放资源
     */
    dispose(): void {
        // 文件系统服务无需清理资源
    }
}
