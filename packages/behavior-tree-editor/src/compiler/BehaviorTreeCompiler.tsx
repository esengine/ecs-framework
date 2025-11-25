import {
    React,
    useState,
    useEffect,
    type ICompiler,
    type CompileResult,
    type CompilerContext,
    type IFileSystem,
    Icons,
    createLogger,
} from '@esengine/editor-runtime';
import { GlobalBlackboardTypeGenerator } from '../generators/GlobalBlackboardTypeGenerator';
import { EditorFormatConverter, BehaviorTreeAssetSerializer } from '@esengine/behavior-tree';
import { useBehaviorTreeDataStore } from '../application/state/BehaviorTreeDataStore';

const { File, FolderTree, FolderOpen } = Icons;

const logger = createLogger('BehaviorTreeCompiler');

export interface BehaviorTreeCompileOptions {
    mode: 'single' | 'workspace';
    assetOutputPath: string;
    typeOutputPath: string;
    selectedFiles: string[];
    fileFormats: Map<string, 'json' | 'binary'>;
    currentFile?: string;
    currentFilePath?: string;
}

export class BehaviorTreeCompiler implements ICompiler<BehaviorTreeCompileOptions> {
    readonly id = 'behavior-tree';
    readonly name = '行为树编译器';
    readonly description = '将行为树文件编译为运行时资产和TypeScript类型定义';

    private projectPath: string | null = null;
    private currentOptions: BehaviorTreeCompileOptions | null = null;

    async compile(options: BehaviorTreeCompileOptions, context: CompilerContext): Promise<CompileResult> {
        this.projectPath = context.projectPath;
        this.currentOptions = options;
        const fileSystem = context.moduleContext.fileSystem;

        if (!this.projectPath) {
            return {
                success: false,
                message: '错误：没有打开的项目',
                errors: ['请先打开一个项目']
            };
        }

        try {
            const outputFiles: string[] = [];
            const errors: string[] = [];

            if (options.mode === 'workspace') {
                for (const fileId of options.selectedFiles) {
                    const format = options.fileFormats.get(fileId) || 'binary';
                    const result = await this.compileFile(fileId, options.assetOutputPath, options.typeOutputPath, format, fileSystem);

                    if (result.success) {
                        outputFiles.push(...(result.outputFiles || []));
                    } else {
                        errors.push(`${fileId}: ${result.message}`);
                    }
                }

                const globalTypeResult = await this.generateGlobalBlackboardTypes(options.typeOutputPath, fileSystem);
                if (globalTypeResult.success) {
                    outputFiles.push(...(globalTypeResult.outputFiles || []));
                } else {
                    errors.push(globalTypeResult.message);
                }
            } else {
                const currentFileName = this.getCurrentFileName();
                const currentFilePath = this.currentOptions?.currentFilePath;

                if (!currentFileName) {
                    return {
                        success: false,
                        message: '错误：没有打开的行为树文件',
                        errors: ['请先打开一个行为树文件']
                    };
                }

                const format = options.fileFormats.get(currentFileName) || 'binary';
                const result = await this.compileFileWithPath(
                    currentFileName,
                    currentFilePath || `${this.projectPath}/.ecs/behaviors/${currentFileName}.btree`,
                    options.assetOutputPath,
                    options.typeOutputPath,
                    format,
                    fileSystem
                );

                if (result.success) {
                    outputFiles.push(...(result.outputFiles || []));
                } else {
                    errors.push(result.message);
                }
            }

            if (errors.length > 0) {
                return {
                    success: false,
                    message: `编译完成，但有 ${errors.length} 个错误`,
                    outputFiles,
                    errors
                };
            }

            return {
                success: true,
                message: `成功编译 ${outputFiles.length} 个文件`,
                outputFiles
            };
        } catch (error) {
            return {
                success: false,
                message: `编译失败: ${error}`,
                errors: [String(error)]
            };
        }
    }

    private async compileFile(
        fileId: string,
        assetOutputPath: string,
        typeOutputPath: string,
        format: 'json' | 'binary',
        fileSystem: IFileSystem
    ): Promise<CompileResult> {
        const btreePath = `${this.projectPath}/.ecs/behaviors/${fileId}.btree`;
        return this.compileFileWithPath(fileId, btreePath, assetOutputPath, typeOutputPath, format, fileSystem);
    }

