import Editor from '@monaco-editor/react';

interface CodePreviewProps {
    content: string;
    language?: string;
    height?: string | number;
}

// 根据文件扩展名获取语言
export function getLanguageFromExtension(extension?: string): string {
    if (!extension) return 'plaintext';

    const languageMap: Record<string, string> = {
        // JavaScript/TypeScript
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'mjs': 'javascript',
        'cjs': 'javascript',

        // Web
        'html': 'html',
        'htm': 'html',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'vue': 'html',
        'svelte': 'html',

        // Data formats
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'toml': 'ini',

        // Markdown
        'md': 'markdown',
        'mdx': 'markdown',

        // Shell
        'sh': 'shell',
        'bash': 'shell',
        'zsh': 'shell',
        'ps1': 'powershell',
        'bat': 'bat',
        'cmd': 'bat',

        // Other languages
        'py': 'python',
        'rs': 'rust',
        'go': 'go',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'h': 'c',
        'hpp': 'cpp',
        'cs': 'csharp',
        'rb': 'ruby',
        'php': 'php',
        'lua': 'lua',
        'sql': 'sql',
        'graphql': 'graphql',
        'gql': 'graphql',

        // Config files
        'gitignore': 'ini',
        'env': 'ini',
        'ini': 'ini',
        'conf': 'ini',
        'properties': 'ini',

        // ECS specific
        'ecs': 'json',
        'btree': 'json'
    };

    return languageMap[extension.toLowerCase()] || 'plaintext';
}

export function CodePreview({ content, language = 'plaintext', height = 300 }: CodePreviewProps) {
    return (
        <div className="code-preview-container">
            <Editor
                height={height}
                language={language}
                value={content}
                theme="vs-dark"
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    renderLineHighlight: 'none',
                    folding: true,
                    wordWrap: 'on',
                    fontSize: 12,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    padding: { top: 8, bottom: 8 },
                    scrollbar: {
                        vertical: 'auto',
                        horizontal: 'auto',
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8
                    },
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                    contextmenu: false,
                    selectionHighlight: false,
                    occurrencesHighlight: 'off',
                    renderValidationDecorations: 'off'
                }}
                loading={
                    <div className="code-preview-loading">
                        加载中...
                    </div>
                }
            />
        </div>
    );
}
