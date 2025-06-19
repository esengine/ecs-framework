// @ts-ignore
import packageJSON from '../package.json';
import { EcsFrameworkHandler, BehaviorTreeHandler, PanelHandler, HotUpdateHandler } from './handlers';
import { readJSON } from 'fs-extra';
import * as path from 'path';
import { AssetInfo } from '@cocos/creator-types/editor/packages/asset-db/@types/public';

/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    // ================ 面板管理 ================
    /**
     * 打开默认面板
     */
    openPanel() {
        PanelHandler.openDefaultPanel();
    },

    /**
     * 打开调试面板
     */
    'open-debug'() {
        PanelHandler.openDebugPanel();
    },

    /**
     * 打开代码生成器面板
     */
    'open-generator'() {
        PanelHandler.openGeneratorPanel();
    },

    /**
     * 打开行为树面板
     */
    'open-behavior-tree'() {
        PanelHandler.openBehaviorTreePanel();
    },

    // ================ ECS框架管理 ================
    /**
     * 安装ECS Framework
     */
    'install-ecs-framework'() {
        EcsFrameworkHandler.install();
    },

    /**
     * 更新ECS Framework
     */
    'update-ecs-framework'() {
        EcsFrameworkHandler.update();
    },

    /**
     * 卸载ECS Framework
     */
    'uninstall-ecs-framework'() {
        EcsFrameworkHandler.uninstall();
    },

    /**
     * 打开文档
     */
    'open-documentation'() {
        EcsFrameworkHandler.openDocumentation();
    },

    /**
     * 创建ECS模板
     */
    'create-ecs-template'() {
        EcsFrameworkHandler.createTemplate();
    },

    /**
     * 打开GitHub仓库
     */
    'open-github'() {
        EcsFrameworkHandler.openGitHub();
    },

    /**
     * 打开QQ群
     */
    'open-qq-group'() {
        EcsFrameworkHandler.openQQGroup();
    },

    // ================ 行为树管理 ================
    /**
     * 安装行为树AI系统
     */
    async 'install-behavior-tree'() {
        try {
            return await BehaviorTreeHandler.install();
        } catch (error) {
            console.error('安装行为树AI系统失败:', error);
            return false;
        }
    },

    /**
     * 更新行为树AI系统
     */
    async 'update-behavior-tree'() {
        try {
            return await BehaviorTreeHandler.update();
        } catch (error) {
            console.error('更新行为树AI系统失败:', error);
            return false;
        }
    },

    /**
     * 检查行为树AI是否已安装
     */
    'check-behavior-tree-installed'() {
        return BehaviorTreeHandler.checkInstalled();
    },

    /**
     * 打开行为树文档
     */
    'open-behavior-tree-docs'() {
        BehaviorTreeHandler.openDocumentation();
    },

    /**
     * 创建行为树文件
     */
    'create-behavior-tree-file'() {
        BehaviorTreeHandler.createFile();
    },

    /**
     * 加载行为树文件到编辑器
     */
    async 'load-behavior-tree-file'(...args: any[]) {
        const assetInfo = args.length >= 2 ? args[1] : args[0];
        
        try {
            if (!assetInfo || (!assetInfo.file && !assetInfo.path)) {
                throw new Error('无效的文件信息');
            }
            
            await Editor.Panel.open('cocos-ecs-extension.behavior-tree');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const result = await Editor.Message.request('cocos-ecs-extension', 'behavior-tree-panel-load-file', assetInfo);
            
        } catch (error) {
            Editor.Dialog.error('打开失败', {
                detail: `打开行为树文件失败：\n\n${error instanceof Error ? error.message : String(error)}`
            });
        }
    },

    /**
     * 从编辑器创建行为树文件
     */
    'create-behavior-tree-from-editor'(event: any, data: any) {
        BehaviorTreeHandler.createFromEditor(data);
    },

    /**
     * 覆盖现有行为树文件
     */
    'overwrite-behavior-tree-file'(...args: any[]) {
        const data = args.length >= 2 ? args[1] : args[0];
        
        if (data && data.filePath) {
            BehaviorTreeHandler.overwriteFile(data);
        } else {
            throw new Error('文件路径不存在或数据无效');
        }
    },

    // ================ 热更新管理 ================
    /**
     * 检查插件更新
     */
    'check-plugin-updates'() {
        return HotUpdateHandler.checkForUpdates(false);
    },

    /**
     * 设置热更新配置
     */
    'set-hot-update-config'(...args: any[]) {
        const config = args.length >= 2 ? args[1] : args[0];
        return HotUpdateHandler.setConfig(config);
    },

    /**
     * 获取热更新配置
     */
    'get-hot-update-config'() {
        return HotUpdateHandler.getConfig();
    },
};



/**
 * @en Method triggered when the extension is started
 * @zh 启动扩展时触发的方法
 */
export function load() {
    console.log('[Cocos ECS Extension] 扩展已加载');
    
    // 初始化热更新系统
    HotUpdateHandler.initialize().catch(error => {
        console.error('[Cocos ECS Extension] 热更新初始化失败:', error);
    });
}

/**
 * @en Method triggered when the extension is uninstalled
 * @zh 卸载扩展时触发的方法
 */
export function unload() {
    console.log('[Cocos ECS Extension] 扩展已卸载');
    
    // 清理热更新资源
    HotUpdateHandler.cleanup();
}
