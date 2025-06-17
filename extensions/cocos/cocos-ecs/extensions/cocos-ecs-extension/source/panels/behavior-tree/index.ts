import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { createApp, App, defineComponent } from 'vue';
import { useBehaviorTreeEditor } from './composables/useBehaviorTreeEditor';

const panelDataMap = new WeakMap<any, App>();

module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },

    template: readFileSync(join(__dirname, '../../../static/template/behavior-tree/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/behavior-tree/index.css'), 'utf-8'),

    $: {
        app: '#behavior-tree-app',
    },

    methods: {
        sendToMain(message: string, ...args: any[]) {
            Editor.Message.send('cocos-ecs-extension', message, ...args);
        }
    },

    ready() {
        if (this.$.app) {
            const app = createApp({});
            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');

            // 树节点组件
            app.component('tree-node-item', defineComponent({
                props: ['node', 'level', 'getNodeByIdLocal'],
                emits: ['node-select'],
                template: readFileSync(join(__dirname, '../../../static/template/behavior-tree/TreeNodeItem.html'), 'utf-8')
            }));

            // 行为树编辑器组件
            app.component('BehaviorTreeEditor', defineComponent({
                setup() {
                    const editor = useBehaviorTreeEditor();
                    return editor;
                },
                template: readFileSync(join(__dirname, '../../../static/template/behavior-tree/BehaviorTreeEditor.html'), 'utf-8')
            }));

            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
    },

    beforeClose() { },

    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
        }
    },
}); 