    private async compileFileWithPath(
        fileId: string,
        btreePath: string,
        assetOutputPath: string,
        typeOutputPath: string,
        format: 'json' | 'binary',
        fileSystem: IFileSystem
    ): Promise<CompileResult> {
        try {
            logger.info(`Reading file: ${btreePath}`);
            const fileContent = await fileSystem.readFile(btreePath);
            const treeData = JSON.parse(fileContent);

            const editorFormat = this.convertToEditorFormat(treeData, fileId);
            const asset = EditorFormatConverter.toAsset(editorFormat);

            let runtimeAsset: string | Uint8Array;
            const extension = format === 'json' ? '.btree.json' : '.btree.bin';
            const assetPath = `${assetOutputPath}/${fileId}${extension}`;

            if (format === 'json') {
                runtimeAsset = BehaviorTreeAssetSerializer.serialize(asset, { format: 'json', pretty: true });
                await fileSystem.writeFile(assetPath, runtimeAsset as string);
            } else {
                runtimeAsset = BehaviorTreeAssetSerializer.serialize(asset, { format: 'binary' });
                await fileSystem.writeBinary(assetPath, runtimeAsset as Uint8Array);
            }

            const blackboardVars = treeData.blackboard || {};
            logger.info(`${fileId} blackboard vars:`, blackboardVars);
            const typeContent = this.generateBlackboardTypes(fileId, blackboardVars);
            const typePath = `${typeOutputPath}/${fileId}.ts`;
            await fileSystem.writeFile(typePath, typeContent);
            logger.info(`Generated type file: ${typePath}`);

            return {
                success: true,
                message: `成功编译 ${fileId}`,
                outputFiles: [assetPath, typePath]
            };
        } catch (error) {
            return {
                success: false,
                message: `编译 ${fileId} 失败: ${error}`,
                errors: [String(error)]
            };
        }
    }

    /**
     * 将存储的 JSON 数据转换为 EditorFormat
     * @param treeData - 从文件读取的原始数据
     * @param fileId - 文件标识符
     * @returns 编辑器格式数据
     */
    private convertToEditorFormat(treeData: any, fileId: string): any {
        // 如果已经是新格式（包含 nodes 数组），直接使用
        if (treeData.nodes && Array.isArray(treeData.nodes)) {
            return {
                version: treeData.version || '1.0.0',
                metadata: treeData.metadata || {
                    name: fileId,
                    description: ''
                },
                nodes: treeData.nodes,
                connections: treeData.connections || [],
                blackboard: treeData.blackboard || {}
            };
        }

        // 兼容旧格式，返回默认结构
        return {
            version: '1.0.0',
            metadata: {
                name: fileId,
                description: ''
            },
            nodes: [],
            connections: [],
            blackboard: treeData.blackboard || {}
        };
    }

    private async generateGlobalBlackboardTypes(
        typeOutputPath: string,
        fileSystem: IFileSystem
    ): Promise<CompileResult> {
        try {
            if (!this.projectPath) {
                throw new Error('No project path');
            }

            const btreeFiles = await fileSystem.scanFiles(`${this.projectPath}/.ecs/behaviors`, '*.btree');
            const variables: any[] = [];

            for (const fileId of btreeFiles) {
                const btreePath = `${this.projectPath}/.ecs/behaviors/${fileId}.btree`;
                const fileContent = await fileSystem.readFile(btreePath);
                const treeData = JSON.parse(fileContent);
                const blackboard = treeData.blackboard || {};

                for (const [key, value] of Object.entries(blackboard)) {
                    variables.push({
                        name: key,
                        type: this.inferType(value),
                        defaultValue: value
                    });
                }
            }

            const config = {
                version: '1.0.0',
                variables
            };

            const typeContent = GlobalBlackboardTypeGenerator.generate(config);
            const typePath = `${typeOutputPath}/GlobalBlackboard.ts`;
            await fileSystem.writeFile(typePath, typeContent);

            return {
                success: true,
                message: '成功生成全局黑板类型',
                outputFiles: [typePath]
            };
        } catch (error) {
            return {
                success: false,
                message: `生成全局黑板类型失败: ${error}`,
                errors: [String(error)]
            };
        }
    }

    private generateBlackboardTypes(behaviorName: string, blackboardVars: Record<string, unknown>): string {
        const lines: string[] = [];
        lines.push(`export interface ${behaviorName}Blackboard {`);

        for (const [key, value] of Object.entries(blackboardVars)) {
            const type = this.inferType(value);
            lines.push(`    ${key}: ${type};`);
        }

        lines.push('}');
        return lines.join('\n');
    }

