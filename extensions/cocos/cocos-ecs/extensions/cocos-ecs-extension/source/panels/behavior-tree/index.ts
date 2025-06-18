import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { createApp, App, defineComponent } from 'vue';
import { useBehaviorTreeEditor } from './composables/useBehaviorTreeEditor';
import { EventManager } from './utils/EventManager';

// Vue应用实例
let panelDataMap = new WeakMap<any, any>();

// 待处理的文件队列
let pendingFileData: any = null;
// Vue应用是否已挂载完成
let vueAppMounted: boolean = false;
// 存储面板实例，用于访问面板的DOM元素
let currentPanelInstance: any = null;

/**
 * 面板定义
 */
const panelDefinition = {
    template: readFileSync(join(__dirname, '../../../static/template/behavior-tree/index.html'), 'utf-8'),

    style: [
        readFileSync(join(__dirname, '../../../static/style/behavior-tree/base.css'), 'utf-8'),
        readFileSync(join(__dirname, '../../../static/style/behavior-tree/toolbar.css'), 'utf-8'),
        readFileSync(join(__dirname, '../../../static/style/behavior-tree/panels.css'), 'utf-8'),
        readFileSync(join(__dirname, '../../../static/style/behavior-tree/canvas.css'), 'utf-8'),
        readFileSync(join(__dirname, '../../../static/style/behavior-tree/nodes.css'), 'utf-8'),
        readFileSync(join(__dirname, '../../../static/style/behavior-tree/conditions.css'), 'utf-8'),
        readFileSync(join(__dirname, '../../../static/style/behavior-tree/modals.css'), 'utf-8')
    ].join('\n'),

    $: {
        app: '#behavior-tree-app',
    },

    methods: {
        async loadBehaviorTreeFile(assetInfo: any) {
            try {
                const filePath = assetInfo?.file || assetInfo?.path;
                if (!filePath) {
                    throw new Error('无法获取文件路径');
                }
                
                const fs = require('fs-extra');
                const path = require('path');
                
                if (!fs.existsSync(filePath)) {
                    throw new Error(`文件不存在: ${filePath}`);
                }
                
                const content = await fs.readFile(filePath, 'utf8');
                let fileContent: any;
                
                try {
                    fileContent = JSON.parse(content);
                } catch (parseError) {
                    fileContent = {
                        version: "1.0.0",
                        type: "behavior-tree", 
                        tree: { id: "root", type: "sequence", children: [] }
                    };
                }
                
                const fileInfo = {
                    ...fileContent,
                    _fileInfo: {
                        fileName: path.basename(filePath, path.extname(filePath)),
                        filePath: filePath
                    }
                };
                
                const notifyVueComponent = () => {
                    const appContainer = currentPanelInstance?.$.app;
                    
                    if (appContainer && vueAppMounted) {
                        if (typeof (appContainer as any).loadFileContent === 'function') {
                            (appContainer as any).loadFileContent(fileInfo);
                        } else {
                            const event = new CustomEvent('load-behavior-tree-file', { detail: fileInfo });
                            document.dispatchEvent(event);
                        }
                    } else {
                        pendingFileData = fileInfo;
                    }
                };
                
                notifyVueComponent();
                
                if (pendingFileData) {
                    setTimeout(() => {
                        if (pendingFileData) {
                            notifyVueComponent();
                        }
                    }, 500);
                }
                
                return { success: true, message: '文件加载成功' };
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const event = new CustomEvent('file-load-error', { detail: { error: errorMessage } });
                document.dispatchEvent(event);
                return { success: false, error: errorMessage };
            }
        },
    },

    ready() {
        currentPanelInstance = this;
        
        if (this.$.app) {
            try {
                const BehaviorTreeEditor = defineComponent({
                    setup() {
                        const editor = useBehaviorTreeEditor();
                        return editor;
                    },
                    template: readFileSync(join(__dirname, '../../../static/template/behavior-tree/BehaviorTreeEditor.html'), 'utf-8')
                });

                const app = createApp(BehaviorTreeEditor);
                
                app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
                
                app.config.errorHandler = (err, instance, info) => {
                    console.error('[BehaviorTreePanel] Vue错误:', err, info);
                };

                app.component('tree-node-item', defineComponent({
                    props: ['node', 'level', 'getNodeByIdLocal'],
                    emits: ['node-select'],
                    template: `
                        <div class="tree-node-item" 
                             :class="'level-' + level"
                             @click="$emit('node-select', node)">
                            <span class="node-icon">{{ node.icon || '●' }}</span>
                            <span class="node-name">{{ node.name || node.type }}</span>
                            <span class="node-type">{{ node.type }}</span>
                        </div>
                    `
                }));
                
                app.mount(this.$.app);
                panelDataMap.set(this, app);
                vueAppMounted = true;
                
                if (pendingFileData) {
                    const event = new CustomEvent('load-behavior-tree-file', { detail: pendingFileData });
                    document.dispatchEvent(event);
                    pendingFileData = null;
                }
                
            } catch (error) {
                console.error('[BehaviorTreePanel] 初始化失败:', error);
            }
        }
    },

    /**
     * 面板关闭时调用
     */
    close() {
        try {
            const app = panelDataMap.get(this);
            if (app) {
                app.unmount();
                panelDataMap.delete(this);
            }
            
            EventManager.getInstance().cleanup();
            
        } catch (error) {
            console.error('[BehaviorTreePanel] 清理资源时发生错误:', error);
        }
    }
};

// 导出面板定义 - 使用Editor.Panel.define()包装
module.exports = Editor.Panel.define(panelDefinition); 