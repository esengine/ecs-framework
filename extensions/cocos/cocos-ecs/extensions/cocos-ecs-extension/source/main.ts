// @ts-ignore
import packageJSON from '../package.json';
import { exec } from 'child_process';
import * as path from 'path';
import { readFileSync, outputFile } from 'fs-extra';
import { join } from 'path';
import { TemplateGenerator } from './TemplateGenerator';

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
        // 使用系统默认命令打开链接
        const url = 'https://github.com/esengine/ecs-framework/blob/master/README.md';
        exec(`start ${url}`, (error) => {
            if (error) {
                console.error('Failed to open documentation:', error);
                Editor.Dialog.info('打开文档', {
                    detail: `请手动访问以下链接查看文档:\n\n${url}`,
                });
            }
        });
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
     * 打开设置
     */
    'open-settings'() {
        Editor.Dialog.info('插件设置', {
            detail: '设置面板开发中...\n\n将在下个版本提供完整的插件配置功能。\n\n预计功能：\n• 代码生成模板配置\n• 性能监控设置\n• 自动更新设置\n• 开发工具偏好',
            buttons: ['好的'],
        });
    },

    /**
     * 项目分析（预留）
     */
    'analyze-project'() {
        Editor.Dialog.info('项目分析', {
            detail: '项目分析功能开发中...\n\n将在下个版本提供以下分析功能：\n• ECS架构合理性分析\n• 性能瓶颈检测\n• 组件使用统计\n• 系统执行效率分析\n• 内存使用优化建议',
            buttons: ['好的'],
        });
    },

    /**
     * 组件库（预留）
     */
    'open-component-library'() {
        Editor.Dialog.info('组件库', {
            detail: '组件库功能开发中...\n\n将在下个版本提供：\n• 常用组件模板库\n• 系统模板库\n• 一键生成组件代码\n• 社区组件分享\n• 组件文档和示例',
            buttons: ['好的'],
        });
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
