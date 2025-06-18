import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';

/**
 * 行为树相关的处理器
 */
export class BehaviorTreeHandler {
    /**
     * 安装行为树AI系统
     */
    static async install(): Promise<boolean> {
        const projectPath = Editor.Project.path;
        const command = 'npm install @esengine/ai';
        
        console.log(`Installing Behavior Tree AI to project: ${projectPath}`);
        
        return new Promise((resolve) => {
            exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
                console.log('Install stdout:', stdout);
                if (stderr) console.log('Install stderr:', stderr);
                
                if (error) {
                    console.error('Behavior Tree AI installation failed:', error);
                    resolve(false);
                } else {
                    console.log('Behavior Tree AI installation completed successfully');
                    
                    // 验证安装是否成功
                    const nodeModulesPath = path.join(projectPath, 'node_modules', '@esengine', 'ai');
                    const installSuccess = fs.existsSync(nodeModulesPath);
                    
                    if (installSuccess) {
                        console.log('Behavior Tree AI installed successfully');
                        resolve(true);
                    } else {
                        console.warn('Behavior Tree AI directory not found after install');
                        resolve(false);
                    }
                }
            });
        });
    }

    /**
     * 更新行为树AI系统
     */
    static async update(): Promise<boolean> {
        const projectPath = Editor.Project.path;
        const command = 'npm update @esengine/ai';
        
        console.log(`Updating Behavior Tree AI in project: ${projectPath}`);
        
        return new Promise((resolve) => {
            exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
                console.log('Update stdout:', stdout);
                if (stderr) console.log('Update stderr:', stderr);
                
                if (error) {
                    console.error('Behavior Tree AI update failed:', error);
                    resolve(false);
                } else {
                    console.log('Behavior Tree AI update completed successfully');
                    
                    // 验证更新是否成功
                    const nodeModulesPath = path.join(projectPath, 'node_modules', '@esengine', 'ai');
                    const updateSuccess = fs.existsSync(nodeModulesPath);
                    
                    if (updateSuccess) {
                        console.log('Behavior Tree AI updated successfully');
                        resolve(true);
                    } else {
                        console.warn('Behavior Tree AI directory not found after update');
                        resolve(false);
                    }
                }
            });
        });
    }

    /**
     * 检查行为树AI是否已安装
     */
    static checkInstalled(): boolean {
        try {
            const projectPath = Editor.Project.path;
            const packageJsonPath = path.join(projectPath, 'package.json');
            
            if (!fs.existsSync(packageJsonPath)) {
                return false;
            }
            
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            return '@esengine/ai' in dependencies;
        } catch (error) {
            console.error('Error checking Behavior Tree AI installation:', error);
            return false;
        }
    }

    /**
     * 打开行为树文档
     */
    static openDocumentation(): void {
        const url = 'https://github.com/esengine/ai/blob/master/README.md';
        
        try {
            const { shell } = require('electron');
            shell.openExternal(url);
            console.log('Behavior Tree documentation opened successfully');
        } catch (error) {
            console.error('Failed to open Behavior Tree documentation:', error);
            Editor.Dialog.info('打开行为树文档', {
                detail: `请手动访问以下链接查看文档:\n\n${url}`,
            });
        }
    }

    /**
     * 创建行为树文件
     */
    static async createFile(assetInfo?: any): Promise<void> {
        try {
            const projectPath = Editor.Project.path;
            const assetsPath = path.join(projectPath, 'assets');
            
            // 生成唯一文件名
            let fileName = 'NewBehaviorTree';
            let counter = 1;
            let filePath = path.join(assetsPath, `${fileName}.bt.json`);
            
            while (fs.existsSync(filePath)) {
                fileName = `NewBehaviorTree_${counter}`;
                filePath = path.join(assetsPath, `${fileName}.bt.json`);
                counter++;
            }
            
            // 创建默认的行为树配置
            const defaultConfig = {
                version: "1.0.0",
                type: "behavior-tree",
                metadata: {
                    createdAt: new Date().toISOString(),
                    nodeCount: 1
                },
                tree: {
                    id: "root",
                    type: "sequence",
                    namespace: "behaviourTree/composites",
                    properties: {},
                    children: []
                }
            };
            
            // 写入文件
            await fsExtra.writeFile(filePath, JSON.stringify(defaultConfig, null, 2));
            
            // 刷新资源管理器 - 使用正确的资源路径
            const relativeAssetPath = path.relative(projectPath, filePath).replace(/\\/g, '/');
            const dbAssetPath = 'db://' + relativeAssetPath;
            await Editor.Message.request('asset-db', 'refresh-asset', dbAssetPath);
            
            console.log(`Behavior tree file created: ${filePath}`);
            
            Editor.Dialog.info('创建成功', {
                detail: `行为树文件 "${fileName}.bt.json" 已创建完成！\n\n文件位置：assets/${fileName}.bt.json\n\n您可以右键点击文件选择"用行为树编辑器打开"来编辑它。`,
            });
            
        } catch (error) {
            console.error('Failed to create behavior tree file:', error);
            Editor.Dialog.error('创建失败', {
                detail: `创建行为树文件失败：\n\n${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }

    /**
     * 打开行为树文件
     */
    static async openFile(assetInfo: any): Promise<void> {
        try {
            if (!assetInfo || !assetInfo.file) {
                throw new Error('无效的文件信息');
            }
            
            const filePath = assetInfo.file;
            const fileData = await this.loadFileData(filePath);
            await this.openPanel();
            await this.sendDataToPanel(fileData);
            
        } catch (error) {
            Editor.Dialog.error('打开失败', {
                detail: `打开行为树文件失败：\n\n${error instanceof Error ? error.message : String(error)}`
            });
        }
    }
    
    /**
     * 读取并解析文件数据
     */
    private static async loadFileData(filePath: string): Promise<any> {
        try {
            let assetPath = filePath;
            
            if (path.isAbsolute(filePath)) {
                const projectPath = Editor.Project.path;
                if (filePath.startsWith(projectPath)) {
                    assetPath = path.relative(projectPath, filePath);
                    assetPath = assetPath.replace(/\\/g, '/');
                }
            }
            
            if (!assetPath.startsWith('db://')) {
                assetPath = 'db://' + assetPath;
            }
            
            try {
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', assetPath);
                
                if (assetInfo && assetInfo.source) {
                    const content = await fsExtra.readFile(assetInfo.source, 'utf8');
                    let fileContent: any;
                    
                    try {
                        fileContent = JSON.parse(content);
                    } catch (parseError) {
                        fileContent = {
                            version: "1.0.0",
                            type: "behavior-tree", 
                            rawContent: content
                        };
                    }
                    
                    const fileData = {
                        ...fileContent,
                        _fileInfo: {
                            fileName: path.basename(assetInfo.source, path.extname(assetInfo.source)),
                            filePath: assetInfo.source,
                            assetPath: assetPath
                        }
                    };
                    
                    return fileData;
                }
            } catch (assetError) {
                // 资源系统读取失败，尝试直接文件读取
            }
            
            const actualFilePath = path.isAbsolute(filePath) ? filePath : path.join(Editor.Project.path, filePath);
            
            if (!fs.existsSync(actualFilePath)) {
                throw new Error(`文件不存在: ${actualFilePath}`);
            }
            
            const content = await fsExtra.readFile(actualFilePath, 'utf8');
            let fileContent: any;
            
            try {
                fileContent = JSON.parse(content);
            } catch (parseError) {
                fileContent = {
                    version: "1.0.0",
                    type: "behavior-tree", 
                    rawContent: content
                };
            }
            
            const fileData = {
                ...fileContent,
                _fileInfo: {
                    fileName: path.basename(actualFilePath, path.extname(actualFilePath)),
                    filePath: actualFilePath
                }
            };
            
            return fileData;
            
        } catch (error) {
            throw new Error(`文件读取失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    /**
     * 打开行为树面板
     */
    private static async openPanel(): Promise<void> {
        await Editor.Panel.open('cocos-ecs-extension.behavior-tree');
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    /**
     * 发送数据到面板
     */
    private static async sendDataToPanel(fileData: any): Promise<void> {
        try {
            const result = await Editor.Message.request('cocos-ecs-extension.behavior-tree', 'loadBehaviorTreeFile', fileData);
        } catch (error) {
            setTimeout(() => {
                try {
                    Editor.Message.send('cocos-ecs-extension.behavior-tree', 'loadBehaviorTreeFile', fileData);
                } catch (delayError) {
                    // 静默失败
                }
            }, 100);
        }
    }

    /**
     * 从编辑器创建行为树文件
     */
    static async createFromEditor(data: { fileName: string, content: string }): Promise<void> {
        try {
            const projectPath = Editor.Project.path;
            const assetsPath = path.join(projectPath, 'assets');
            
            let fileName = data.fileName;
            let counter = 1;
            let filePath = path.join(assetsPath, `${fileName}.bt.json`);
            
            while (fs.existsSync(filePath)) {
                fileName = `${data.fileName}_${counter}`;
                filePath = path.join(assetsPath, `${fileName}.bt.json`);
                counter++;
            }
            
            await fsExtra.writeFile(filePath, data.content);
            
            const relativeAssetPath = path.relative(projectPath, filePath).replace(/\\/g, '/');
            const dbAssetPath = 'db://' + relativeAssetPath;
            await Editor.Message.request('asset-db', 'refresh-asset', dbAssetPath);
            
            Editor.Dialog.info('保存成功', {
                detail: `行为树文件 "${fileName}.bt.json" 已保存到 assets 目录中！`,
            });
            
        } catch (error) {
            Editor.Dialog.error('保存失败', {
                detail: `保存行为树文件失败：\n\n${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }

    /**
     * 覆盖现有行为树文件
     */
    static async overwriteFile(data: { filePath: string, content: string }): Promise<void> {
        try {
            await fsExtra.writeFile(data.filePath, data.content);
            
            const projectPath = Editor.Project.path;
            const relativeAssetPath = path.relative(projectPath, data.filePath).replace(/\\/g, '/');
            const dbAssetPath = 'db://' + relativeAssetPath;
            await Editor.Message.request('asset-db', 'refresh-asset', dbAssetPath);
            
            const fileName = path.basename(data.filePath, path.extname(data.filePath));
            Editor.Dialog.info('覆盖成功', {
                detail: `行为树文件 "${fileName}.bt.json" 已更新！`,
            });
            
        } catch (error) {
            Editor.Dialog.error('覆盖失败', {
                detail: `覆盖行为树文件失败：\n\n${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }
} 