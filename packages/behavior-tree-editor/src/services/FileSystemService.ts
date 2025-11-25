import { singleton, invoke, type IService } from '@esengine/editor-runtime';

/**
 * 文件系统服务
 * 封装所有文件读写操作，使用通用后端命令
 */
@singleton()
export class FileSystemService implements IService {
    /**
     * 读取行为树文件
     */
    async readBehaviorTreeFile(filePath: string): Promise<string> {
        try {
            return await invoke<string>('read_file_content', { path: filePath });
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error}`);
        }
    }

    /**
     * 写入行为树文件
     */
    async writeBehaviorTreeFile(filePath: string, content: string): Promise<void> {
        try {
            await invoke('write_file_content', { path: filePath, content });
        } catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error}`);
        }
    }

    /**
     * 读取全局黑板配置
     * 业务逻辑在前端，后端只提供通用文件操作
     */
    async readGlobalBlackboard(projectPath: string): Promise<string> {
        try {
            const configPath = `${projectPath}/.ecs/global-blackboard.json`;
            const exists = await invoke<boolean>('path_exists', { path: configPath });

            if (!exists) {
                return JSON.stringify({ version: '1.0', variables: [] });
            }

            return await invoke<string>('read_file_content', { path: configPath });
        } catch (error) {
            throw new Error(`Failed to read global blackboard: ${error}`);
        }
    }

    /**
     * 写入全局黑板配置
     * 业务逻辑在前端，后端只提供通用文件操作
     */
    async writeGlobalBlackboard(projectPath: string, content: string): Promise<void> {
        try {
            const ecsDir = `${projectPath}/.ecs`;
            const configPath = `${ecsDir}/global-blackboard.json`;

            // 创建 .ecs 目录（如果不存在）
            const dirExists = await invoke<boolean>('path_exists', { path: ecsDir });
            if (!dirExists) {
                await invoke('create_directory', { path: ecsDir });
            }

            await invoke('write_file_content', { path: configPath, content });
        } catch (error) {
            throw new Error(`Failed to write global blackboard: ${error}`);
        }
    }

    async writeTextFile(filePath: string, content: string): Promise<void> {
        try {
            await invoke('write_file_content', { path: filePath, content });
        } catch (error) {
            throw new Error(`Failed to write text file ${filePath}: ${error}`);
        }
    }

    async writeBinaryFile(filePath: string, data: Uint8Array): Promise<void> {
        try {
            await invoke('write_binary_file', { filePath, content: Array.from(data) });
        } catch (error) {
            throw new Error(`Failed to write binary file ${filePath}: ${error}`);
        }
    }

    dispose(): void {
        // 文件系统服务无需清理资源
    }
}
