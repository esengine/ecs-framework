import { ensureDir, writeFile } from 'fs-extra';
import { join } from 'path';

/**
 * 代码生成器工具类
 * 用于生成基础的ECS框架代码
 */

interface ComponentOptions {
    includeComments: boolean;
    addProperties: string[];
}

interface SystemOptions {
    includeComments: boolean;
    systemType: 'EntitySystem' | 'ProcessingSystem' | 'IntervalSystem' | 'PassiveSystem';
    requiredComponents: string[];
}

export class CodeGenerator {
    
    /**
     * 生成组件代码
     */
    public async generateComponent(
        name: string, 
        targetDir: string,
        options: ComponentOptions = {
            includeComments: true,
            addProperties: []
        }
    ): Promise<void> {
        const className = `${name}Component`;
        const fileName = `${className}.ts`;
        const filePath = join(targetDir, fileName);

        await ensureDir(targetDir);

        const comments = options.includeComments ? this.generateComponentComments(className) : '';
        const properties = this.generateComponentProperties(options.addProperties);

        const content = `import { Component } from '@esengine/ecs-framework';

${comments}
export class ${className} extends Component {
${properties}
    
    constructor() {
        super();
    }

    /**
     * 重置组件状态
     */
    public reset(): void {
        // 重置组件属性到默认值
${this.generateResetCode(options.addProperties)}
    }
}
`;

        await writeFile(filePath, content, 'utf-8');
    }

    /**
     * 生成系统代码
     */
    public async generateSystem(
        name: string,
        targetDir: string,
        options: SystemOptions = {
            includeComments: true,
            systemType: 'EntitySystem',
            requiredComponents: []
        }
    ): Promise<void> {
        const className = `${name}System`;
        const fileName = `${className}.ts`;
        const filePath = join(targetDir, fileName);

        await ensureDir(targetDir);

        const comments = options.includeComments ? this.generateSystemComments(className, options.systemType) : '';
        const imports = this.getSystemImports(options.systemType, options.requiredComponents);
        const matcherSetup = options.requiredComponents.length > 0 ? 
            `Matcher.empty().all(${options.requiredComponents.join(', ')})` : 
            `Matcher.empty()`;
        
        const processMethod = this.generateProcessMethod(options.systemType, options.requiredComponents, className);

        const content = `${imports}

${comments}
export class ${className} extends ${options.systemType} {

    constructor() {
        super(${matcherSetup}${options.systemType === 'IntervalSystem' ? ', 1000 / 60' : ''})${options.systemType === 'IntervalSystem' ? '; // 60fps' : ';'}
    }

${processMethod}

    /**
     * 系统开始时调用
     */
    public begin(): void {
        super.begin();
        // 添加系统初始化逻辑
    }

    /**
     * 系统结束时调用
     */
    public end(): void {
        // 添加系统清理逻辑
        super.end();
    }
}
`;

        await writeFile(filePath, content, 'utf-8');
    }

    // ============ 辅助方法 ============

    private generateComponentComments(className: string): string {
        return `/**
 * ${className}
 * 
 * 组件描述
 * 
 * @example
 * \`\`\`typescript
 * const entity = scene.createEntity("Example");
 * const component = entity.addComponent(new ${className}());
 * \`\`\`
 */`;
    }

    private generateSystemComments(className: string, systemType: string): string {
        const descriptions = {
            'EntitySystem': '处理拥有特定组件的实体',
            'ProcessingSystem': '执行全局游戏逻辑',
            'IntervalSystem': '按时间间隔处理实体',
            'PassiveSystem': '被动响应事件或手动调用'
        };

        return `/**
 * ${className}
 * 
 * ${descriptions[systemType as keyof typeof descriptions] || '处理游戏逻辑'}
 * 
 * @example
 * \`\`\`typescript
 * const system = new ${className}();
 * scene.addEntityProcessor(system);
 * \`\`\`
 */`;
    }

    private generateComponentProperties(properties: string[]): string {
        if (properties.length === 0) {
            return '    // 添加组件属性\n    // public value: number = 0;';
        }

        return properties.map(prop => {
            const [name, type = 'number', defaultValue = '0'] = prop.split(':');
            return `    public ${name}: ${type} = ${defaultValue};`;
        }).join('\n');
    }

    private generateResetCode(properties: string[]): string {
        if (properties.length === 0) {
            return '        // this.value = 0;';
        }

        return properties.map(prop => {
            const [name, , defaultValue = '0'] = prop.split(':');
            return `        this.${name} = ${defaultValue};`;
        }).join('\n');
    }

    private getSystemImports(systemType: string, requiredComponents: string[]): string {
        const imports = [systemType, 'Entity'];
        
        // 所有系统类型都可能需要Matcher来过滤组件
        if (requiredComponents.length > 0 || systemType === 'EntitySystem' || systemType === 'IntervalSystem' || systemType === 'PassiveSystem') {
            imports.push('Matcher');
        }
        
        return `import { ${imports.join(', ')} } from '@esengine/ecs-framework';${requiredComponents.length > 0 ? '\n' + this.generateComponentImports(requiredComponents) : ''}`;
    }

    private generateComponentImports(components: string[]): string {
        return components.map(comp => `import { ${comp} } from '../components/${comp}';`).join('\n');
    }

    private generateProcessMethod(systemType: string, requiredComponents: string[], className: string): string {
        switch (systemType) {
            case 'EntitySystem':
                return `    protected process(entities: Entity[]): void {
        for (const entity of entities) {
            this.processEntity(entity);
        }
    }

    private processEntity(entity: Entity): void {
${this.generateProcessingLogic(requiredComponents)}
    }`;

            case 'ProcessingSystem':
                return `    public processSystem(): void {
        // 添加全局系统逻辑
        console.log('${className} processSystem called');
    }`;

            case 'IntervalSystem':
                return `    protected process(entities: Entity[]): void {
        const intervalDelta = this.getIntervalDelta();
        console.log(\`${className} executing with interval delta: \${intervalDelta}\`);
        
        for (const entity of entities) {
            this.processEntity(entity, intervalDelta);
        }
    }

    private processEntity(entity: Entity, delta: number): void {
${this.generateProcessingLogic(requiredComponents)}
    }`;

            case 'PassiveSystem':
                return `    /**
     * 被动系统不主动处理实体
     * 通常用于响应事件或被其他系统调用
     */
    public processEntity(entity: Entity): void {
${this.generateProcessingLogic(requiredComponents)}
    }

    /**
     * 手动触发处理
     */
    public trigger(): void {
        for (const entity of this.entities) {
            this.processEntity(entity);
        }
    }`;

            default:
                return '';
        }
    }

    private generateProcessingLogic(requiredComponents: string[]): string {
        if (requiredComponents.length === 0) {
            return '        // 添加处理逻辑';
        }

        const componentVars = requiredComponents.map((comp: string) => {
            const varName = comp.replace('Component', '').toLowerCase();
            return `        const ${varName} = entity.getComponent(${comp});`;
        }).join('\n');

        const nullCheck = requiredComponents.map((comp: string) => {
            const varName = comp.replace('Component', '').toLowerCase();
            return varName;
        }).join(' && ');

        return `${componentVars}
        
        if (${nullCheck}) {
            // 添加处理逻辑
        }`;
    }
}