    private inferType(value: unknown): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (Array.isArray(value)) return 'unknown[]';
        if (typeof value === 'object') return 'Record<string, unknown>';
        return 'unknown';
    }

    private getCurrentFileName(): string | null {
        if (this.currentOptions?.currentFile) {
            return this.currentOptions.currentFile;
        }
        return null;
    }

    validateOptions(options: BehaviorTreeCompileOptions): string | null {
        if (!options.assetOutputPath) {
            return '请选择资产输出路径';
        }
        if (!options.typeOutputPath) {
            return '请选择类型定义输出路径';
        }
        if (options.mode === 'workspace' && options.selectedFiles.length === 0) {
            return '请至少选择一个文件';
        }
        if (options.mode === 'single' && !this.getCurrentFileName()) {
            return '没有打开的行为树文件';
        }
        return null;
    }

    createConfigUI(onOptionsChange: (options: BehaviorTreeCompileOptions) => void, context: CompilerContext): React.ReactElement {
        return <BehaviorTreeCompileConfigUI onOptionsChange={onOptionsChange} context={context} />;
    }
}

interface ConfigUIProps {
    onOptionsChange: (options: BehaviorTreeCompileOptions) => void;
    context: CompilerContext;
}

function BehaviorTreeCompileConfigUI({ onOptionsChange, context }: ConfigUIProps) {
    const { projectPath, moduleContext } = context;
    const { fileSystem, dialog } = moduleContext;
    const [mode, setMode] = useState<'single' | 'workspace'>('workspace');
    const [assetOutputPath, setAssetOutputPath] = useState('');
    const [typeOutputPath, setTypeOutputPath] = useState('');
    const [availableFiles, setAvailableFiles] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [fileFormats, setFileFormats] = useState<Map<string, 'json' | 'binary'>>(new Map());
    const [selectAll, setSelectAll] = useState(true);

    useEffect(() => {
        const loadFiles = async () => {
            if (projectPath) {
                const files = await fileSystem.scanFiles(`${projectPath}/.ecs/behaviors`, '*.btree');
                setAvailableFiles(files);
                setSelectedFiles(new Set(files));

                const formats = new Map<string, 'json' | 'binary'>();
                files.forEach((file: string) => formats.set(file, 'binary'));
                setFileFormats(formats);
            }
        };
        loadFiles();

        const savedAssetPath = localStorage.getItem('export-asset-path');
        const savedTypePath = localStorage.getItem('export-type-path');

        // Set default paths based on projectPath if no saved paths
        if (savedAssetPath) {
            setAssetOutputPath(savedAssetPath);
        } else if (projectPath) {
            const defaultAssetPath = `${projectPath}/assets/behaviors`;
            setAssetOutputPath(defaultAssetPath);
        }

        if (savedTypePath) {
            setTypeOutputPath(savedTypePath);
        } else if (projectPath) {
            const defaultTypePath = `${projectPath}/src/types/behaviors`;
            setTypeOutputPath(defaultTypePath);
        }
    }, [projectPath]);

    const currentFilePath = useBehaviorTreeDataStore((state) => state.currentFilePath);
    const currentFileName = useBehaviorTreeDataStore((state) => state.currentFileName);

    useEffect(() => {
        onOptionsChange({
            mode,
            assetOutputPath,
            typeOutputPath,
            selectedFiles: mode === 'workspace' ? Array.from(selectedFiles) : [],
            fileFormats,
            currentFile: currentFileName || undefined,
            currentFilePath: currentFilePath || undefined
        });
    }, [mode, assetOutputPath, typeOutputPath, selectedFiles, fileFormats, onOptionsChange, currentFileName, currentFilePath]);

    const handleBrowseAssetPath = async () => {
        const selected = await dialog.openDialog({
            directory: true,
            multiple: false,
            title: '选择资产输出目录',
            defaultPath: assetOutputPath || projectPath || undefined
        });
        if (selected && typeof selected === 'string') {
            setAssetOutputPath(selected);
            localStorage.setItem('export-asset-path', selected);
        }
    };

    const handleBrowseTypePath = async () => {
        const selected = await dialog.openDialog({
            directory: true,
            multiple: false,
            title: '选择类型定义输出目录',
            defaultPath: typeOutputPath || projectPath || undefined
        });
        if (selected && typeof selected === 'string') {
            setTypeOutputPath(selected);
            localStorage.setItem('export-type-path', selected);
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedFiles(new Set());
            setSelectAll(false);
        } else {
            setSelectedFiles(new Set(availableFiles));
            setSelectAll(true);
        }
    };

    const handleToggleFile = (file: string) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(file)) {
            newSelected.delete(file);
        } else {
            newSelected.add(file);
        }
        setSelectedFiles(newSelected);
        setSelectAll(newSelected.size === availableFiles.length);
    };

    const handleFileFormatChange = (file: string, format: 'json' | 'binary') => {
        const newFormats = new Map(fileFormats);
        newFormats.set(file, format);
        setFileFormats(newFormats);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 模式选择 */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #3e3e3e', paddingBottom: '8px' }}>
                <button
                    onClick={() => setMode('workspace')}
                    style={{
                        flex: 1,
                        padding: '8px 16px',
                        background: mode === 'workspace' ? '#0e639c' : '#3a3a3a',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '13px'
                    }}
                >
                    <FolderTree size={16} />
                    工作区编译
                </button>
                <button
                    onClick={() => setMode('single')}
                    style={{
                        flex: 1,
                        padding: '8px 16px',
                        background: mode === 'single' ? '#0e639c' : '#3a3a3a',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '13px'
                    }}
                >
                    <File size={16} />
                    当前文件
                </button>
            </div>

            {/* 模式说明 */}
            <div style={{
                padding: '8px 12px',
                background: '#1e3a5f',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#8ac3ff',
                lineHeight: '1.5'
            }}>
                {mode === 'workspace' ? (
                    <>
                        <strong>工作区模式：</strong>将编译 <code style={{ background: '#0d2744', padding: '2px 4px', borderRadius: '2px' }}>{projectPath}/.ecs/behaviors/</code> 目录下的所有 .btree 文件
                    </>
                ) : (
                    <>
                        <strong>当前文件模式：</strong>将编译当前打开的文件
                        {currentFilePath && (
                            <div style={{ marginTop: '4px', wordBreak: 'break-all' }}>
                                <code style={{ background: '#0d2744', padding: '2px 4px', borderRadius: '2px' }}>{currentFilePath}</code>
                            </div>
                        )}
                        {!currentFilePath && (
                            <div style={{ marginTop: '4px', color: '#ffaa00' }}>
                                ⚠️ 未打开任何文件
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 资产输出路径 */}
            <div>
                <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#ccc' }}>
                    资产输出路径
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={assetOutputPath}
                        onChange={(e) => setAssetOutputPath(e.target.value)}
                        placeholder="选择资产输出目录..."
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: '#2d2d2d',
                            border: '1px solid #3a3a3a',
                            borderRadius: '4px',
                            color: '#ccc',
                            fontSize: '12px'
                        }}
                    />
                    <button
                        onClick={handleBrowseAssetPath}
                        style={{
                            padding: '8px 16px',
                            background: '#0e639c',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <FolderOpen size={14} />
                        浏览
                    </button>
                </div>
            </div>

            {/* TypeScript类型输出路径 */}
            <div>
                <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#ccc' }}>
                    TypeScript 类型定义输出路径
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={typeOutputPath}
                        onChange={(e) => setTypeOutputPath(e.target.value)}
                        placeholder="选择类型定义输出目录..."
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: '#2d2d2d',
                            border: '1px solid #3a3a3a',
                            borderRadius: '4px',
                            color: '#ccc',
                            fontSize: '12px'
                        }}
                    />
                    <button
                        onClick={handleBrowseTypePath}
                        style={{
                            padding: '8px 16px',
                            background: '#0e639c',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <FolderOpen size={14} />
                        浏览
                    </button>
                </div>
            </div>

            {/* 文件列表 */}
            {mode === 'workspace' && availableFiles.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#ccc' }}>
                            选择文件 ({selectedFiles.size}/{availableFiles.length})
                        </div>
                        <button
                            onClick={handleSelectAll}
                            style={{
                                padding: '4px 12px',
                                background: '#3a3a3a',
                                border: 'none',
                                borderRadius: '3px',
                                color: '#ccc',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            {selectAll ? '取消全选' : '全选'}
                        </button>
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {availableFiles.map((file) => (
                            <div
                                key={file}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    background: selectedFiles.has(file) ? '#2a2d2e' : '#1e1e1e',
                                    border: `1px solid ${selectedFiles.has(file) ? '#0e639c' : '#3a3a3a'}`,
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.has(file)}
                                    onChange={() => handleToggleFile(file)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <File size={14} style={{ color: '#ab47bc' }} />
                                <span style={{ flex: 1, color: '#ccc' }}>{file}.btree</span>
                                <select
                                    value={fileFormats.get(file) || 'binary'}
                                    onChange={(e) => handleFileFormatChange(file, e.target.value as 'json' | 'binary')}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        padding: '4px 8px',
                                        background: '#2d2d2d',
                                        border: '1px solid #3a3a3a',
                                        borderRadius: '3px',
                                        color: '#ccc',
                                        fontSize: '11px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="binary">二进制</option>
                                    <option value="json">JSON</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
