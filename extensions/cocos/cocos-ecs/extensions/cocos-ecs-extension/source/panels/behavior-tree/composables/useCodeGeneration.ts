import { Ref } from 'vue';
import { TreeNode } from '../types';
import { NodeTemplate } from '../data/nodeTemplates';

/**
 * 代码生成管理
 */
export function useCodeGeneration(
    treeNodes: Ref<TreeNode[]>,
    nodeTemplates: Ref<NodeTemplate[]>,
    getNodeByIdLocal: (id: string) => TreeNode | undefined,
    rootNode: () => TreeNode | null
) {
    
    // TypeScript代码生成
    const generateTypeScriptCode = (): string => {
        const imports = getRequiredImports();
        const root = rootNode();
        
        if (!root) {
            return '// 请先添加根节点';
        }
        
        const importsCode = imports.map(imp => `import { ${imp} } from '@esengine/ai';`).join('\n');
        const treeCode = generateNodeCode(root);
        
        return `${importsCode}

// 自动生成的行为树代码
export function createBehaviorTree() {
    return ${treeCode};
}`;
    };

    const getRequiredImports = (): string[] => {
        const imports = new Set<string>();
        
        treeNodes.value.forEach(node => {
            const template = nodeTemplates.value.find(t => t.className === node.type || t.type === node.type);
            if (template?.className) {
                imports.add(template.className);
            }
        });
        
        return Array.from(imports);
    };

    const generateNodeCode = (node: TreeNode, indent: number = 0): string => {
        const spaces = '    '.repeat(indent);
        const template = nodeTemplates.value.find(t => t.className === node.type);
        
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
                .map(childId => getNodeByIdLocal(childId))
                .filter(Boolean)
                .map(child => generateNodeCode(child!, indent + 1));
            
            if (children.length > 0) {
                if (params.length > 0) code += ', ';
                code += '[\n' + children.join(',\n') + '\n' + spaces + ']';
            }
        }
        
        code += ')';
        return code;
    };

    return {
        generateTypeScriptCode,
        generateNodeCode,
        getRequiredImports
    };
} 