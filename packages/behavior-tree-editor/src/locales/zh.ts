/**
 * Chinese translations for Behavior Tree Editor
 * 行为树编辑器中文翻译
 */
export const zh = {
    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        openFile: '打开文件 (Ctrl+O)',
        save: '保存 (Ctrl+S)',
        saveUnsaved: '保存 (Ctrl+S) - 有未保存的更改',
        export: '导出运行时配置',
        copyToClipboard: '复制JSON到剪贴板',
        run: '运行 (Play)',
        resume: '继续',
        pause: '暂停',
        stop: '停止',
        step: '单步执行',
        resetView: '重置视图 (滚轮缩放, Alt+拖动平移)',
        undo: '撤销 (Ctrl+Z)',
        redo: '重做 (Ctrl+Shift+Z / Ctrl+Y)',
        goToRoot: '回到根节点'
    },

    // ========================================
    // Execution Status
    // ========================================
    execution: {
        idle: '空闲',
        running: '运行中',
        paused: '已暂停'
    },

    // ========================================
    // Node
    // ========================================
    node: {
        executionOrder: '执行顺序: {{order}}',
        initialValue: '初始值',
        currentValue: '当前值'
    },

    // ========================================
    // Context Menu
    // ========================================
    contextMenu: {
        delete: '删除',
        duplicate: '复制',
        copy: '复制',
        paste: '粘贴'
    },

    // ========================================
    // Quick Create Menu
    // ========================================
    quickCreate: {
        searchPlaceholder: '搜索节点...',
        uncategorized: '未分类',
        noMatchingNodes: '未找到匹配的节点'
    },

    // ========================================
    // Blackboard Panel
    // ========================================
    blackboard: {
        title: '黑板',
        variableName: '变量名',
        copy: '复制',
        edit: '编辑',
        delete: '删除',
        addVariable: '添加变量'
    },

    // ========================================
    // Compiler
    // ========================================
    compiler: {
        name: '行为树编译器',
        description: '编译行为树资产',
        selectAssetOutput: '选择资产输出目录...',
        selectTypeOutput: '选择类型定义输出目录...',
        compile: '编译',
        compiling: '编译中...',
        success: '编译成功',
        failed: '编译失败'
    },

    // ========================================
    // Notifications
    // ========================================
    notifications: {
        fileSaved: '文件已保存: {{path}}',
        fileSaveFailed: '保存文件失败',
        fileOpened: '文件已打开: {{path}}',
        fileOpenFailed: '打开文件失败',
        copiedToClipboard: '已复制到剪贴板',
        exportSuccess: '导出成功',
        exportFailed: '导出失败',
        validationError: '验证错误: {{message}}'
    },

    // ========================================
    // Dialogs
    // ========================================
    dialogs: {
        createBehaviorTree: '创建行为树资产',
        confirmDelete: '确定要删除这个节点吗？',
        unsavedChanges: '有未保存的更改。关闭前是否保存？'
    },

    // ========================================
    // Panel
    // ========================================
    panel: {
        title: '行为树编辑器',
        noFileOpen: '没有打开的行为树文件',
        dropToOpen: '拖放 .btree 文件到这里或使用打开按钮'
    },

    // ========================================
    // Validation Errors
    // 验证错误
    // ========================================
    validation: {
        rootNodeMaxChildren: '根节点只能连接一个子节点',
        decoratorNodeMaxChildren: '装饰节点只能连接一个子节点',
        leafNodeNoChildren: '叶子节点不能有子节点',
        circularReference: '检测到循环引用，节点 {{nodeId}} 不能连接到自己或其子节点',
        invalidConnection: '无效的连接：{{reason}}',
        nodeIdRequired: '节点 ID 不能为空',
        nodeTemplateRequired: '节点模板不能为空',
        sourceNodeNotFound: '连接的源节点不存在: {{nodeId}}',
        targetNodeNotFound: '连接的目标节点不存在: {{nodeId}}',
        selfConnection: '节点不能连接到自己',
        cycleDetected: '行为树中存在循环引用'
    }
};
