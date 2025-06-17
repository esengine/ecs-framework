import { readFileSync } from 'fs-extra';
import { join } from 'path';
import * as path from 'path';
import { createApp, App, defineComponent, ref, reactive } from 'vue';
import { CodeGenerator } from '../../CodeGenerator';

const panelDataMap = new WeakMap<any, App>();

module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: `<div id="app"></div>`,
    style: readFileSync(join(__dirname, '../../../static/style/generator/index.css'), 'utf-8'),
    $: {
        app: '#app',
    },
    ready() {
        if (this.$.app) {
            const app = createApp(defineComponent({
                setup() {
                    const featureName = ref('');
                    const options = reactive({
                        generateComponent: true,
                        generateSystem: false
                    });
                    
                    // 组件选项
                    const componentOptions = reactive({
                        includeComments: true,
                        addProperties: []
                    });
                    
                    // 系统选项
                    const systemOptions = reactive({
                        systemType: 'EntitySystem' as 'EntitySystem' | 'ProcessingSystem' | 'IntervalSystem' | 'PassiveSystem',
                        includeComments: true,
                        requiredComponents: [],
                        filterByComponent: true
                    });
                    
                    // 系统类型定义
                    const systemTypes = [
                        {
                            value: 'EntitySystem',
                            name: 'EntitySystem',
                            icon: '🔄',
                            description: '批量处理实体，适合需要遍历多个实体的逻辑',
                            usage: '适用场景：移动系统、渲染系统、物理碰撞系统'
                        },
                        {
                            value: 'ProcessingSystem',
                            name: 'ProcessingSystem', 
                            icon: '⚡',
                            description: '执行全局逻辑，不依赖特定实体',
                            usage: '适用场景：输入处理、音效管理、场景切换'
                        },
                        {
                            value: 'IntervalSystem',
                            name: 'IntervalSystem',
                            icon: '⏰',
                            description: '按时间间隔执行，可控制执行频率',
                            usage: '适用场景：AI决策、状态保存、定时清理'
                        },
                        {
                            value: 'PassiveSystem',
                            name: 'PassiveSystem',
                            icon: '🎯',
                            description: '被动响应，需要手动调用或事件触发',
                            usage: '适用场景：技能释放、道具使用、特殊效果'
                        }
                    ];

                    const isGenerating = ref(false);
                    const previewCode = ref('');
                    const showPreview = ref(false);

                    // 选择系统类型
                    const selectSystemType = (type: string) => {
                        systemOptions.systemType = type as any;
                        updatePreview();
                    };

                    // 生成代码
                    const generateCode = async () => {
                        if (!featureName.value.trim()) {
                            Editor.Dialog.warn('请输入功能名称', {
                                detail: '请先输入一个有效的功能名称，例如：Health、Movement、Combat等'
                            });
                            return;
                        }

                        if (!options.generateComponent && !options.generateSystem) {
                            Editor.Dialog.warn('请选择生成内容', {
                                detail: '请至少选择一种要生成的代码类型（组件或系统）'
                            });
                            return;
                        }

                        isGenerating.value = true;
                        
                        try {
                            const projectPath = Editor.Project.path;
                            const ecsDir = path.join(projectPath, 'assets', 'scripts', 'ecs');
                            
                            // 检查ECS目录是否存在
                            const fs = require('fs');
                            if (!fs.existsSync(ecsDir)) {
                                Editor.Dialog.warn('ECS目录不存在', {
                                    detail: '请先创建ECS模板后再生成代码。\n\n您可以在欢迎面板中点击"创建ECS模板"来创建基础结构。',
                                });
                                return;
                            }

                            const codeGenerator = new CodeGenerator();
                            const generatedFiles: string[] = [];
                            const baseName = featureName.value.trim();

                            // 生成组件
                            if (options.generateComponent) {
                                const componentDir = path.join(ecsDir, 'components');
                                await codeGenerator.generateComponent(baseName, componentDir, componentOptions);
                                generatedFiles.push(`📦 组件: ${baseName}Component.ts`);
                            }

                            // 生成系统
                            if (options.generateSystem) {
                                const systemDir = path.join(ecsDir, 'systems');
                                // 如果选择了组件过滤且生成了组件，自动添加组件过滤
                                const requiredComponents = (systemOptions.filterByComponent && options.generateComponent) ? 
                                    [`${baseName}Component`] : [];
                                
                                const systemOpts = {
                                    ...systemOptions,
                                    requiredComponents
                                };
                                
                                await codeGenerator.generateSystem(
                                    baseName, 
                                    systemDir,
                                    systemOpts
                                );
                                generatedFiles.push(`⚙️ 系统: ${baseName}System.ts`);
                            }

                            // 成功提示
                            Editor.Dialog.info('代码生成成功', {
                                detail: `✅ ${baseName} 功能代码已生成完成！\n\n生成的文件：\n${generatedFiles.join('\n')}\n\n请刷新资源管理器查看新创建的文件。`
                            });

                            // 清空输入
                            featureName.value = '';
                            
                        } catch (error) {
                            console.error('Failed to generate code:', error);
                            Editor.Dialog.error('代码生成失败', {
                                detail: `生成代码时发生错误：\n\n${error}`
                            });
                        } finally {
                            isGenerating.value = false;
                        }
                    };

                    // 预览代码
                    const previewGeneration = () => {
                        if (!featureName.value.trim()) {
                            showPreview.value = false;
                            return;
                        }

                        const baseName = featureName.value.trim();
                        let preview = `将要生成的文件：\n\n`;

                        if (options.generateComponent) {
                            preview += `📦 组件: ${baseName}Component.ts\n`;
                            preview += `   - 位置: assets/scripts/ecs/components/\n`;
                            preview += `   - 基础组件模板\n\n`;
                        }

                        if (options.generateSystem) {
                            const selectedType = systemTypes.find(t => t.value === systemOptions.systemType);
                            preview += `⚙️ 系统: ${baseName}System.ts\n`;
                            preview += `   - 位置: assets/scripts/ecs/systems/\n`;
                            preview += `   - 类型: ${selectedType?.name || systemOptions.systemType}\n`;
                            
                            if (systemOptions.filterByComponent && options.generateComponent) {
                                preview += `   - 过滤组件: ${baseName}Component\n`;
                            } else if (systemOptions.filterByComponent) {
                                preview += `   - 组件过滤: 需要手动配置\n`;
                            } else {
                                preview += `   - 组件过滤: 无\n`;
                            }
                            preview += `\n`;
                        }

                        previewCode.value = preview;
                        showPreview.value = true;
                    };

                    // 监听功能名称变化
                    const updatePreview = () => {
                        if (featureName.value.trim()) {
                            previewGeneration();
                        } else {
                            showPreview.value = false;
                        }
                    };

                    return {
                        featureName,
                        options,
                        componentOptions,
                        systemOptions,
                        systemTypes,
                        isGenerating,
                        previewCode,
                        showPreview,
                        generateCode,
                        updatePreview,
                        selectSystemType
                    };
                },
                template: readFileSync(join(__dirname, '../../../static/template/generator/index.html'), 'utf-8')
            }));

            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
            panelDataMap.delete(this);
        }
    },
}); 