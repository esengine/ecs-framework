/**
 * AST 解析器 - 提取 WorkerEntitySystem 子类信息
 * AST Parser - Extract WorkerEntitySystem subclass information
 */

import { Project, SyntaxKind, ClassDeclaration, MethodDeclaration, Node } from 'ts-morph';
import * as path from 'path';
import type { WorkerSystemInfo, GeneratorConfig } from './types';

/**
 * 解析项目中的 WorkerEntitySystem 子类
 * Parse WorkerEntitySystem subclasses in the project
 */
export function parseWorkerSystems(config: GeneratorConfig): WorkerSystemInfo[] {
    const project = new Project({
        tsConfigFilePath: config.tsConfigPath,
        skipAddingFilesFromTsConfig: true,
    });

    // 添加源文件
    // Add source files
    const globPattern = path.join(config.srcDir, '**/*.ts').replace(/\\/g, '/');
    project.addSourceFilesAtPaths(globPattern);

    const results: WorkerSystemInfo[] = [];

    for (const sourceFile of project.getSourceFiles()) {
        const filePath = sourceFile.getFilePath();

        // 跳过 node_modules 和 .d.ts 文件
        // Skip node_modules and .d.ts files
        if (filePath.includes('node_modules') || filePath.endsWith('.d.ts')) {
            continue;
        }

        for (const classDecl of sourceFile.getClasses()) {
            const info = extractWorkerSystemInfo(classDecl, filePath, config.verbose);
            if (info) {
                results.push(info);
            }
        }
    }

    return results;
}

/**
 * 检查类是否继承自 WorkerEntitySystem
 * Check if class extends WorkerEntitySystem
 */
function isWorkerEntitySystemSubclass(classDecl: ClassDeclaration): boolean {
    const extendsClause = classDecl.getExtends();
    if (!extendsClause) {
        return false;
    }

    const extendsText = extendsClause.getText();

    // 直接检查是否继承 WorkerEntitySystem
    // Directly check if extends WorkerEntitySystem
    if (extendsText.startsWith('WorkerEntitySystem')) {
        return true;
    }

    // 递归检查基类（如果需要）
    // Recursively check base class (if needed)
    // 这里简化处理，只检查直接继承
    // Simplified: only check direct inheritance

    return false;
}

/**
 * 提取 WorkerEntitySystem 子类信息
 * Extract WorkerEntitySystem subclass information
 */
function extractWorkerSystemInfo(
    classDecl: ClassDeclaration,
    filePath: string,
    verbose?: boolean
): WorkerSystemInfo | null {
    if (!isWorkerEntitySystemSubclass(classDecl)) {
        return null;
    }

    const className = classDecl.getName();
    if (!className) {
        return null;
    }

    if (verbose) {
        console.log(`  Found WorkerEntitySystem: ${className} in ${filePath}`);
    }

    // 查找 workerProcess 方法
    // Find workerProcess method
    const workerProcessMethod = classDecl.getMethod('workerProcess');
    if (!workerProcessMethod) {
        if (verbose) {
            console.log(`    Warning: No workerProcess method found in ${className}`);
        }
        return null;
    }

    // 提取方法体
    // Extract method body
    const workerProcessBody = extractMethodBody(workerProcessMethod);
    if (!workerProcessBody) {
        if (verbose) {
            console.log(`    Warning: Could not extract workerProcess body from ${className}`);
        }
        return null;
    }

    // 提取参数名
    // Extract parameter names
    const params = workerProcessMethod.getParameters();
    const workerProcessParams = {
        entities: params[0]?.getName() || 'entities',
        deltaTime: params[1]?.getName() || 'deltaTime',
        config: params[2]?.getName() || 'config',
    };

    // 尝试提取 getSharedArrayBufferProcessFunction
    // Try to extract getSharedArrayBufferProcessFunction
    let sharedBufferProcessBody: string | undefined;
    const sharedBufferMethod = classDecl.getMethod('getSharedArrayBufferProcessFunction');
    if (sharedBufferMethod) {
        sharedBufferProcessBody = extractSharedBufferFunctionBody(sharedBufferMethod);
    }

    // 尝试提取 entityDataSize
    // Try to extract entityDataSize
    let entityDataSize: number | undefined;
    const getDefaultEntityDataSizeMethod = classDecl.getMethod('getDefaultEntityDataSize');
    if (getDefaultEntityDataSizeMethod) {
        entityDataSize = extractEntityDataSize(getDefaultEntityDataSizeMethod);
    }

    // 尝试从构造函数中提取 workerScriptPath 配置
    // Try to extract workerScriptPath from constructor
    const workerScriptPath = extractWorkerScriptPath(classDecl, verbose);

    return {
        className,
        filePath,
        workerProcessBody,
        workerProcessParams,
        sharedBufferProcessBody,
        entityDataSize,
        workerScriptPath,
    };
}

