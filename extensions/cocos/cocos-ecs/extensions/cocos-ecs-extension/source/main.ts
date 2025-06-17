// @ts-ignore
import packageJSON from '../package.json';
import { exec, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import { readFileSync, outputFile } from 'fs-extra';
import { join } from 'path';
import { TemplateGenerator } from './TemplateGenerator';
import { CodeGenerator } from './CodeGenerator';

/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     */
    openPanel() {
        Editor.Panel.open(packageJSON.name);
    },

    /**
     * 安装ECS Framework
     */
    'install-ecs-framework'() {
        const projectPath = Editor.Project.path;
        const command = 'npm install @esengine/ecs-framework';
        
        console.log(`Installing ECS Framework to project: ${projectPath}`);
        console.log(`Command: ${command}`);
        
        exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
            console.log('Install stdout:', stdout);
            console.log('Install stderr:', stderr);
            
            if (error) {
                console.error('Installation failed:', error);
            } else {
                console.log('Installation completed successfully');
                
                // 验证安装是否成功
                const nodeModulesPath = path.join(projectPath, 'node_modules', '@esengine', 'ecs-framework');
                const installSuccess = require('fs').existsSync(nodeModulesPath);
                
                if (installSuccess) {
                    console.log('ECS Framework installed successfully');
                } else {
                    console.warn('ECS Framework directory not found after install');
                }
            }
        });
    },

    /**
     * 更新ECS Framework
     */
    'update-ecs-framework'(targetVersion?: string) {
        const projectPath = Editor.Project.path;
        const version = targetVersion ? `@${targetVersion}` : '@latest';
        const command = `npm install @esengine/ecs-framework${version}`;
        
        console.log(`Updating ECS Framework to ${version} in project: ${projectPath}`);
        console.log(`Command: ${command}`);
        
        exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
            console.log('Update stdout:', stdout);
            console.log('Update stderr:', stderr);
            
            if (error) {
                console.error('Update failed:', error);
            } else {
                console.log('Update completed successfully');
                
                // 验证更新是否成功
                const nodeModulesPath = path.join(projectPath, 'node_modules', '@esengine', 'ecs-framework');
                const updateSuccess = require('fs').existsSync(nodeModulesPath);
                
                if (updateSuccess) {
                    console.log(`ECS Framework updated successfully to ${version}`);
                } else {
                    console.warn('ECS Framework directory not found after update');
                }
            }
        });
    },

    /**
     * 卸载ECS Framework
     */
    'uninstall-ecs-framework'() {
        const projectPath = Editor.Project.path;
        const command = 'npm uninstall @esengine/ecs-framework';
        
        console.log(`Uninstalling ECS Framework from project: ${projectPath}`);
        console.log(`Command: ${command}`);
        
        exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
            console.log('Uninstall stdout:', stdout);
            console.log('Uninstall stderr:', stderr);
            
            if (error) {
                console.error('Uninstall failed:', error);
            } else {
                console.log('Uninstall completed successfully');
                
                // 检查是否真的卸载了
                const nodeModulesPath = path.join(projectPath, 'node_modules', '@esengine', 'ecs-framework');
                const stillExists = require('fs').existsSync(nodeModulesPath);
                
                if (stillExists) {
                    console.warn('ECS Framework directory still exists after uninstall');
                } else {
                    console.log('ECS Framework uninstalled successfully');
                }
            }
        });
    },

    /**
     * 打开文档
     */
    'open-documentation'() {
        const url = 'https://github.com/esengine/ecs-framework/blob/master/README.md';
        
        try {
            // 使用Electron的shell模块打开外部链接（推荐方法）
            const { shell } = require('electron');
            shell.openExternal(url);
            console.log('Documentation link opened successfully');
        } catch (error) {
            console.error('Failed to open documentation with shell.openExternal, trying exec:', error);
            
            // 备用方法：使用系统命令
            exec(`start "" "${url}"`, (execError) => {
                if (execError) {
                    console.error('Failed to open documentation with exec:', execError);
                    Editor.Dialog.info('打开文档', {
                        detail: `请手动访问以下链接查看文档:\n\n${url}`,
                    });
                } else {
                    console.log('Documentation link opened successfully with exec');
                }
            });
        }
    },

    /**
     * 创建ECS模板
     */
    'create-ecs-template'() {
        const projectPath = Editor.Project.path;
        console.log(`Creating ECS template in project: ${projectPath}`);
        
        try {
            const templateGenerator = new TemplateGenerator(projectPath);
            
            // 检查是否已存在模板
            if (templateGenerator.checkTemplateExists()) {
                const existingFiles = templateGenerator.getExistingFiles();
                const fileList = existingFiles.length > 0 ? existingFiles.join('\n• ') : '未检测到具体文件';
                
                Editor.Dialog.warn('模板已存在', {
                    detail: `检测到已存在ECS模板，包含以下文件：\n\n• ${fileList}\n\n是否要覆盖现有模板？`,
                    buttons: ['覆盖', '取消'],
                }).then((result: any) => {
                    if (result.response === 0) {
                        // 用户选择覆盖
                        console.log('User chose to overwrite existing template');
                        templateGenerator.removeExistingTemplate();
                        templateGenerator.createTemplate();
                        
                        Editor.Dialog.info('模板创建成功', {
                            detail: '✅ ECS项目模板已覆盖并重新创建完成！\n\n已为您的Cocos Creator项目生成了完整的ECS架构模板，包括：\n\n' +
                                   '• 位置、速度、Cocos节点组件\n' +
                                   '• 移动系统和节点同步系统\n' +
                                   '• 实体工厂和场景管理器\n' +
                                   '• ECS管理器组件(可直接添加到节点)\n' +
                                   '• 完整的使用文档\n\n' +
                                   '请刷新资源管理器查看新创建的文件。',
                        });
                    } else {
                        console.log('User cancelled template creation');
                    }
                });
                return;
            }
            
            // 创建新模板
            templateGenerator.createTemplate();
            
            console.log('ECS template created successfully');
            
            Editor.Dialog.info('模板创建成功', {
                detail: '✅ ECS项目模板已创建完成！\n\n已为您的Cocos Creator项目生成了完整的ECS架构模板，包括：\n\n' +
                       '• 位置、速度、Cocos节点组件\n' +
                       '• 移动系统和节点同步系统\n' +
                       '• 实体工厂和场景管理器\n' +
                       '• ECS管理器组件(可直接添加到节点)\n' +
                       '• 完整的使用文档\n\n' +
                       '请刷新资源管理器查看新创建的文件。',
            });
            
        } catch (error) {
            console.error('Failed to create ECS template:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            Editor.Dialog.error('模板创建失败', {
                detail: `创建ECS模板时发生错误：\n\n${errorMessage}\n\n请检查项目权限和目录结构。`,
            });
        }
    },

    /**
     * 打开GitHub仓库
     */
    'open-github'() {
        const url = 'https://github.com/esengine/ecs-framework';
        
        try {
            // 使用Electron的shell模块打开外部链接（推荐方法）
            const { shell } = require('electron');
            shell.openExternal(url);
            console.log('GitHub link opened successfully');
        } catch (error) {
            console.error('Failed to open GitHub with shell.openExternal, trying exec:', error);
            
            // 备用方法：使用系统命令
            exec(`start "" "${url}"`, (execError) => {
                if (execError) {
                    console.error('Failed to open GitHub with exec:', execError);
                    Editor.Dialog.info('打开GitHub', {
                        detail: `请手动访问以下链接：\n\n${url}`,
                    });
                } else {
                    console.log('GitHub link opened successfully with exec');
                }
            });
        }
    },

    /**
     * 打开QQ群
     */
    'open-qq-group'() {
        const url = 'https://qm.qq.com/cgi-bin/qm/qr?k=1DMoPJEsY5xUpTAcmjIHK8whgHJHYQTL&authKey=%2FklVb3S0Momc1q1J%2FWHncuwMVHGrDbwV1Y6gAfa5e%2FgHCvyYUL2gpA6hSOU%2BVSa5&noverify=0&group_code=481923584';
        
        try {
            // 使用Electron的shell模块打开外部链接（推荐方法）
            const { shell } = require('electron');
            shell.openExternal(url);
            console.log('QQ group link opened successfully');
        } catch (error) {
            console.error('Failed to open QQ group with shell.openExternal, trying exec:', error);
            
            // 备用方法：使用系统命令
            exec(`start "" "${url}"`, (execError) => {
                if (execError) {
                    console.error('Failed to open QQ group with exec:', execError);
                    Editor.Dialog.info('加入QQ群', {
                        detail: `请手动访问以下链接加入QQ群：\n\n${url}\n\n或手动搜索QQ群号：481923584`,
                    });
                } else {
                    console.log('QQ group link opened successfully with exec');
                }
            });
        }
    },

    /**
     * 打开调试面板
     */
    'open-debug'() {
        console.log('Opening ECS Framework debug panel...');
        try {
            // 正确的打开特定面板的方法
            Editor.Panel.open(packageJSON.name + '.debug');
            console.log('Debug panel opened successfully');
        } catch (error) {
            console.error('Failed to open debug panel:', error);
            Editor.Dialog.error('打开调试面板失败', {
                detail: `无法打开调试面板：\n\n${error}\n\n请尝试重启Cocos Creator编辑器。`,
            });
        }
    },

    /**
     * 打开代码生成器面板
     */
    'open-generator'() {
        console.log('Opening ECS Framework code generator panel...');
        try {
            // 正确的打开特定面板的方法
            Editor.Panel.open(packageJSON.name + '.generator');
            console.log('Generator panel opened successfully');
        } catch (error) {
            console.error('Failed to open generator panel:', error);
            Editor.Dialog.error('打开代码生成器失败', {
                detail: `无法打开代码生成器面板：\n\n${error}\n\n请尝试重启Cocos Creator编辑器。`,
            });
        }
    },

    /**
     * 打开行为树AI组件库面板
     */
    'open-behavior-tree'() {
        console.log('Opening Behavior Tree AI panel...');
        try {
            Editor.Panel.open(packageJSON.name + '.behavior-tree');
            console.log('Behavior Tree panel opened successfully');
        } catch (error) {
            console.error('Failed to open behavior tree panel:', error);
            Editor.Dialog.error('打开行为树面板失败', {
                detail: `无法打开行为树AI组件库面板：\n\n${error}\n\n请尝试重启Cocos Creator编辑器。`,
            });
        }
    },

    /**
     * 安装行为树AI系统
     */
    async 'install-behavior-tree'() {
        console.log('Installing Behavior Tree AI system...');
        const projectPath = Editor.Project.path;
        
        try {
            // 检查项目路径是否有效
            if (!projectPath || !fs.existsSync(projectPath)) {
                throw new Error('无效的项目路径');
            }

            const packageJsonPath = path.join(projectPath, 'package.json');
            
            // 检查package.json是否存在
            if (!fs.existsSync(packageJsonPath)) {
                throw new Error('项目根目录未找到package.json文件');
            }

            console.log('Installing @esengine/ai package...');
            
            // 执行npm安装
            await new Promise<void>((resolve, reject) => {
                const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
                const npmProcess = spawn(cmd, ['install', '@esengine/ai'], {
                    cwd: projectPath,
                    stdio: 'pipe',
                    shell: true
                });

                let stdout = '';
                let stderr = '';

                npmProcess.stdout?.on('data', (data) => {
                    stdout += data.toString();
                });

                npmProcess.stderr?.on('data', (data) => {
                    stderr += data.toString();
                });

                npmProcess.on('close', (code) => {
                    if (code === 0) {
                        console.log('NPM install completed successfully');
                        console.log('STDOUT:', stdout);
                        resolve();
                    } else {
                        console.error('NPM install failed with code:', code);
                        console.error('STDERR:', stderr);
                        reject(new Error(`NPM安装失败 (退出码: ${code})\n\n${stderr || stdout}`));
                    }
                });

                npmProcess.on('error', (error) => {
                    console.error('NPM process error:', error);
                    reject(new Error(`NPM进程错误: ${error.message}`));
                });
            });

                         // 复制行为树相关文件到项目中
             const sourceDir = path.join(__dirname, '../../../thirdparty/BehaviourTree-ai');
             const targetDir = path.join(projectPath, 'assets/scripts/AI');
             
             if (fs.existsSync(sourceDir)) {
                 console.log('Copying behavior tree files...');
                 await fsExtra.ensureDir(targetDir);
                
                // 创建示例文件
                const exampleCode = `import { Scene, Entity, Component } from '@esengine/ecs-framework';
import { BehaviorTreeSystem, BehaviorTreeFactory, TaskStatus } from '@esengine/ai/ecs-integration';

/**
 * 示例AI组件
 */
export class AIExampleComponent extends Component {
    // 在场景中添加行为树系统
    static setupBehaviorTreeSystem(scene: Scene) {
        const behaviorTreeSystem = new BehaviorTreeSystem();
        scene.addEntityProcessor(behaviorTreeSystem);
        return behaviorTreeSystem;
    }
    
    // 为实体添加简单AI行为
    static addSimpleAI(entity: Entity) {
        BehaviorTreeFactory.addBehaviorTreeToEntity(
            entity,
            (builder) => builder
                .selector()
                    .action((entity) => {
                        console.log("AI正在巡逻...");
                        return TaskStatus.Success;
                    })
                    .action((entity) => {
                        console.log("AI正在警戒...");
                        return TaskStatus.Success;
                    })
                .endComposite(),
            { debugMode: true }
        );
    }
}`;

                                 const examplePath = path.join(targetDir, 'AIExample.ts');
                 await fsExtra.writeFile(examplePath, exampleCode);
                console.log('Example file created successfully');
            }

            console.log('Behavior Tree AI system installed successfully');
            return true;

        } catch (error) {
            console.error('Failed to install Behavior Tree AI system:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`行为树AI系统安装失败：\n\n${errorMessage}`);
        }
    },

    /**
     * 更新行为树AI系统
     */
    async 'update-behavior-tree'() {
        console.log('Updating Behavior Tree AI system...');
        const projectPath = Editor.Project.path;
        
        try {
            // 检查是否已安装
                         const packageJsonPath = path.join(projectPath, 'package.json');
             if (!fs.existsSync(packageJsonPath)) {
                 throw new Error('项目根目录未找到package.json文件');
             }

             const packageJson = await fsExtra.readJson(packageJsonPath);
            const dependencies = packageJson.dependencies || {};
            
            if (!dependencies['@esengine/ai']) {
                throw new Error('尚未安装行为树AI系统，请先进行安装');
            }

            console.log('Checking for updates...');
            
            // 执行npm更新
            await new Promise<void>((resolve, reject) => {
                const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
                const npmProcess = spawn(cmd, ['update', '@esengine/ai'], {
                    cwd: projectPath,
                    stdio: 'pipe',
                    shell: true
                });

                npmProcess.on('close', (code) => {
                    if (code === 0) {
                        console.log('Update completed successfully');
                        resolve();
                    } else {
                        reject(new Error(`更新失败 (退出码: ${code})`));
                    }
                });

                npmProcess.on('error', (error) => {
                    reject(new Error(`更新进程错误: ${error.message}`));
                });
            });

            console.log('Behavior Tree AI system updated successfully');
            return true;

        } catch (error) {
            console.error('Failed to update Behavior Tree AI system:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`行为树AI系统更新失败：\n\n${errorMessage}`);
        }
    },

    /**
     * 检查行为树AI系统是否已安装
     */
    async 'check-behavior-tree-installed'() {
        const projectPath = Editor.Project.path;
        
        try {
                         const packageJsonPath = path.join(projectPath, 'package.json');
             if (!fs.existsSync(packageJsonPath)) {
                 return false;
             }

             const packageJson = await fsExtra.readJson(packageJsonPath);
            const dependencies = packageJson.dependencies || {};
            
            return !!dependencies['@esengine/ai'];
        } catch (error) {
            console.error('Failed to check installation status:', error);
            return false;
        }
    },

    /**
     * 打开行为树文档
     */
    'open-behavior-tree-docs'() {
        const url = 'https://github.com/esengine/BehaviourTree-ai/blob/master/ecs-integration/README.md';
        
        try {
            const { shell } = require('electron');
            shell.openExternal(url);
            console.log('Behavior Tree documentation opened successfully');
        } catch (error) {
            console.error('Failed to open documentation:', error);
            Editor.Dialog.info('打开文档', {
                detail: `请手动访问以下链接查看行为树文档:\n\n${url}`,
            });
        }
    },

    /**
     * 创建行为树文件
     */
    async 'create-behavior-tree-file'(assetInfo: any) {
        console.log('Creating behavior tree file in folder:', assetInfo?.path);
        
        try {
            // 获取项目assets目录
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
            
            // 刷新资源管理器
            await Editor.Message.request('asset-db', 'refresh-asset', 'db://assets');
            
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
    },

    /**
     * 用行为树编辑器打开文件
     */
    async 'open-behavior-tree-file'(assetInfo: any) {
        console.log('Opening behavior tree file:', assetInfo);
        
        try {
            // 直接从assetInfo获取文件系统路径
            const assetPath = assetInfo?.path;
            if (!assetPath) {
                throw new Error('无效的文件路径');
            }
            
            // 转换为文件系统路径
            const projectPath = Editor.Project.path;
            const relativePath = assetPath.replace('db://assets/', '');
            const fsPath = path.join(projectPath, 'assets', relativePath);
            
            console.log('File system path:', fsPath);
            
            // 检查文件是否存在
            if (!fs.existsSync(fsPath)) {
                throw new Error('文件不存在');
            }
            
            // 检查文件是否为JSON格式
            let fileContent: any;
            try {
                const content = await fsExtra.readFile(fsPath, 'utf8');
                fileContent = JSON.parse(content);
            } catch (parseError) {
                throw new Error('文件不是有效的JSON格式');
            }
            
            // 验证是否为行为树文件
            if (fileContent.type !== 'behavior-tree' && !fileContent.tree) {
                const confirm = await new Promise<boolean>((resolve) => {
                    Editor.Dialog.warn('文件格式提醒', {
                        detail: '此文件可能不是标准的行为树配置文件，仍要打开吗？',
                        buttons: ['打开', '取消'],
                    }).then((result: any) => {
                        resolve(result.response === 0);
                    });
                });
                
                if (!confirm) {
                    return;
                }
            }
            
            // 打开行为树编辑器面板
            Editor.Panel.open('cocos-ecs-extension.behavior-tree');
            
            console.log(`Behavior tree file opened in editor: ${fsPath}`);
            
        } catch (error) {
            console.error('Failed to open behavior tree file:', error);
            Editor.Dialog.error('打开失败', {
                detail: `打开行为树文件失败：\n\n${error instanceof Error ? error.message : String(error)}`,
            });
        }
    },

    /**
     * 从编辑器创建行为树文件
     */
    async 'create-behavior-tree-from-editor'(data: { fileName: string, content: string }) {
        console.log('Creating behavior tree file from editor:', data.fileName);
        
        try {
            const projectPath = Editor.Project.path;
            const assetsPath = path.join(projectPath, 'assets');
            
            // 确保文件名唯一
            let fileName = data.fileName;
            let counter = 1;
            let filePath = path.join(assetsPath, `${fileName}.bt.json`);
            
            while (fs.existsSync(filePath)) {
                fileName = `${data.fileName}_${counter}`;
                filePath = path.join(assetsPath, `${fileName}.bt.json`);
                counter++;
            }
            
            // 写入文件
            await fsExtra.writeFile(filePath, data.content);
            
            // 刷新资源管理器
            await Editor.Message.request('asset-db', 'refresh-asset', 'db://assets');
            
            console.log(`Behavior tree file created from editor: ${filePath}`);
            
            Editor.Dialog.info('保存成功', {
                detail: `行为树文件 "${fileName}.bt.json" 已保存到 assets 目录中！`,
            });
            
        } catch (error) {
            console.error('Failed to create behavior tree file from editor:', error);
            Editor.Dialog.error('保存失败', {
                detail: `保存行为树文件失败：\n\n${error instanceof Error ? error.message : String(error)}`,
            });
        }
    },
};

/**
 * @en Method triggered when the extension is started
 * @zh 启动扩展时触发的方法
 */
export function load() {
    console.log('ECS Framework Extension loaded');
}

/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
export function unload() {
    console.log('ECS Framework Extension unloaded');
}
