import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { TemplateGenerator } from '../TemplateGenerator';

/**
 * ECS框架相关的处理器
 */
export class EcsFrameworkHandler {
    /**
     * 安装ECS Framework
     */
    static async install(): Promise<void> {
        const projectPath = Editor.Project.path;
        const command = 'npm install @esengine/ecs-framework';
        
        console.log(`Installing ECS Framework to project: ${projectPath}`);
        
        return new Promise((resolve, reject) => {
            exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
                console.log('Install stdout:', stdout);
                if (stderr) console.log('Install stderr:', stderr);
                
                if (error) {
                    console.error('Installation failed:', error);
                    reject(error);
                } else {
                    console.log('Installation completed successfully');
                    
                    // 验证安装是否成功
                    const nodeModulesPath = path.join(projectPath, 'node_modules', '@esengine', 'ecs-framework');
                    const installSuccess = fs.existsSync(nodeModulesPath);
                    
                    if (installSuccess) {
                        console.log('ECS Framework installed successfully');
                        resolve();
                    } else {
                        console.warn('ECS Framework directory not found after install');
                        reject(new Error('安装验证失败'));
                    }
                }
            });
        });
    }

    /**
     * 更新ECS Framework
     */
    static async update(targetVersion?: string): Promise<void> {
        const projectPath = Editor.Project.path;
        const version = targetVersion ? `@${targetVersion}` : '@latest';
        const command = `npm install @esengine/ecs-framework${version}`;
        
        console.log(`Updating ECS Framework to ${version} in project: ${projectPath}`);
        
        return new Promise((resolve, reject) => {
            exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
                console.log('Update stdout:', stdout);
                if (stderr) console.log('Update stderr:', stderr);
                
                if (error) {
                    console.error('Update failed:', error);
                    reject(error);
                } else {
                    console.log('Update completed successfully');
                    
                    // 验证更新是否成功
                    const nodeModulesPath = path.join(projectPath, 'node_modules', '@esengine', 'ecs-framework');
                    const updateSuccess = fs.existsSync(nodeModulesPath);
                    
                    if (updateSuccess) {
                        console.log(`ECS Framework updated successfully to ${version}`);
                        resolve();
                    } else {
                        console.warn('ECS Framework directory not found after update');
                        reject(new Error('更新验证失败'));
                    }
                }
            });
        });
    }

    /**
     * 卸载ECS Framework
     */
    static async uninstall(): Promise<void> {
        const projectPath = Editor.Project.path;
        const command = 'npm uninstall @esengine/ecs-framework';
        
        console.log(`Uninstalling ECS Framework from project: ${projectPath}`);
        
        return new Promise((resolve, reject) => {
            exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
                console.log('Uninstall stdout:', stdout);
                if (stderr) console.log('Uninstall stderr:', stderr);
                
                if (error) {
                    console.error('Uninstall failed:', error);
                    reject(error);
                } else {
                    console.log('Uninstall completed successfully');
                    
                    // 检查是否真的卸载了
                    const nodeModulesPath = path.join(projectPath, 'node_modules', '@esengine', 'ecs-framework');
                    const stillExists = fs.existsSync(nodeModulesPath);
                    
                    if (stillExists) {
                        console.warn('ECS Framework directory still exists after uninstall');
                        reject(new Error('卸载验证失败'));
                    } else {
                        console.log('ECS Framework uninstalled successfully');
                        resolve();
                    }
                }
            });
        });
    }

    /**
     * 打开文档
     */
    static openDocumentation(): void {
        const url = 'https://github.com/esengine/ecs-framework/blob/master/README.md';
        
        try {
            // 使用Electron的shell模块打开外部链接
            const { shell } = require('electron');
            shell.openExternal(url);
            console.log('Documentation link opened successfully');
        } catch (error) {
            console.error('Failed to open documentation:', error);
            Editor.Dialog.info('打开文档', {
                detail: `请手动访问以下链接查看文档:\n\n${url}`,
            });
        }
    }

    /**
     * 创建ECS模板
     */
    static createTemplate(): void {
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
                        this.showTemplateCreatedDialog();
                    } else {
                        console.log('User cancelled template creation');
                    }
                });
                return;
            }
            
            // 创建新模板
            templateGenerator.createTemplate();
            console.log('ECS template created successfully');
            this.showTemplateCreatedDialog();
            
        } catch (error) {
            console.error('Failed to create ECS template:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            Editor.Dialog.error('模板创建失败', {
                detail: `创建ECS模板时发生错误：\n\n${errorMessage}\n\n请检查项目权限和目录结构。`,
            });
        }
    }

    /**
     * 显示模板创建成功的对话框
     */
    private static showTemplateCreatedDialog(): void {
        Editor.Dialog.info('模板创建成功', {
            detail: '✅ ECS项目模板已创建完成！\n\n已为您的Cocos Creator项目生成了完整的ECS架构模板，包括：\n\n' +
                   '• 位置、速度、Cocos节点组件\n' +
                   '• 移动系统和节点同步系统\n' +
                   '• 实体工厂和场景管理器\n' +
                   '• ECS管理器组件(可直接添加到节点)\n' +
                   '• 完整的使用文档\n\n' +
                   '请刷新资源管理器查看新创建的文件。',
        });
    }

    /**
     * 打开GitHub仓库
     */
    static openGitHub(): void {
        const url = 'https://github.com/esengine/ecs-framework';
        
        try {
            const { shell } = require('electron');
            shell.openExternal(url);
            console.log('GitHub repository opened successfully');
        } catch (error) {
            console.error('Failed to open GitHub repository:', error);
            Editor.Dialog.info('打开GitHub', {
                detail: `请手动访问以下链接：\n\n${url}`,
            });
        }
    }

    /**
     * 打开QQ群
     */
    static openQQGroup(): void {
        const url = 'https://qm.qq.com/cgi-bin/qm/qr?k=your-qq-group-key';
        
        try {
            const { shell } = require('electron');
            shell.openExternal(url);
            console.log('QQ group opened successfully');
        } catch (error) {
            console.error('Failed to open QQ group:', error);
            Editor.Dialog.info('QQ群', {
                detail: '请手动搜索QQ群号或访问相关链接加入讨论群。',
            });
        }
    }
} 