/**
 * 提取方法体（去掉方法签名，保留函数体内容）
 * Extract method body (remove method signature, keep function body content)
 */
function extractMethodBody(method: MethodDeclaration): string | null {
    const body = method.getBody();
    if (!body) {
        return null;
    }

    // 获取方法体的文本
    // Get method body text
    let bodyText = body.getText();

    // 去掉外层的花括号
    // Remove outer braces
    if (bodyText.startsWith('{') && bodyText.endsWith('}')) {
        bodyText = bodyText.slice(1, -1).trim();
    }

    return bodyText;
}

/**
 * 提取 getSharedArrayBufferProcessFunction 返回的函数体
 * Extract function body returned by getSharedArrayBufferProcessFunction
 */
function extractSharedBufferFunctionBody(method: MethodDeclaration): string | undefined {
    const body = method.getBody();
    if (!body) {
        return undefined;
    }

    // 查找 return 语句中的函数表达式
    // Find function expression in return statement
    const returnStatements = body.getDescendantsOfKind(SyntaxKind.ReturnStatement);
    for (const returnStmt of returnStatements) {
        const expression = returnStmt.getExpression();
        if (expression) {
            // 检查是否是函数表达式或箭头函数
            // Check if it's a function expression or arrow function
            if (Node.isFunctionExpression(expression) || Node.isArrowFunction(expression)) {
                const funcBody = expression.getBody();
                if (funcBody) {
                    let bodyText = funcBody.getText();
                    if (bodyText.startsWith('{') && bodyText.endsWith('}')) {
                        bodyText = bodyText.slice(1, -1).trim();
                    }
                    return bodyText;
                }
            }
        }
    }

    return undefined;
}

/**
 * 提取 entityDataSize 值
 * Extract entityDataSize value
 */
function extractEntityDataSize(method: MethodDeclaration): number | undefined {
    const body = method.getBody();
    if (!body) {
        return undefined;
    }

    // 查找 return 语句
    // Find return statement
    const returnStatements = body.getDescendantsOfKind(SyntaxKind.ReturnStatement);
    for (const returnStmt of returnStatements) {
        const expression = returnStmt.getExpression();
        if (expression && Node.isNumericLiteral(expression)) {
            return parseInt(expression.getText(), 10);
        }
    }

    return undefined;
}

/**
 * 从构造函数中提取 workerScriptPath 配置
 * Extract workerScriptPath from constructor
 */
function extractWorkerScriptPath(classDecl: ClassDeclaration, verbose?: boolean): string | undefined {
    // 查找构造函数
    // Find constructor
    const constructors = classDecl.getConstructors();
    if (constructors.length === 0) {
        return undefined;
    }

    const constructor = constructors[0]!;
    const body = constructor.getBody();
    if (!body) {
        return undefined;
    }

    const bodyText = body.getText();

    // 使用正则表达式查找 workerScriptPath: 'xxx' 或 workerScriptPath: "xxx"
    // Use regex to find workerScriptPath: 'xxx' or workerScriptPath: "xxx"
    const patterns = [
        /workerScriptPath\s*:\s*['"]([^'"]+)['"]/,
        /workerScriptPath\s*:\s*`([^`]+)`/,
    ];

    for (const pattern of patterns) {
        const match = bodyText.match(pattern);
        if (match && match[1]) {
            if (verbose) {
                console.log(`    Found workerScriptPath: ${match[1]}`);
            }
            return match[1];
        }
    }

    return undefined;
}
