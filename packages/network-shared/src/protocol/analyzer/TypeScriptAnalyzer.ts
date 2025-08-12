/**
 * TypeScript 协议分析器
 * 
 * 负责解析 TypeScript 代码中的网络组件装饰器，
 * 提取类型信息并构建协议定义
 */

// TypeScript编译器API - 开发时依赖
declare const require: any;

let ts: any;
let path: any;
let fs: any;

try {
  ts = require('typescript');
  path = require('path');
  fs = require('fs');
} catch (e) {
  // 在运行时如果没有这些依赖，使用占位符
  ts = {
    ScriptTarget: { ES2020: 99 },
    ModuleKind: { ES2020: 99 },
    createProgram: () => ({ getSourceFiles: () => [] }),
    isClassDeclaration: () => false,
    isDecorator: () => false,
    isIdentifier: () => false,
    isCallExpression: () => false,
    forEachChild: () => {}
  };
  path = { join: (...args: string[]) => args.join('/') };
  fs = { existsSync: () => false, readFileSync: () => '{}' };
}

import {
  ComponentProtocol,
  ProtocolField,
  ProtocolRpc,
  RpcParameter,
  SerializeType,
  ProtocolAnalysisResult,
  ProtocolError,
  ProtocolWarning,
  ProtocolCompilerConfig
} from '../types/ProtocolTypes';

/**
 * TypeScript 协议分析器
 */
export class TypeScriptAnalyzer {
  private program: ts.Program;
  private typeChecker: ts.TypeChecker;
  private config: ProtocolCompilerConfig;
  
  private components: ComponentProtocol[] = [];
  private errors: ProtocolError[] = [];
  private warnings: ProtocolWarning[] = [];
  private dependencies: Map<string, string[]> = new Map();

  constructor(config: ProtocolCompilerConfig) {
    this.config = config;
    this.initializeTypeScript();
  }

  /**
   * 初始化 TypeScript 编译器
   */
  private initializeTypeScript(): void {
    if (!ts || !path || !fs) {
      throw new Error('TypeScript analyzer requires typescript, path, and fs modules');
    }
    
    const configPath = this.config.tsconfigPath || path.join(this.config.inputDir, 'tsconfig.json');
    
    let compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2020,
      lib: ['ES2020'],
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      strict: true
    };

