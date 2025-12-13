import type { Translations } from '@esengine/editor-core';

/**
 * Chinese translations (Editor Core)
 * 简体中文翻译（编辑器核心）
 *
 * 注意：插件翻译应通过 LocaleService.extendTranslations() 注册
 * Note: Plugin translations should be registered via LocaleService.extendTranslations()
 */
export const zh: Translations = {
    // ========================================
    // App
    // ========================================
    app: {
        title: 'ESEngine 编辑器'
    },

    // ========================================
    // Common
    // ========================================
    common: {
        ok: '确定',
        cancel: '取消',
        save: '保存',
        delete: '删除',
        close: '关闭',
        confirm: '确认',
        apply: '应用',
        reset: '重置',
        search: '搜索',
        loading: '加载中...',
        error: '错误',
        success: '成功',
        warning: '警告',
        info: '信息',
        yes: '是',
        no: '否',
        create: '创建',
        open: '打开',
        browse: '浏览',
        name: '名称',
        type: '类型',
        value: '值',
        enabled: '启用',
        disabled: '禁用',
        clear: '清除'
    },

    // ========================================
    // Header
    // ========================================
    header: {
        toolbar: {
            openProject: '打开项目',
            createEntity: '创建实体',
            deleteEntity: '删除实体'
        },
        status: {
            initializing: '初始化中...',
            ready: '编辑器就绪',
            failed: '初始化失败',
            projectOpened: '项目已打开',
            remoteConnected: '远程游戏已连接'
        }
    },

    // ========================================
    // Panels
    // ========================================
    panel: {
        sceneHierarchy: '场景层级',
        viewport: '视口',
        inspector: '检查器',
        forum: '论坛',
        console: '控制台',
        assetBrowser: '资源浏览器',
        profiler: '性能分析器',
        contentBrowser: '内容管理器'
    },

    hierarchy: {
        title: '场景层级',
        empty: '无实体',
        emptyHint: '创建实体开始使用',
        remoteEmpty: '远程游戏中没有实体',
        loading: '加载中...',
        search: '搜索...',
        createEntity: '创建实体',
        createEmptyEntity: '创建空实体',
        createFolder: '创建文件夹',
        deleteEntity: '删除实体',
        deleteConfirm: '确定要删除实体 "{{name}}" 吗？',
        deleteConfirmWithChildren: '确定要删除实体 "{{name}}" 及其 {{count}} 个子节点吗？',
        renameEntity: '重命名实体',
        duplicateEntity: '复制实体',
        localScene: '本地场景',
        remoteEntities: '远程实体',
        visibility: '可见性',
        favorite: '收藏',
        lock: '锁定',
        settings: '设置',
        actors: '个对象',
        selected: '个已选中',
        categories: {
            rendering: '渲染',
            ui: 'UI',
            effects: '效果',
            physics: '物理',
            audio: '音频',
            basic: '基础',
            other: '其他'
        },
        entityTemplates: {
            sprite: '精灵',
            animatedSprite: '动画精灵',
            tilemap: '瓦片地图',
            camera2d: '2D 相机',
            particleEffect: '粒子效果'
        },
        editingPrefab: '编辑预制体'
    },

    inspector: {
        title: '检查器',
        empty: '未选择实体',
        entityInfo: {
            title: '实体信息',
            id: 'ID',
            name: '名称',
            enabled: '启用',
            yes: '是',
            no: '否'
        },
        components: {
            title: '组件',
            empty: '无组件',
            add: '添加组件',
            remove: '移除'
        },
        prefab: {
            instance: '预制体实例',
            source: '预制体',
            open: '打开',
            select: '定位',
            selectAsset: '定位预制体资产',
            revert: '还原',
            revertAll: '全部还原',
            revertTo: '还原到预制体',
            apply: '应用',
            applyAll: '全部应用',
            applyTo: "应用到 '{{name}}'",
            unpack: '解包',
            modified: '已修改',
            modifications: '{{count}} 处修改',
            noModifications: '无修改',
            revertProperty: '还原为预制体值',
            applyConfirm: '将修改应用到预制体 "{{name}}"?',
            revertConfirm: '将所有修改还原为预制体默认值?',
            unpackConfirm: '解包预制体实例？这将断开与源预制体的链接。',
            applyTitle: '应用到预制体',
            revertTitle: '还原到预制体',
            unpackTitle: '解包预制体',
            applySuccess: '已应用修改到预制体',
            applyFailed: '应用修改到预制体失败',
            revertSuccess: '已还原为预制体默认值',
            revertFailed: '还原实例失败',
            unpackSuccess: '已断开预制体链接',
            unpackFailed: '解包预制体失败'
        },
        array: {
            empty: '空数组',
            add: '添加',
            remove: '删除',
            dragToReorder: '拖拽排序',
            dropAsset: '拖拽资源'
        }
    },

    addComponent: {
        title: '添加组件',
        search: '搜索组件...',
        empty: '无可用组件',
        cancel: '取消',
        add: '添加组件'
    },

    viewport: {
        title: '视口',
        placeholder: '场景视口将显示在这里',
        tools: {
            select: '选择 (Q)',
            move: '移动 (W)',
            rotate: '旋转 (E)',
            scale: '缩放 (R)'
        },
        gizmo: {
            local: '本地',
            world: '世界'
        },
        snap: {
            toggle: '吸附开关',
            grid: '网格吸附',
            rotation: '旋转吸附',
            scale: '缩放吸附'
        },
        view: {
            showGrid: '显示网格',
            showGizmos: '显示辅助线',
            stats: '统计信息',
            resetView: '重置视图',
            fullscreen: '全屏'
        },
        run: {
            options: '运行选项',
            inBrowser: '浏览器运行',
            onDevice: '真机运行',
            openedInBrowser: '已在浏览器中打开: {{url}}',
            serverStarted: '服务器已启动',
            previewUrl: '预览地址: {{url}}',
            failed: '运行失败',
            startFailed: '启动失败'
        },
        errors: {
            noScene: '没有可运行的场景',
            missingCamera: '缺少相机: 场景中没有相机实体，请添加一个带有Camera组件的实体',
            noSceneFirst: '请先创建场景'
        },
        notifications: {
            noScene: '无场景'
        },
        prefab: {
            editing: '编辑中',
            save: '保存预制体',
            exit: '退出编辑',
            saveAndExit: '保存并退出',
            discardChanges: '放弃修改',
            savedSuccess: '预制体已保存：{{name}}',
            saveFailed: '保存预制体失败'
        }
    },

    console: {
        title: '控制台',
        placeholder: '控制台输出将显示在这里',
        clear: '清空',
        filter: '筛选',
        levels: {
            all: '全部',
            info: '信息',
            warn: '警告',
            error: '错误'
        }
    },

    outputLog: {
        searchPlaceholder: '搜索日志...',
        filters: '过滤器',
        logLevels: '日志级别',
        remoteOnly: '仅远程日志',
        pauseAutoScroll: '暂停自动滚动',
        resumeAutoScroll: '恢复自动滚动',
        settings: '设置',
        clearLogs: '清空日志',
        noMatchingLogs: '没有匹配的日志',
        noLogs: '暂无日志',
        logs: '条日志',
        scrollToBottom: '滚动到底部',
        copy: '复制',
        callStack: '调用堆栈:'
    },

    // ========================================
    // Footer / Status Bar
    // ========================================
    footer: {
        plugins: '插件',
        entities: '实体',
        core: '核心',
        active: '活跃',
        inactive: '未激活'
    },

    statusBar: {
        contentDrawer: '内容侧滑菜单',
        outputLog: '输出日志',
        consolePlaceholder: '输入控制台命令',
        trace: '回追踪',
        network: '网络',
        sourceControl: '源代码管理',
        allSaved: '所有已保存',
        revisionControl: '版本控制',
        resetLayout: '重置布局'
    },

    // ========================================
    // Scene
    // ========================================
    scene: {
        new: '新建场景',
        open: '打开场景',
        save: '保存场景',
        saveAs: '另存为',
        newCreated: '新场景已创建',
        createFailed: '创建场景失败',
        openedSuccess: '场景已打开: {{name}}',
        openFailed: '打开场景失败',
        savedSuccess: '场景已保存: {{name}}',
        saveFailed: '保存场景失败',
        saveAsFailed: '另存场景失败'
    },

    // ========================================
    // Project
    // ========================================
    project: {
        open: '打开项目',
        create: '创建项目',
        close: '关闭项目',
        creating: '正在创建项目...',
        opening: '正在打开项目...',
        createFailed: '创建项目失败',
        openFailed: '打开项目失败',
        deleteFailed: '删除项目失败',
        alreadyExists: '项目已存在',
        existsQuestion: '此目录中已存在 ECS 项目。是否要打开它？',
        invalidDirectory: '项目目录不存在或无效',
        serviceUnavailable: '项目服务不可用，请重启编辑器',
        createdOpening: '项目已创建，正在打开...',
        browser: {
            title: '项目浏览器',
            recentProjects: '最近打开的项目',
            newProject: '新建项目',
            openExisting: '打开现有项目',
            noRecentProjects: '没有最近的项目',
            lastOpened: '上次打开',
            openInExplorer: '在资源管理器中打开',
            removeFromList: '从列表中移除'
        },
        wizard: {
            title: '项目浏览器',
            projectName: '项目名称',
            projectLocation: '项目位置',
            template: '模板',
            selectTemplate: '选择模板',
            projectSettings: '项目设置',
            browse: '浏览...',
            create: '创建',
            cancel: '取消',
            templates: {
                empty: '空项目',
                demo2d: '2D 演示',
                demo3d: '3D 演示',
                blank: '空白',
                blankDesc: '不包含任何启动内容的空白项目，适合从零开始创建。'
            }
        }
    },

    // ========================================
    // Plugin
    // ========================================
    plugin: {
        reloadedSuccess: '插件已重新加载',
        reloadFailed: '重新加载插件失败',
        manager: '插件管理器',
        enable: '启用',
        disable: '禁用',
        settings: '设置',
        version: '版本',
        author: '作者',
        dependencies: '依赖'
    },

    // ========================================
    // Loading
    // ========================================
    loading: {
        step1: '步骤 1/3: 打开项目配置...',
        step2: '步骤 2/3: 初始化引擎和模块...',
        step3: '步骤 3/3: 初始化场景...',
        loadingPlugins: '加载项目插件...',
        engineTimeoutError: '引擎初始化超时'
    },

    // ========================================
    // Menu
    // ========================================
    menu: {
        file: {
            title: '文件',
            newScene: '新建场景',
            openScene: '打开场景',
            saveScene: '保存场景',
            saveSceneAs: '场景另存为...',
            openProject: '打开项目',
            closeProject: '关闭项目',
            exit: '退出',
            buildSettings: '构建设置'
        },
        edit: {
            title: '编辑',
            undo: '撤销',
            redo: '重做',
            cut: '剪切',
            copy: '复制',
            paste: '粘贴',
            delete: '删除',
            selectAll: '全选'
        },
        view: {
            title: '视图',
            resetLayout: '重置布局',
            fullscreen: '全屏',
            zoomIn: '放大',
            zoomOut: '缩小'
        },
        window: {
            title: '窗口',
            sceneHierarchy: '场景层级',
            inspector: '检视器',
            assets: '资产',
            console: '控制台',
            viewport: '视口',
            pluginManager: '插件管理器',
            devtools: '开发者工具'
        },
        tools: {
            title: '工具',
            pluginManager: '插件管理器',
            createPlugin: '创建插件',
            reloadPlugins: '重新加载插件',
            portManager: '端口管理器',
            settings: '设置',
            devtools: '开发者工具',
            build: '构建设置'
        },
        help: {
            title: '帮助',
            documentation: '文档',
            checkForUpdates: '检查更新',
            about: '关于'
        }
    },

    // ========================================
    // Settings
    // ========================================
    settings: {
        title: '设置',
        general: '通用',
        appearance: '外观',
        language: '语言',
        theme: '主题',
        plugins: '插件',
        editor: '编辑器',
        shortcuts: '快捷键',
        scriptEditor: {
            systemDefault: '系统默认',
            custom: '自定义'
        }
    },

    // ========================================
    // Dialog
    // ========================================
    dialog: {
        confirm: '确认',
        cancel: '取消',
        yes: '是',
        no: '否',
        ok: '确定',
        close: '关闭',
        save: '保存',
        dontSave: '不保存',
        unsavedChanges: '未保存的更改',
        unsavedChangesMessage: '您有未保存的更改。是否在关闭前保存？'
    },

    // ========================================
    // Asset Browser
    // ========================================
    assetBrowser: {
        title: '资源浏览器',
        import: '导入',
        refresh: '刷新',
        newFolder: '新建文件夹',
        rename: '重命名',
        delete: '删除',
        duplicate: '复制',
        showInExplorer: '在资源管理器中显示',
        noAssets: '此文件夹中没有资源',
        filter: {
            all: '全部',
            textures: '贴图',
            audio: '音频',
            scenes: '场景',
            scripts: '脚本',
            prefabs: '预制体'
        }
    },

    // ========================================
    // Content Browser
    // ========================================
    contentBrowser: {
        favorites: '收藏夹',
        collections: '收藏集',
        add: '添加',
        import: '导入',
        saveAll: '全部保存',
        search: '搜索',
        items: '项',
        searchResults: '找到 {{found}} / {{total}} 项',
        selectedCount: '已选 {{count}} 项',
        dockInLayout: '停靠到布局',
        noProject: '未加载项目',
        empty: '文件夹为空',
        emptyHint: '拖放文件到此处或右键创建新资产',
        loading: '加载中...',
        noSearchResults: '未找到结果',
        noSearchResultsHint: '尝试其他搜索词',
        createNew: '新建',
        newFolder: '新建文件夹',
        newPrefix: '新建',
        managedDirectoryTooltip: 'GUID 管理的目录 - 此处的资产会获得唯一 ID 以便引用',
        unmanagedWarning: '此文件夹不受 GUID 系统管理。在此创建的资产无法通过 GUID 引用。',
        unmanagedWarningTitle: '非托管目录',
        rename: '重命名',
        delete: '删除',
        batchRename: '批量重命名',
        duplicate: '复制',
        open: '打开',
        save: '保存',
        openInExplorer: '在资源管理器中显示',
        copyPath: '复制路径',
        newSubfolder: '新建子文件夹',
        deleteConfirmTitle: '确认删除',
        deleteConfirmMessage: '确定要删除 "{{name}}" 吗？',
        cannotDeleteRoot: '无法删除根目录',
        refresh: '刷新',
        assetActions: '资产操作',
        reimport: '重新导入',
        export: '导出...',
        migrateAsset: '迁移资产',
        assetLocalization: '资产本地化',
        createLocalizedAsset: '创建本地化资产',
        importTranslation: '导入翻译',
        exportTranslation: '导出翻译',
        manageTags: '管理标签',
        copyReference: '复制引用',
        copyObjectPath: '拷贝Object路径',
        copyPackagePath: '拷贝包路径',
        referenceViewer: '引用查看器',
        sizeMap: '尺寸信息图',
        templateLabels: {
            material: '材质',
            shader: '着色器',
            tilemap: '瓦片地图',
            tileset: '瓦片集',
            component: '组件',
            system: '系统',
            typescript: 'TypeScript',
            inspector: '检查器',
            gizmo: 'Gizmo'
        },
        dialogs: {
            renameTitle: '重命名',
            cancel: '取消',
            ok: '确定',
            newFile: '新建 {{type}}',
            enterFileName: '输入文件名（将添加 {{ext}}）:',
            create: '创建'
        }
    },

    // ========================================
    // Build
    // ========================================
    build: {
        title: '构建设置',
        settingsTitle: '构建设置',
        platform: '平台',
        outputPath: '输出路径',
        buildButton: '构建',
        building: '正在构建...',
        success: '构建成功',
        failed: '构建失败',
        platforms: {
            web: 'Web',
            desktop: '桌面端',
            mobile: '移动端'
        }
    },

    // ========================================
    // Asset Picker
    // ========================================
    assetPicker: {
        title: '选择资产',
        loading: '加载中...',
        empty: '没有找到资产',
        select: '选择',
        cancel: '取消',
        search: '搜索...',
        back: '返回上级',
        listView: '列表视图',
        gridView: '网格视图',
        itemCount: '{{count}} 项'
    },

    // ========================================
    // About Dialog
    // ========================================
    about: {
        title: '关于 ESEngine Editor',
        version: '版本',
        description: '高性能游戏编辑器，基于 ECS 架构',
        checkUpdate: '检查更新',
        checking: '检查中...',
        updateAvailable: '发现新版本',
        latest: '您正在使用最新版本',
        error: '检查更新失败',
        download: '下载并安装',
        installing: '正在安装...',
        close: '关闭',
        copyright: '© 2025 ESEngine. 保留所有权利。',
        website: '官网',
        github: 'GitHub'
    },

    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        play: '播放',
        playing: '运行中...',
        stop: '停止',
        pause: '暂停',
        resume: '继续',
        step: '单步执行',
        save: '保存场景 (Ctrl+S)',
        open: '打开场景',
        undo: '撤销 (Ctrl+Z)',
        redo: '重做 (Ctrl+Y)',
        preview: '预览模式',
        runOptions: '运行选项',
        runInBrowser: '浏览器运行',
        runOnDevice: '真机运行'
    },

    // ========================================
    // Title Bar
    // ========================================
    titleBar: {
        noProject: '无项目',
        unsaved: '未保存的更改',
        minimize: '最小化',
        maximize: '最大化',
        restore: '还原',
        close: '关闭'
    },

    // ========================================
    // Plugin Generator
    // ========================================
    pluginGenerator: {
        title: '创建插件',
        pluginName: '插件名称',
        pluginNamePlaceholder: '例如: my-game-plugin',
        pluginVersion: '插件版本',
        outputPath: '输出路径',
        selectPath: '选择路径',
        includeExample: '包含示例节点',
        generate: '生成插件',
        cancel: '取消',
        generating: '正在生成...',
        success: '插件创建成功！',
        errorEmpty: '请输入插件名称',
        errorInvalidName: '插件名称只能包含字母、数字、连字符和下划线',
        errorNoPath: '请选择输出路径'
    },

    // ========================================
    // GitHub Auth
    // ========================================
    github: {
        title: 'GitHub 登录',
        githubLogin: 'GitHub 登录',
        oauthLogin: 'OAuth 登录（推荐）',
        tokenLogin: 'Token 登录',
        oauthStep1: '1. 点击"开始授权"按钮',
        oauthStep2: '2. 在浏览器中打开 GitHub 授权页面',
        oauthStep3: '3. 输入下方显示的代码并授权',
        startAuth: '开始授权',
        authorizing: '等待授权中...',
        authorized: '授权成功！',
        authFailed: '授权失败',
        userCode: '授权码',
        copyCode: '复制代码',
        openBrowser: '打开浏览器',
        tokenLabel: 'GitHub Personal Access Token',
        tokenPlaceholder: '粘贴你的 GitHub Token',
        tokenHint: '需要 repo 和 workflow 权限',
        createToken: '创建 Token',
        login: '登录',
        back: '返回',
        enterToken: '请输入 Token',
        authFailedToken: '认证失败，请检查你的 Token'
    },

    // ========================================
    // Startup Page
    // ========================================
    startup: {
        title: 'ESEngine 编辑器',
        subtitle: '专业游戏开发工具',
        version: '版本',
        recentProjects: '最近的项目',
        newProject: '新建项目',
        openProject: '打开项目',
        createProject: '创建新项目',
        noRecentProjects: '没有最近的项目',
        lastOpened: '上次打开',
        community: '社区',
        discord: 'Discord',
        forum: '论坛',
        documentation: '文档',
        tutorials: '教程',
        changelog: '更新日志',
        settings: '设置',
        language: '语言',
        updateAvailable: '发现新版本',
        updateNow: '立即更新',
        installing: '正在安装...',
        later: '稍后',
        removeFromList: '从列表中移除',
        deleteProject: '删除项目',
        deleteConfirmTitle: '删除项目',
        deleteConfirmMessage: '确定要永久删除此项目吗？此操作无法撤销。',
        cancel: '取消',
        delete: '删除',
        envReady: '环境就绪',
        envNotReady: '环境问题',
        esbuildReady: 'esbuild 就绪',
        esbuildMissing: '未找到 esbuild',
        esbuildNotInstalled: '需要安装 esbuild',
        esbuildRequired: 'esbuild 是编译 TypeScript 代码所必需的工具。',
        esbuildInstallPrompt: '点击下方按钮将使用 npm 全局安装 esbuild。',
        installingEsbuild: '正在安装 esbuild...',
        installNow: '立即安装'
    },

    // ========================================
    // Editor Toolbar (BT Editor)
    // ========================================
    editorToolbar: {
        play: '运行',
        pause: '暂停',
        resume: '继续',
        stop: '停止',
        stepForward: '单步执行',
        reset: '重置',
        resetView: '重置视图 (滚轮缩放, Alt+拖动平移)',
        clearCanvas: '清空画布',
        clear: '清空',
        toggleGizmos: '显示/隐藏选择边框 (Gizmos)',
        undo: '撤销 (Ctrl+Z)',
        redo: '重做 (Ctrl+Shift+Z / Ctrl+Y)',
        idle: '空闲',
        running: '运行中',
        paused: '已暂停',
        step: '单步'
    },

    // ========================================
    // File Tree
    // ========================================
    fileTree: {
        newFile: '新建文件',
        newFolder: '新建文件夹',
        openFile: '打开文件',
        save: '保存',
        rename: '重命名',
        batchRename: '批量重命名',
        duplicate: '复制',
        delete: '删除',
        assetActions: '资产操作',
        reimport: '重新导入',
        exportAsset: '导出...',
        migrateAsset: '迁移资产',
        assetLocalization: '资产本地化',
        createLocalizedAsset: '创建本地化资产',
        importTranslation: '导入翻译',
        exportTranslation: '导出翻译',
        manageTags: '管理标签',
        copyReference: '复制引用',
        copyObjectPath: '拷贝Object路径',
        copyPackagePath: '拷贝包路径',
        referenceViewer: '引用查看器',
        sizeMap: '尺寸信息图',
        showInExplorer: '在文件管理器中显示',
        loading: '加载中...',
        noFolders: '无文件夹',
        renameFailed: '重命名失败',
        deleteFailed: '删除失败',
        createFileFailed: '创建文件失败',
        createFolderFailed: '创建文件夹失败',
        createTemplateFailed: '创建模板文件失败',
        confirmDelete: '确认删除',
        confirmDeleteFolder: '确定要删除文件夹 "{{name}}" 及其所有内容吗？\n此操作无法撤销。',
        confirmDeleteFile: '确定要删除文件 "{{name}}" 吗？\n此操作无法撤销。',
        cancel: '取消',
        create: '创建',
        newFileTitle: '新建文件',
        newFolderTitle: '新建文件夹',
        enterFileName: '请输入文件名:',
        enterFolderName: '请输入文件夹名:',
        enterTemplateFileName: '请输入文件名 (将自动添加 .{{ext}} 扩展名):',
        fileNamePlaceholder: '例如: config.json',
        folderNamePlaceholder: '例如: assets',
        templateNamePlaceholder: '例如: MyFile'
    },

    // ========================================
    // Compile Dialog
    // ========================================
    compileDialog: {
        compileFailed: '编译失败',
        outputFiles: '输出文件',
        errors: '错误',
        close: '关闭',
        compiling: '编译中...',
        compile: '编译'
    },

    // ========================================
    // Build Settings Panel
    // ========================================
    buildSettings: {
        buildProfiles: '构建配置',
        addBuildProfile: '添加构建配置',
        playerSettings: '玩家设置',
        assetImportOverrides: '资源导入覆盖',
        platforms: '平台',
        sceneList: '场景列表',
        active: '激活',
        switchProfile: '切换配置',
        build: '构建',
        buildAndRun: '构建并运行',
        buildData: '构建数据',
        scriptingDefines: '脚本定义',
        listIsEmpty: '列表为空',
        addOpenScenes: '添加已打开的场景',
        platformSettings: '平台设置',
        architecture: '架构',
        developmentBuild: '开发版本',
        sourceMap: 'Source Map',
        compressionMethod: '压缩方式',
        buildMode: '构建模式',
        splitBundles: '分包模式（推荐）',
        singleBundle: '单包模式',
        singleFile: '单文件模式（可玩广告）',
        splitBundlesHint: '核心运行时 + 插件按需加载，适合正式游戏',
        singleBundleHint: '所有代码打包到一个 JS 文件，适合简单部署',
        singleFileHint: '所有内容内联到一个 HTML 文件，适合可玩广告',
        playerSettingsOverrides: '玩家设置覆盖',
        companyName: '公司名称',
        productName: '产品名称',
        version: '版本',
        defaultIcon: '默认图标',
        none: '无',
        buildInProgress: '正在构建',
        preparing: '准备中...',
        compiling: '编译中...',
        packaging: '打包资源...',
        copying: '复制文件...',
        postProcessing: '后处理...',
        completed: '已完成',
        failed: '失败',
        cancelled: '已取消',
        cancel: '取消',
        close: '关闭',
        buildSucceeded: '构建成功！',
        buildFailed: '构建失败',
        warnings: '警告',
        outputPath: '输出路径',
        duration: '耗时',
        selectPlatform: '请选择平台或构建配置',
        settings: '设置',
        copyError: '复制错误信息',
        showDetails: '显示详情',
        collapse: '收起',
        openFolder: '打开文件夹'
    },

    // ========================================
    // Forum
    // ========================================
    forum: {
        // ForumPanel
        community: '社区',
        clickToViewProfile: '点击查看资料',
        loading: '加载中...',

        // ForumAuth
        communityTitle: 'ESEngine 社区',
        signInWithGitHub: '使用 GitHub 登录参与讨论',
        step1: '1. 点击下方按钮',
        step2: '2. 在 GitHub 页面输入验证码',
        step3: '3. 授权应用',
        continueWithGitHub: '使用 GitHub 登录',
        waitingForAuth: '等待授权中...',
        enterCodeOnGitHub: '在 GitHub 输入此验证码：',
        copyCode: '复制验证码',
        openGitHub: '打开 GitHub',
        authSuccess: '授权成功！',
        authFailed: '授权失败',
        tryAgain: '重试',

        // ForumPostList
        askQuestionsShareIdeas: '提出问题、分享想法，与其他开发者交流',
        newDiscussion: '发起讨论',
        viewOnGitHub: '在 GitHub 查看',
        allCategories: '全部分类',
        searchDiscussions: '搜索讨论...',
        refresh: '刷新',
        new: '发帖',
        discussions: '条讨论',
        clearFilter: '清除筛选',
        justNow: '刚刚',
        minutesAgo: '{{count}}分钟前',
        hoursAgo: '{{count}}小时前',
        yesterday: '昨天',
        daysAgo: '{{count}}天前',
        newBadge: '新',
        hotBadge: '热门',
        openInGitHub: '在 GitHub 中打开',
        noDiscussionsYet: '暂无讨论',
        startADiscussion: '发起讨论',
        loadMore: '加载更多',
        answered: '已解决',

        // ForumPostDetail
        backToList: '返回列表',
        reply: '回复',
        replyTo: '回复 @{{login}}...',
        cancel: '取消',
        comments: '评论',
        writeComment: '写下你的评论...（支持 Markdown）',
        posting: '发送中...',
        postComment: '发表评论',
        noCommentsYet: '暂无评论，来发表第一条评论吧！',
        answer: '已采纳',

        // ForumCreatePost
        startDiscussion: '发起讨论',
        selectCategory: '选择分类',
        title: '标题',
        enterDescriptiveTitle: '输入一个描述性的标题...',
        write: '编辑',
        preview: '预览',
        bold: '粗体',
        italic: '斜体',
        inlineCode: '行内代码',
        link: '链接',
        list: '列表',
        quote: '引用',
        uploadImage: '上传图片',
        markdownHelp: 'Markdown 帮助',
        uploading: '上传中...',
        dropImageHere: '拖放图片到这里',
        editorPlaceholder: '在这里写下你的内容...\n\n支持 Markdown 语法：\n- **粗体** 和 *斜体*\n- `代码` 和 ```代码块```\n- [链接](url) 和 ![图片](url)\n- > 引用 和 - 列表\n\n拖拽或粘贴图片即可上传',
        nothingToPreview: '暂无内容可预览',
        enterTitle: '请输入标题',
        enterContent: '请输入内容',
        selectCategoryError: '请选择分类',
        failedToCreateDiscussion: '创建讨论失败，请稍后重试',
        anErrorOccurred: '发生错误，请稍后重试',
        creating: '创建中...',
        createDiscussion: '创建讨论',
        tips: '小贴士',
        tip1: '使用清晰、描述性的标题',
        tip2: '为你的话题选择合适的分类',
        tip3: '提供足够的背景和细节',
        tip4: '使用代码块展示代码',
        tip5: '保持尊重和建设性',
        markdownGuide: 'Markdown 指南',
        failedToUploadImage: '图片上传失败',

        // ForumProfile
        viewGitHubProfile: '查看 GitHub 主页',
        signOut: '退出登录'
    },

    // ========================================
    // Export Runtime Dialog
    // ========================================
    exportRuntime: {
        title: '导出运行时资产',
        workspaceExport: '工作区导出',
        currentFile: '当前文件',
        assetOutputPath: '资产输出路径',
        selectAssetDir: '选择资产输出目录',
        selectAssetDirPlaceholder: '选择资产输出目录（.btree.bin / .btree.json）...',
        browse: '浏览',
        typeOutputPath: 'TypeScript 类型定义输出路径',
        typeOutputHintWorkspace: '将导出以下类型定义：\n• 每个行为树的黑板变量类型（.d.ts）\n• 全局黑板变量类型（GlobalBlackboard.ts）',
        typeOutputHintSingle: '将导出当前行为树的黑板变量类型（.d.ts）',
        selectTypeDir: '选择类型定义输出目录',
        selectTypeDirPlaceholder: '选择类型定义输出目录...',
        selectFilesToExport: '选择要导出的文件',
        selectAll: '全选',
        deselectAll: '取消全选',
        binary: '二进制',
        json: 'JSON',
        noOpenFile: '没有打开的行为树文件',
        openFileHint: '请先在编辑器中打开一个行为树文件',
        close: '关闭',
        export: '导出',
        exporting: '导出中...',
        errorSelectAssetPath: '错误：请选择资产输出路径',
        errorSelectTypePath: '错误：请选择类型定义输出路径',
        errorSelectFile: '错误：请至少选择一个文件',
        errorNoCurrentFile: '错误：没有可导出的当前文件',
        exportSuccess: '导出成功！',
        exportFailed: '导出失败：{{error}}'
    },

    // ========================================
    // Project Settings Plugin
    // ========================================
    projectSettings: {
        categoryTitle: '项目',
        categoryDescription: '项目级别的配置',
        uiSettingsTitle: 'UI 设置',
        uiSettingsDescription: '配置 UI 系统的基础参数',
        designWidth: '设计宽度',
        designWidthDescription: 'UI 画布的设计宽度（像素）',
        designHeight: '设计高度',
        designHeightDescription: 'UI 画布的设计高度（像素）',
        resolutionPreset: '分辨率预设',
        resolutionPresetDescription: '选择常见的分辨率预设',
        modulesTitle: '引擎模块',
        modulesDescription: '管理项目使用的引擎模块。每个模块包含运行时组件和编辑器工具。禁用不需要的模块可以减小构建体积。',
        moduleList: '模块列表',
        moduleListDescription: '取消勾选不需要的模块。核心模块不能禁用。新增的模块会自动启用。'
    },

    // ========================================
    // Compiler Config Dialog
    // ========================================
    compilerConfig: {
        title: '编译器配置',
        noConfigUI: '该编译器没有配置界面',
        compilerNotFound: '编译器未找到',
        generatedFiles: '已生成 {{count}} 个文件',
        cancel: '取消',
        compiling: '编译中...',
        compile: '编译',
        compileFailed: '编译失败: {{error}}'
    },

    // ========================================
    // Settings Window
    // ========================================
    settingsWindow: {
        editorPreferences: '编辑器偏好设置',
        allSettings: '所有设置',
        search: '搜索',
        settingsBtn: '设置',
        export: '导出......',
        import: '导入......',
        resetToDefault: '设置为默认值',
        selectCategory: '请选择一个设置分类',
        invalidValue: '无效值',
        pluginManagerUnavailable: 'PluginManager 不可用',
        collisionMatrixNotConfigured: '碰撞矩阵编辑器未配置',
        // Main categories | 主分类
        mainCategories: {
            general: '通用',
            global: '全局',
            worldPartition: '世界分区',
            worldPartitionLocal: '世界分区（本地）',
            performance: '性能',
            other: '其他'
        }
    },

    // ========================================
    // Quick Create Menu (BT Editor)
    // ========================================
    quickCreateMenu: {
        searchPlaceholder: '搜索节点...',
        noMatchingNodes: '未找到匹配的节点',
        uncategorized: '未分类'
    },

    // ========================================
    // Plugin Settings (registered via SettingsRegistry)
    // 插件设置（通过 SettingsRegistry 注册）
    // ========================================
    pluginSettings: {
        // EditorAppearancePlugin
        appearance: {
            title: '外观',
            description: '配置编辑器的外观设置',
            font: {
                title: '字体设置',
                description: '配置编辑器字体样式',
                fontSize: {
                    label: '字体大小 (px)',
                    description: '编辑器界面的字体大小'
                }
            },
            inspector: {
                title: '检视器设置',
                description: '配置属性检视器显示',
                decimalPlaces: {
                    label: '数字小数位数',
                    description: '数字类型属性显示的小数位数，设置为 -1 表示不限制'
                }
            },
            scriptEditor: {
                title: '脚本编辑器',
                description: '配置用于打开脚本文件的外部编辑器',
                editor: {
                    label: '脚本编辑器',
                    description: '双击脚本文件时使用的编辑器'
                },
                customCommand: {
                    label: '自定义编辑器命令',
                    description: '当选择"自定义"时，填写编辑器的命令行命令（如 notepad++）',
                    placeholder: '例如：notepad++'
                }
            }
        },
        // ProfilerPlugin
        profiler: {
            title: '性能分析器',
            description: '配置性能分析器的行为和显示选项',
            connection: {
                title: '连接设置',
                description: '配置WebSocket服务器连接参数',
                port: {
                    label: '监听端口',
                    description: '性能分析器WebSocket服务器监听的端口号',
                    placeholder: '8080',
                    errorMessage: '端口号必须在1024到65535之间'
                },
                autoStart: {
                    label: '自动启动服务器',
                    description: '编辑器启动时自动启动性能分析器服务器'
                }
            },
            display: {
                title: '显示设置',
                description: '配置性能数据的显示选项',
                refreshInterval: {
                    label: '刷新间隔 (毫秒)',
                    description: '性能数据刷新的时间间隔'
                },
                maxDataPoints: {
                    label: '最大数据点数',
                    description: '图表中保留的最大历史数据点数量'
                }
            }
        },
        // PluginConfigPlugin
        plugins: {
            title: '插件',
            description: '管理项目使用的插件',
            management: {
                title: '插件管理',
                description: '启用或禁用项目需要的插件。禁用不需要的插件可以减少打包体积。',
                list: {
                    label: '插件列表',
                    description: '管理已安装的插件'
                }
            }
        },
        // ProjectSettingsPlugin
        project: {
            title: '项目',
            description: '项目级别的配置',
            uiSettings: {
                title: 'UI 设置',
                description: '配置 UI 系统的基础参数',
                designWidth: {
                    label: '设计宽度',
                    description: 'UI 画布的设计宽度（像素）'
                },
                designHeight: {
                    label: '设计高度',
                    description: 'UI 画布的设计高度（像素）'
                },
                resolutionPreset: {
                    label: '分辨率预设',
                    description: '选择常见的分辨率预设'
                }
            },
            modules: {
                title: '引擎模块',
                description: '管理项目使用的引擎模块。每个模块包含运行时组件和编辑器工具。禁用不需要的模块可以减小构建体积。',
                list: {
                    label: '模块列表',
                    description: '取消勾选不需要的模块。核心模块不能禁用。新增的模块会自动启用。'
                }
            }
        }
    }
};
