import type { Scene, Entity } from '@esengine/ecs-framework';

/**
 * 默认实体创建函数类型
 * Default entity creator function type
 */
export type DefaultEntityCreator = (scene: Scene) => Entity | null;

/**
 * 场景模板配置
 * Scene template configuration
 */
export interface SceneTemplate {
    /** 模板名称 / Template name */
    name: string;
    /** 模板描述 / Template description */
    description?: string;
    /** 默认实体创建器列表 / Default entity creators */
    defaultEntities: DefaultEntityCreator[];
}

/**
 * 场景模板注册表
 * Registry for scene templates that define default entities
 *
 * This allows the editor-app to register what entities should be created
 * when a new scene is created, without editor-core needing to know about
 * specific components like CameraComponent.
 *
 * 这允许 editor-app 注册新建场景时应该创建的实体，
 * 而 editor-core 不需要知道具体的组件如 CameraComponent。
 */
export class SceneTemplateRegistry {
    private static templates: Map<string, SceneTemplate> = new Map();
    private static defaultTemplateName = 'default';

    /**
     * 注册场景模板
     * Register a scene template
     */
    static registerTemplate(template: SceneTemplate): void {
        this.templates.set(template.name, template);
    }

    /**
     * 注册默认实体创建器到默认模板
     * Register a default entity creator to the default template
     */
    static registerDefaultEntity(creator: DefaultEntityCreator): void {
        let defaultTemplate = this.templates.get(this.defaultTemplateName);
        if (!defaultTemplate) {
            defaultTemplate = {
                name: this.defaultTemplateName,
                description: 'Default scene template',
                defaultEntities: []
            };
            this.templates.set(this.defaultTemplateName, defaultTemplate);
        }
        defaultTemplate.defaultEntities.push(creator);
    }

    /**
     * 获取场景模板
     * Get a scene template by name
     */
    static getTemplate(name: string): SceneTemplate | undefined {
        return this.templates.get(name);
    }

    /**
     * 获取默认模板
     * Get the default template
     */
    static getDefaultTemplate(): SceneTemplate | undefined {
        return this.templates.get(this.defaultTemplateName);
    }

    /**
     * 设置默认模板名称
     * Set the default template name
     */
    static setDefaultTemplateName(name: string): void {
        this.defaultTemplateName = name;
    }

    /**
     * 获取所有模板名称
     * Get all template names
     */
    static getTemplateNames(): string[] {
        return Array.from(this.templates.keys());
    }

    /**
     * 为场景创建默认实体
     * Create default entities for a scene using a template
     *
     * @param scene - 目标场景 / Target scene
     * @param templateName - 模板名称，默认使用默认模板 / Template name, uses default if not specified
     * @returns 创建的实体列表 / List of created entities
     */
    static createDefaultEntities(scene: Scene, templateName?: string): Entity[] {
        const template = templateName
            ? this.templates.get(templateName)
            : this.getDefaultTemplate();

        if (!template) {
            return [];
        }

        const entities: Entity[] = [];
        for (const creator of template.defaultEntities) {
            const entity = creator(scene);
            if (entity) {
                entities.push(entity);
            }
        }
        return entities;
    }

    /**
     * 清除所有模板
     * Clear all templates
     */
    static clear(): void {
        this.templates.clear();
    }
}