    // 加载 tsconfig.json
    if (fs.existsSync(configPath)) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      if (configFile.error) {
        this.addError('syntax', `Failed to read tsconfig.json: ${configFile.error.messageText}`);
      } else {
        const parsedConfig = ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          path.dirname(configPath)
        );
        compilerOptions = { ...compilerOptions, ...parsedConfig.options };
      }
    }

    // 收集所有 TypeScript 文件
    const files = this.collectTypeScriptFiles(this.config.inputDir);
    
    this.program = ts.createProgram(files, compilerOptions);
    this.typeChecker = this.program.getTypeChecker();
  }

  /**
   * 收集 TypeScript 文件
   */
  private collectTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    const excludePatterns = this.config.excludePatterns || ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'];

    function collectFiles(currentDir: string): void {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // 检查是否应该排除此目录
          const shouldExclude = excludePatterns.some(pattern => 
            fullPath.includes(pattern.replace('**/', '').replace('/**', ''))
          );
          
          if (!shouldExclude) {
            collectFiles(fullPath);
          }
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          // 检查是否应该排除此文件
          const shouldExclude = excludePatterns.some(pattern => {
            if (pattern.includes('**')) {
              const regex = new RegExp(pattern.replace('**/', '.*').replace('*', '.*'));
              return regex.test(fullPath);
            }
            return fullPath.endsWith(pattern.replace('*', ''));
          });

          if (!shouldExclude) {
            files.push(fullPath);
          }
        }
      }
    }

    collectFiles(dir);
    return files;
  }

  /**
   * 分析网络协议
   */
  public analyze(): ProtocolAnalysisResult {
    this.components = [];
    this.errors = [];
    this.warnings = [];
    this.dependencies.clear();

    const sourceFiles = this.program.getSourceFiles().filter(sf => 
      !sf.isDeclarationFile && sf.fileName.includes(this.config.inputDir)
    );

    // 分析每个源文件
    for (const sourceFile of sourceFiles) {
      this.analyzeSourceFile(sourceFile);
    }

    // 检查依赖关系
    this.validateDependencies();

    return {
      files: sourceFiles.map(sf => sf.fileName),
      components: this.components,
      dependencies: this.dependencies,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * 分析单个源文件
   */
  private analyzeSourceFile(sourceFile: any): void {
    const visit = (node: any): void => {
      if (ts.isClassDeclaration(node) && this.isNetworkComponent(node)) {
        this.analyzeNetworkComponent(node, sourceFile);
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  /**
   * 检查是否为网络组件
   */
  private isNetworkComponent(node: any): boolean {
    if (!node.modifiers) return false;
    
    return node.modifiers.some((modifier: any) => {
      if (ts.isDecorator(modifier)) {
        const expression = modifier.expression;
        if (ts.isCallExpression(expression) || ts.isIdentifier(expression)) {
          const decoratorName = this.getDecoratorName(expression);
          return decoratorName === 'NetworkComponent';
        }
      }
      return false;
    });
  }

  /**
   * 获取装饰器名称
   */
  private getDecoratorName(expression: ts.Expression): string | null {
    if (ts.isIdentifier(expression)) {
      return expression.text;
    }
    if (ts.isCallExpression(expression) && ts.isIdentifier(expression.expression)) {
      return expression.expression.text;
    }
    return null;
  }

  /**
   * 分析网络组件
   */
  private analyzeNetworkComponent(node: any, sourceFile: any): void {
    const className = node.name?.text;
    if (!className) {
      this.addError('syntax', 'NetworkComponent class must have a name', sourceFile, node);
      return;
    }

    const componentProtocol: ComponentProtocol = {
      typeName: className,
      version: 1,
      syncVars: [],
      rpcs: [],
      batchEnabled: false,
      deltaEnabled: false
    };

    // 分析类成员
    for (const member of node.members) {
      if (ts.isPropertyDeclaration(member)) {
        const syncVar = this.analyzeSyncVar(member, sourceFile);
        if (syncVar) {
          componentProtocol.syncVars.push(syncVar);
        }
      } else if (ts.isMethodDeclaration(member)) {
        const rpc = this.analyzeRpc(member, sourceFile);
        if (rpc) {
          componentProtocol.rpcs.push(rpc);
        }
      }
    }

    // 分析装饰器选项
    this.analyzeComponentDecorator(node, componentProtocol, sourceFile);

    this.components.push(componentProtocol);
  }

  /**
   * 分析 SyncVar 属性
   */
  private analyzeSyncVar(node: ts.PropertyDeclaration, sourceFile: ts.SourceFile): ProtocolField | null {
    if (!this.hasSyncVarDecorator(node)) {
      return null;
    }

    const propertyName = this.getPropertyName(node);
    if (!propertyName) {
      this.addError('syntax', 'SyncVar property must have a name', sourceFile, node);
      return null;
    }

    const type = this.typeChecker.getTypeAtLocation(node);
    const serializeType = this.inferSerializeType(type, node, sourceFile);

    if (!serializeType) {
      this.addError('type', `Cannot infer serialize type for property: ${propertyName}`, sourceFile, node);
      return null;
    }

    const field: ProtocolField = {
      name: propertyName,
      type: serializeType,
      id: this.generateFieldId(propertyName),
      optional: this.isOptionalProperty(node),
      repeated: this.isArrayType(type)
    };

    // 分析装饰器选项
    this.analyzeSyncVarDecorator(node, field, sourceFile);

    return field;
  }

  /**
   * 分析 RPC 方法
   */
  private analyzeRpc(node: ts.MethodDeclaration, sourceFile: ts.SourceFile): ProtocolRpc | null {
    const rpcType = this.getRpcType(node);
    if (!rpcType) {
      return null;
    }

    const methodName = this.getMethodName(node);
    if (!methodName) {
      this.addError('syntax', 'RPC method must have a name', sourceFile, node);
      return null;
    }

    const parameters: RpcParameter[] = [];
    
    // 分析参数
    if (node.parameters) {
      for (const param of node.parameters) {
        const paramName = param.name.getText();
        const paramType = this.typeChecker.getTypeAtLocation(param);
        const serializeType = this.inferSerializeType(paramType, param, sourceFile);

        if (serializeType === null) {
          this.addError('type', `Cannot infer type for parameter: ${paramName}`, sourceFile, param);
          continue;
        }

        parameters.push({
          name: paramName,
          type: serializeType,
          optional: param.questionToken !== undefined,
          isArray: this.isArrayType(paramType)
        });
      }
    }

    // 分析返回类型
    let returnType: SerializeType | undefined;
    if (node.type && !this.isVoidType(node.type)) {
      const returnTypeNode = this.typeChecker.getTypeAtLocation(node.type);
      returnType = this.inferSerializeType(returnTypeNode, node.type, sourceFile);
    }

    const rpc: ProtocolRpc = {
      name: methodName,
      id: this.generateRpcId(methodName),
      type: rpcType,
      parameters,
      returnType
    };

    // 分析装饰器选项
    this.analyzeRpcDecorator(node, rpc, sourceFile);

    return rpc;
  }

  /**
   * 检查是否有 SyncVar 装饰器
   */
  private hasSyncVarDecorator(node: ts.PropertyDeclaration): boolean {
    return this.hasDecorator(node, 'SyncVar');
  }

  /**
   * 获取 RPC 类型
   */
  private getRpcType(node: ts.MethodDeclaration): 'client-rpc' | 'server-rpc' | null {
    if (this.hasDecorator(node, 'ClientRpc')) {
      return 'client-rpc';
    }
    if (this.hasDecorator(node, 'ServerRpc') || this.hasDecorator(node, 'Command')) {
      return 'server-rpc';
    }
    return null;
  }

  /**
   * 检查是否有特定装饰器
   */
  private hasDecorator(node: ts.Node, decoratorName: string): boolean {
    if (!ts.canHaveModifiers(node) || !ts.getModifiers(node)) return false;
    
    const modifiers = ts.getModifiers(node)!;
    return modifiers.some(modifier => {
      if (ts.isDecorator(modifier)) {
        const name = this.getDecoratorName(modifier.expression);
        return name === decoratorName;
      }
      return false;
    });
  }

  /**
   * 推导序列化类型
   */
  private inferSerializeType(type: ts.Type, node: ts.Node, sourceFile: ts.SourceFile): SerializeType | null {
    const typeString = this.typeChecker.typeToString(type);

    // 自定义类型映射
    if (this.config.typeMapping?.has(typeString)) {
      return this.config.typeMapping.get(typeString)!;
    }

    // 基础类型推导
    if (type.flags & ts.TypeFlags.Boolean) return SerializeType.BOOLEAN;
    if (type.flags & ts.TypeFlags.Number) return SerializeType.FLOAT64;
    if (type.flags & ts.TypeFlags.String) return SerializeType.STRING;

    // 对象类型推导
    if (type.flags & ts.TypeFlags.Object) {
      // 检查是否为数组
      if (this.typeChecker.isArrayType(type)) {
        return SerializeType.ARRAY;
      }

      // 检查常见游戏类型
      if (typeString.includes('Vector2')) return SerializeType.VECTOR2;
      if (typeString.includes('Vector3')) return SerializeType.VECTOR3;
      if (typeString.includes('Quaternion')) return SerializeType.QUATERNION;
      if (typeString.includes('Color')) return SerializeType.COLOR;

      // 默认为对象类型
      return SerializeType.OBJECT;
    }

    this.addWarning('performance', `Unknown type: ${typeString}, falling back to JSON`, sourceFile, node);
    return SerializeType.JSON;
  }

  /**
   * 获取属性名
   */
  private getPropertyName(node: ts.PropertyDeclaration): string | null {
    if (ts.isIdentifier(node.name)) {
      return node.name.text;
    }
    return null;
  }

  /**
   * 获取方法名
   */
  private getMethodName(node: ts.MethodDeclaration): string | null {
    if (ts.isIdentifier(node.name)) {
      return node.name.text;
    }
    return null;
  }

  /**
   * 检查是否为可选属性
   */
  private isOptionalProperty(node: ts.PropertyDeclaration): boolean {
    return node.questionToken !== undefined;
  }

  /**
   * 检查是否为数组类型
   */
  private isArrayType(type: ts.Type): boolean {
    return this.typeChecker.isArrayType(type);
  }

  /**
   * 检查是否为 void 类型
   */
  private isVoidType(node: ts.TypeNode): boolean {
    return ts.isTypeReferenceNode(node) && node.typeName.getText() === 'void';
  }

  /**
   * 生成字段 ID
   */
  private generateFieldId(fieldName: string): number {
    // 简单的哈希函数生成字段 ID
    let hash = 0;
    for (let i = 0; i < fieldName.length; i++) {
      const char = fieldName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为 32位整数
    }
    return Math.abs(hash) % 10000 + 1; // 确保 ID 为正数且在合理范围内
  }

  /**
   * 生成 RPC ID
   */
  private generateRpcId(rpcName: string): number {
    return this.generateFieldId(rpcName) + 10000; // RPC ID 从 10000 开始
  }

  /**
   * 分析组件装饰器选项
   */
  private analyzeComponentDecorator(
    node: ts.ClassDeclaration, 
    protocol: ComponentProtocol, 
    sourceFile: ts.SourceFile
  ): void {
    const decorator = this.findDecorator(node, 'NetworkComponent');
    if (decorator && ts.isCallExpression(decorator.expression)) {
      const args = decorator.expression.arguments;
      if (args.length > 0 && ts.isObjectLiteralExpression(args[0])) {
        const options = args[0];
        
        for (const prop of options.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            const propName = prop.name.text;
            
            if (propName === 'batchEnabled' && this.isBooleanLiteral(prop.initializer)) {
              protocol.batchEnabled = (prop.initializer as ts.BooleanLiteral).token === ts.SyntaxKind.TrueKeyword;
            }
            
            if (propName === 'deltaEnabled' && this.isBooleanLiteral(prop.initializer)) {
              protocol.deltaEnabled = (prop.initializer as ts.BooleanLiteral).token === ts.SyntaxKind.TrueKeyword;
            }
          }
        }
      }
    }
  }

  /**
   * 分析 SyncVar 装饰器选项
   */
  private analyzeSyncVarDecorator(
    node: ts.PropertyDeclaration, 
    field: ProtocolField, 
    sourceFile: ts.SourceFile
  ): void {
    const decorator = this.findDecorator(node, 'SyncVar');
    if (decorator && ts.isCallExpression(decorator.expression)) {
      const args = decorator.expression.arguments;
      if (args.length > 0 && ts.isObjectLiteralExpression(args[0])) {
        const options = args[0];
        
        for (const prop of options.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            const propName = prop.name.text;
            
            if (propName === 'serialize' && ts.isStringLiteral(prop.initializer)) {
              const serializeType = prop.initializer.text as SerializeType;
              if (Object.values(SerializeType).includes(serializeType)) {
                field.type = serializeType;
              }
            }
          }
        }
      }
    }
  }

  /**
   * 分析 RPC 装饰器选项
   */
  private analyzeRpcDecorator(
    node: ts.MethodDeclaration, 
    rpc: ProtocolRpc, 
    sourceFile: ts.SourceFile
  ): void {
    const decoratorName = rpc.type === 'client-rpc' ? 'ClientRpc' : 'ServerRpc';
    const decorator = this.findDecorator(node, decoratorName) || this.findDecorator(node, 'Command');
    
    if (decorator && ts.isCallExpression(decorator.expression)) {
      const args = decorator.expression.arguments;
      if (args.length > 0 && ts.isObjectLiteralExpression(args[0])) {
        const options = args[0];
        
        for (const prop of options.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            const propName = prop.name.text;
            
            if (propName === 'requiresAuth' && this.isBooleanLiteral(prop.initializer)) {
              rpc.requiresAuth = (prop.initializer as ts.BooleanLiteral).token === ts.SyntaxKind.TrueKeyword;
            }
            
            if (propName === 'reliable' && this.isBooleanLiteral(prop.initializer)) {
              rpc.reliable = (prop.initializer as ts.BooleanLiteral).token === ts.SyntaxKind.TrueKeyword;
            }
            
            if (propName === 'rateLimit' && ts.isNumericLiteral(prop.initializer)) {
              rpc.rateLimit = parseInt(prop.initializer.text);
            }
          }
        }
      }
    }
  }

  /**
   * 查找装饰器
   */
  private findDecorator(node: ts.Node, decoratorName: string): ts.Decorator | null {
    if (!ts.canHaveModifiers(node) || !ts.getModifiers(node)) return null;
    
    const modifiers = ts.getModifiers(node)!;
    for (const modifier of modifiers) {
      if (ts.isDecorator(modifier)) {
        const name = this.getDecoratorName(modifier.expression);
        if (name === decoratorName) {
          return modifier;
        }
      }
    }
    return null;
  }

  /**
   * 检查是否为布尔字面量
   */
  private isBooleanLiteral(node: ts.Node): node is ts.BooleanLiteral {
    return node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword;
  }

  /**
   * 验证依赖关系
   */
  private validateDependencies(): void {
    // 检查循环依赖等问题
    // 这里可以添加更复杂的依赖分析逻辑
  }

  /**
   * 添加错误
   */
  private addError(
    type: ProtocolError['type'], 
    message: string, 
    sourceFile?: ts.SourceFile, 
    node?: ts.Node
  ): void {
    const error: ProtocolError = {
      type,
      message,
      file: sourceFile?.fileName,
      line: node ? ts.getLineAndCharacterOfPosition(sourceFile!, node.getStart()).line + 1 : undefined,
      column: node ? ts.getLineAndCharacterOfPosition(sourceFile!, node.getStart()).character + 1 : undefined
    };
    this.errors.push(error);
  }

  /**
   * 添加警告
   */
  private addWarning(
    type: ProtocolWarning['type'], 
    message: string, 
    sourceFile?: ts.SourceFile, 
    node?: ts.Node
  ): void {
    const warning: ProtocolWarning = {
      type,
      message,
      file: sourceFile?.fileName,
      line: node ? ts.getLineAndCharacterOfPosition(sourceFile!, node.getStart()).line + 1 : undefined,
      column: node ? ts.getLineAndCharacterOfPosition(sourceFile!, node.getStart()).character + 1 : undefined
    };
    this.warnings.push(warning);
  }
}