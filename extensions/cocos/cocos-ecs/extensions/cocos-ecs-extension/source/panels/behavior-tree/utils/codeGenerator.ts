import { TreeNode } from '../types';
import { getNodeById, getRootNode } from './nodeUtils';
import { nodeTemplates } from '../data/nodeTemplates';

/**
 * 生成TypeScript代码
 */
export function generateTypeScriptCode(nodes: TreeNode[]): string {
    const imports = getRequiredImports(nodes);
    const root = getRootNode(nodes);
    
    if (!root) {
        return '// 请先添加根节点';
    }
    
    const importsCode = imports.map(imp => `import { ${imp} } from '@esengine/ai';`).join('\n');
    const treeCode = generateNodeCode(root, nodes);
    
    return `${importsCode}

// 自动生成的行为树代码
export function createBehaviorTree() {
    return ${treeCode};
}`;
}

/**
 * 获取需要导入的类
 */
export function getRequiredImports(nodes: TreeNode[]): string[] {
    const imports = new Set<string>();
    
    nodes.forEach(node => {
        const template = nodeTemplates.find(t => t.className === node.type || t.type === node.type);
        if (template?.className) {
            imports.add(template.className);
        }
    });
    
    return Array.from(imports);
}

/**
 * 生成单个节点的代码
 */
export function generateNodeCode(node: TreeNode, allNodes: TreeNode[], indent: number = 0): string {
    const spaces = '    '.repeat(indent);
    const template = nodeTemplates.find(t => t.className === node.type);
    
    if (!template) {
        return `${spaces}// 未知节点类型: ${node.type}`;
    }
    
    let code = `${spaces}new ${template.className}(`;
    
    // 构造函数参数
    const params: string[] = [];
    
    // 处理属性
    if (node.properties && Object.keys(node.properties).length > 0) {
        const propsCode: string[] = [];
        
        Object.entries(node.properties).forEach(([key, prop]) => {
            if (prop.type === 'code' && prop.value) {
                propsCode.push(`${key}: ${prop.value}`);
            } else if (prop.type === 'string' && prop.value !== undefined) {
                propsCode.push(`${key}: "${prop.value}"`);
            } else if (prop.type === 'number' && prop.value !== undefined) {
                propsCode.push(`${key}: ${prop.value}`);
            } else if (prop.type === 'boolean' && prop.value !== undefined) {
                propsCode.push(`${key}: ${prop.value}`);
            } else if (prop.type === 'select' && prop.value !== undefined) {
                propsCode.push(`${key}: "${prop.value}"`);
            }
        });
        
        if (propsCode.length > 0) {
            params.push(`{\n${spaces}    ${propsCode.join(',\n' + spaces + '    ')}\n${spaces}}`);
        }
    }
    
    code += params.join(', ');
    
    // 子节点
    if (node.children && node.children.length > 0) {
        const children = node.children
            .map(childId => getNodeById(allNodes, childId))
            .filter(Boolean)
            .map(child => generateNodeCode(child!, allNodes, indent + 1));
        
        if (children.length > 0) {
            if (params.length > 0) code += ', ';
            code += '[\n' + children.join(',\n') + '\n' + spaces + ']';
        }
    }
    
    code += ')';
    return code;
}

/**
 * 生成JSON代码
 */
export function generateJSONCode(nodes: TreeNode[]): string {
    const root = getRootNode(nodes);
    
    if (!root) {
        return '// 请先添加根节点';
    }
    
    const treeData = generateNodeJSON(root, nodes);
    
    return JSON.stringify({
        type: 'BehaviorTree',
        version: '1.0',
        created: new Date().toISOString(),
        root: treeData
    }, null, 2);
}

/**
 * 生成单个节点的JSON
 */
export function generateNodeJSON(node: TreeNode, allNodes: TreeNode[]): any {
    const nodeData: any = {
        id: node.id,
        type: node.type,
        name: node.name,
        description: node.description,
        position: { x: node.x, y: node.y }
    };
    
    // 添加属性
    if (node.properties && Object.keys(node.properties).length > 0) {
        nodeData.properties = {};
        Object.entries(node.properties).forEach(([key, prop]) => {
            if (prop.value !== undefined) {
                nodeData.properties[key] = prop.value;
            }
        });
    }
    
    // 添加子节点
    if (node.children && node.children.length > 0) {
        nodeData.children = node.children
            .map(childId => getNodeById(allNodes, childId))
            .filter(Boolean)
            .map(child => generateNodeJSON(child!, allNodes));
    }
    
    return nodeData;
}

/**
 * 根据导出格式生成代码
 */
export function generateCode(nodes: TreeNode[], format: string): string {
    switch (format) {
        case 'typescript':
            return generateTypeScriptCode(nodes);
        case 'json':
            return generateJSONCode(nodes);
        default:
            return generateTypeScriptCode(nodes);
    }
}

/**
 * 验证生成的代码
 */
export function validateGeneratedCode(code: string, format: string): { isValid: boolean; error?: string } {
    try {
        if (format === 'json') {
            JSON.parse(code);
        }
        // TypeScript代码的验证可以在这里添加更复杂的逻辑
        return { isValid: true };
    } catch (error) {
        return { 
            isValid: false, 
            error: error instanceof Error ? error.message : '未知错误'
        };
    }
} 