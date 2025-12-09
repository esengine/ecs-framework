/**
 * English translations for Behavior Tree Editor
 * 行为树编辑器英文翻译
 */
export const en = {
    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        openFile: 'Open File (Ctrl+O)',
        save: 'Save (Ctrl+S)',
        saveUnsaved: 'Save (Ctrl+S) - Unsaved changes',
        export: 'Export Runtime Config',
        copyToClipboard: 'Copy JSON to Clipboard',
        run: 'Run (Play)',
        resume: 'Resume',
        pause: 'Pause',
        stop: 'Stop',
        step: 'Step',
        resetView: 'Reset View (scroll to zoom, Alt+drag to pan)',
        undo: 'Undo (Ctrl+Z)',
        redo: 'Redo (Ctrl+Shift+Z / Ctrl+Y)',
        goToRoot: 'Go to Root Node'
    },

    // ========================================
    // Execution Status
    // ========================================
    execution: {
        idle: 'Idle',
        running: 'Running',
        paused: 'Paused'
    },

    // ========================================
    // Node
    // ========================================
    node: {
        executionOrder: 'Execution Order: {{order}}',
        initialValue: 'Initial Value',
        currentValue: 'Current Value'
    },

    // ========================================
    // Context Menu
    // ========================================
    contextMenu: {
        delete: 'Delete',
        duplicate: 'Duplicate',
        copy: 'Copy',
        paste: 'Paste'
    },

    // ========================================
    // Quick Create Menu
    // ========================================
    quickCreate: {
        searchPlaceholder: 'Search nodes...',
        uncategorized: 'Uncategorized',
        noMatchingNodes: 'No matching nodes found'
    },

    // ========================================
    // Blackboard Panel
    // ========================================
    blackboard: {
        title: 'Blackboard',
        variableName: 'variable.name',
        copy: 'Copy',
        edit: 'Edit',
        delete: 'Delete',
        addVariable: 'Add Variable'
    },

    // ========================================
    // Compiler
    // ========================================
    compiler: {
        name: 'Behavior Tree Compiler',
        description: 'Compile behavior tree assets',
        selectAssetOutput: 'Select asset output directory...',
        selectTypeOutput: 'Select type definition output directory...',
        compile: 'Compile',
        compiling: 'Compiling...',
        success: 'Compilation successful',
        failed: 'Compilation failed'
    },

    // ========================================
    // Notifications
    // ========================================
    notifications: {
        fileSaved: 'File saved: {{path}}',
        fileSaveFailed: 'Failed to save file',
        fileOpened: 'File opened: {{path}}',
        fileOpenFailed: 'Failed to open file',
        copiedToClipboard: 'Copied to clipboard',
        exportSuccess: 'Export successful',
        exportFailed: 'Export failed',
        validationError: 'Validation error: {{message}}'
    },

    // ========================================
    // Dialogs
    // ========================================
    dialogs: {
        createBehaviorTree: 'Create Behavior Tree Asset',
        confirmDelete: 'Are you sure you want to delete this node?',
        unsavedChanges: 'You have unsaved changes. Do you want to save before closing?'
    },

    // ========================================
    // Panel
    // ========================================
    panel: {
        title: 'Behavior Tree Editor',
        noFileOpen: 'No behavior tree file is open',
        dropToOpen: 'Drop a .btree file here or use Open button'
    },

    // ========================================
    // Validation Errors
    // ========================================
    validation: {
        rootNodeMaxChildren: 'Root node can only connect to one child node',
        decoratorNodeMaxChildren: 'Decorator node can only connect to one child node',
        leafNodeNoChildren: 'Leaf node cannot have children',
        circularReference: 'Circular reference detected, node {{nodeId}} cannot connect to itself or its descendants',
        invalidConnection: 'Invalid connection: {{reason}}',
        nodeIdRequired: 'Node ID cannot be empty',
        nodeTemplateRequired: 'Node template cannot be empty',
        sourceNodeNotFound: 'Connection source node not found: {{nodeId}}',
        targetNodeNotFound: 'Connection target node not found: {{nodeId}}',
        selfConnection: 'Node cannot connect to itself',
        cycleDetected: 'Circular reference detected in behavior tree'
    }
};
