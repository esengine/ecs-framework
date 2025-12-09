import type { Translations } from '@esengine/editor-core';

/**
 * English translations (Editor Core)
 * 英文翻译（编辑器核心）
 *
 * 注意：插件翻译应通过 LocaleService.extendTranslations() 注册
 * Note: Plugin translations should be registered via LocaleService.extendTranslations()
 */
export const en: Translations = {
    // ========================================
    // App
    // ========================================
    app: {
        title: 'ESEngine Editor'
    },

    // ========================================
    // Common
    // ========================================
    common: {
        ok: 'OK',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        close: 'Close',
        confirm: 'Confirm',
        apply: 'Apply',
        reset: 'Reset',
        search: 'Search',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Info',
        yes: 'Yes',
        no: 'No',
        create: 'Create',
        open: 'Open',
        browse: 'Browse',
        name: 'Name',
        type: 'Type',
        value: 'Value',
        enabled: 'Enabled',
        disabled: 'Disabled'
    },

    // ========================================
    // Header
    // ========================================
    header: {
        toolbar: {
            openProject: 'Open Project',
            createEntity: 'Create Entity',
            deleteEntity: 'Delete Entity'
        },
        status: {
            initializing: 'Initializing...',
            ready: 'Editor Ready',
            failed: 'Initialization Failed',
            projectOpened: 'Project Opened',
            remoteConnected: 'Remote Game Connected'
        }
    },

    // ========================================
    // Panels
    // ========================================
    panel: {
        sceneHierarchy: 'Scene Hierarchy',
        viewport: 'Viewport',
        inspector: 'Inspector',
        forum: 'Forum',
        console: 'Console',
        assetBrowser: 'Asset Browser',
        profiler: 'Profiler'
    },

    hierarchy: {
        title: 'Scene Hierarchy',
        empty: 'No entities',
        emptyHint: 'Create an entity to get started',
        remoteEmpty: 'No entities in remote game',
        loading: 'Loading...',
        search: 'Search...',
        createEntity: 'Create Entity',
        createEmptyEntity: 'Create Empty Entity',
        createFolder: 'Create Folder',
        deleteEntity: 'Delete Entity',
        deleteConfirm: 'Are you sure you want to delete entity "{{name}}"?',
        renameEntity: 'Rename Entity',
        duplicateEntity: 'Duplicate Entity',
        localScene: 'Local Scene',
        remoteEntities: 'Remote Entities',
        visibility: 'Visibility',
        favorite: 'Favorite',
        lock: 'Lock',
        settings: 'Settings',
        actors: 'actors',
        selected: 'selected',
        categories: {
            rendering: 'Rendering',
            ui: 'UI',
            effects: 'Effects',
            physics: 'Physics',
            audio: 'Audio',
            basic: 'Basic',
            other: 'Other'
        },
        entityTemplates: {
            sprite: 'Sprite',
            animatedSprite: 'Animated Sprite',
            tilemap: 'Tilemap',
            camera2d: 'Camera 2D',
            particleEffect: 'Particle Effect'
        }
    },

    inspector: {
        title: 'Inspector',
        empty: 'No entity selected',
        entityInfo: {
            title: 'Entity Info',
            id: 'ID',
            name: 'Name',
            enabled: 'Enabled',
            yes: 'Yes',
            no: 'No'
        },
        components: {
            title: 'Components',
            empty: 'No components',
            add: 'Add Component',
            remove: 'Remove'
        }
    },

    addComponent: {
        title: 'Add Component',
        search: 'Search components...',
        empty: 'No available components',
        cancel: 'Cancel',
        add: 'Add Component'
    },

    viewport: {
        title: 'Viewport',
        placeholder: 'Scene viewport will appear here',
        tools: {
            select: 'Select (Q)',
            move: 'Move (W)',
            rotate: 'Rotate (E)',
            scale: 'Scale (R)'
        },
        gizmo: {
            local: 'Local',
            world: 'World'
        },
        snap: {
            toggle: 'Toggle Snap',
            grid: 'Grid Snap',
            rotation: 'Rotation Snap',
            scale: 'Scale Snap'
        },
        view: {
            showGrid: 'Show Grid',
            showGizmos: 'Show Gizmos',
            stats: 'Stats',
            resetView: 'Reset View',
            fullscreen: 'Fullscreen'
        },
        run: {
            options: 'Run Options',
            inBrowser: 'Run in Browser',
            onDevice: 'Run on Device',
            openedInBrowser: 'Opened in browser: {{url}}',
            serverStarted: 'Server Started',
            previewUrl: 'Preview URL: {{url}}',
            failed: 'Run Failed',
            startFailed: 'Failed to Start'
        },
        errors: {
            noScene: 'No scene to run',
            missingCamera: 'Missing Camera: No camera entity in scene. Please add an entity with Camera component.',
            noSceneFirst: 'Please create a scene first'
        },
        notifications: {
            noScene: 'No Scene'
        }
    },

    console: {
        title: 'Console',
        placeholder: 'Console output will appear here',
        clear: 'Clear',
        filter: 'Filter',
        levels: {
            all: 'All',
            info: 'Info',
            warn: 'Warnings',
            error: 'Errors'
        }
    },

    outputLog: {
        searchPlaceholder: 'Search logs...',
        filters: 'Filters',
        logLevels: 'Log Levels',
        remoteOnly: 'Remote Only',
        pauseAutoScroll: 'Pause auto-scroll',
        resumeAutoScroll: 'Resume auto-scroll',
        settings: 'Settings',
        clearLogs: 'Clear Logs',
        noMatchingLogs: 'No matching logs',
        noLogs: 'No logs to display',
        logs: 'logs',
        scrollToBottom: 'Scroll to bottom',
        copy: 'Copy',
        callStack: 'Call Stack:'
    },

    // ========================================
    // Footer / Status Bar
    // ========================================
    footer: {
        plugins: 'Plugins',
        entities: 'Entities',
        core: 'Core',
        active: 'Active',
        inactive: 'Inactive'
    },

    statusBar: {
        contentDrawer: 'Content Drawer',
        outputLog: 'Output Log',
        consolePlaceholder: 'Enter Console Command',
        trace: 'Trace',
        network: 'Network',
        sourceControl: 'Source Control',
        allSaved: 'All Saved',
        revisionControl: 'Revision Control'
    },

    // ========================================
    // Scene
    // ========================================
    scene: {
        new: 'New Scene',
        open: 'Open Scene',
        save: 'Save Scene',
        saveAs: 'Save Scene As',
        newCreated: 'New scene created',
        createFailed: 'Failed to create scene',
        openedSuccess: 'Scene opened: {{name}}',
        openFailed: 'Failed to open scene',
        savedSuccess: 'Scene saved: {{name}}',
        saveFailed: 'Failed to save scene',
        saveAsFailed: 'Failed to save scene as'
    },

    // ========================================
    // Project
    // ========================================
    project: {
        open: 'Open Project',
        create: 'Create Project',
        close: 'Close Project',
        creating: 'Creating project...',
        opening: 'Opening project...',
        createFailed: 'Failed to Create Project',
        openFailed: 'Failed to Open Project',
        deleteFailed: 'Failed to Delete Project',
        alreadyExists: 'Project Already Exists',
        existsQuestion: 'An ECS project already exists in this directory. Do you want to open it?',
        invalidDirectory: 'Project directory does not exist or is invalid',
        serviceUnavailable: 'Project service is not available. Please restart the editor.',
        createdOpening: 'Project created, opening...',
        browser: {
            title: 'Project Browser',
            recentProjects: 'Recent Projects',
            newProject: 'New Project',
            openExisting: 'Open Existing',
            noRecentProjects: 'No recent projects',
            lastOpened: 'Last opened',
            openInExplorer: 'Open in Explorer',
            removeFromList: 'Remove from List'
        },
        wizard: {
            title: 'Project Browser',
            projectName: 'Project Name',
            projectLocation: 'Project Location',
            template: 'Template',
            selectTemplate: 'Select a Template',
            projectSettings: 'Project Settings',
            browse: 'Browse...',
            create: 'Create',
            cancel: 'Cancel',
            templates: {
                empty: 'Empty Project',
                demo2d: '2D Demo',
                demo3d: '3D Demo',
                blank: 'Blank',
                blankDesc: 'A blank project with no starter content. Perfect for starting from scratch.'
            }
        }
    },

    // ========================================
    // Plugin
    // ========================================
    plugin: {
        reloadedSuccess: 'Plugins reloaded',
        reloadFailed: 'Failed to reload plugins',
        manager: 'Plugin Manager',
        enable: 'Enable',
        disable: 'Disable',
        settings: 'Settings',
        version: 'Version',
        author: 'Author',
        dependencies: 'Dependencies'
    },

    // ========================================
    // Loading
    // ========================================
    loading: {
        step1: 'Step 1/3: Opening project config...',
        step2: 'Step 2/3: Initializing engine and modules...',
        step3: 'Step 3/3: Initializing scene...',
        loadingPlugins: 'Loading project plugins...',
        engineTimeoutError: 'Engine initialization timeout'
    },

    // ========================================
    // Menu
    // ========================================
    menu: {
        file: {
            title: 'File',
            newScene: 'New Scene',
            openScene: 'Open Scene',
            saveScene: 'Save Scene',
            saveSceneAs: 'Save Scene As...',
            openProject: 'Open Project',
            closeProject: 'Close Project',
            exit: 'Exit',
            buildSettings: 'Build Settings'
        },
        edit: {
            title: 'Edit',
            undo: 'Undo',
            redo: 'Redo',
            cut: 'Cut',
            copy: 'Copy',
            paste: 'Paste',
            delete: 'Delete',
            selectAll: 'Select All'
        },
        view: {
            title: 'View',
            resetLayout: 'Reset Layout',
            fullscreen: 'Fullscreen',
            zoomIn: 'Zoom In',
            zoomOut: 'Zoom Out'
        },
        window: {
            title: 'Window',
            sceneHierarchy: 'Scene Hierarchy',
            inspector: 'Inspector',
            assets: 'Assets',
            console: 'Console',
            viewport: 'Viewport',
            pluginManager: 'Plugin Manager',
            devtools: 'Developer Tools'
        },
        tools: {
            title: 'Tools',
            pluginManager: 'Plugin Manager',
            createPlugin: 'Create Plugin',
            reloadPlugins: 'Reload Plugins',
            portManager: 'Port Manager',
            settings: 'Settings',
            devtools: 'Developer Tools',
            build: 'Build Settings'
        },
        help: {
            title: 'Help',
            documentation: 'Documentation',
            checkForUpdates: 'Check for Updates',
            about: 'About'
        }
    },

    // ========================================
    // Settings
    // ========================================
    settings: {
        title: 'Settings',
        general: 'General',
        appearance: 'Appearance',
        language: 'Language',
        theme: 'Theme',
        plugins: 'Plugins',
        editor: 'Editor',
        shortcuts: 'Shortcuts',
        scriptEditor: {
            systemDefault: 'System Default',
            custom: 'Custom'
        }
    },

    // ========================================
    // Dialog
    // ========================================
    dialog: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        close: 'Close',
        save: 'Save',
        dontSave: "Don't Save",
        unsavedChanges: 'Unsaved Changes',
        unsavedChangesMessage: 'You have unsaved changes. Do you want to save before closing?'
    },

    // ========================================
    // Asset Browser
    // ========================================
    assetBrowser: {
        title: 'Asset Browser',
        import: 'Import',
        refresh: 'Refresh',
        newFolder: 'New Folder',
        rename: 'Rename',
        delete: 'Delete',
        duplicate: 'Duplicate',
        showInExplorer: 'Show in Explorer',
        noAssets: 'No assets in this folder',
        filter: {
            all: 'All',
            textures: 'Textures',
            audio: 'Audio',
            scenes: 'Scenes',
            scripts: 'Scripts',
            prefabs: 'Prefabs'
        }
    },

    // ========================================
    // Content Browser
    // ========================================
    contentBrowser: {
        favorites: 'Favorites',
        collections: 'Collections',
        add: 'Add',
        import: 'Import',
        saveAll: 'Save All',
        search: 'Search',
        items: 'items',
        dockInLayout: 'Dock in Layout',
        noProject: 'No project loaded',
        empty: 'This folder is empty',
        newFolder: 'New Folder',
        newPrefix: 'New',
        managedDirectoryTooltip: 'GUID-managed directory - Assets here get unique IDs for references',
        unmanagedWarning: 'This folder is not managed by GUID system. Assets created here cannot be referenced by GUID.',
        unmanagedWarningTitle: 'Unmanaged Directory',
        rename: 'Rename',
        delete: 'Delete',
        batchRename: 'Batch Rename',
        duplicate: 'Duplicate',
        open: 'Open',
        save: 'Save',
        openInExplorer: 'Show in Explorer',
        copyPath: 'Copy Path',
        newSubfolder: 'New Subfolder',
        deleteConfirmTitle: 'Confirm Delete',
        deleteConfirmMessage: 'Delete "{{name}}"?',
        cannotDeleteRoot: 'Cannot delete root directory',
        refresh: 'Refresh',
        assetActions: 'Asset Actions',
        reimport: 'Reimport',
        export: 'Export...',
        migrateAsset: 'Migrate Asset',
        assetLocalization: 'Asset Localization',
        createLocalizedAsset: 'Create Localized Asset',
        importTranslation: 'Import Translation',
        exportTranslation: 'Export Translation',
        manageTags: 'Manage Tags',
        copyReference: 'Copy Reference',
        copyObjectPath: 'Copy Object Path',
        copyPackagePath: 'Copy Package Path',
        referenceViewer: 'Reference Viewer',
        sizeMap: 'Size Map',
        templateLabels: {
            material: 'Material',
            shader: 'Shader',
            tilemap: 'Tilemap',
            tileset: 'Tileset',
            component: 'Component',
            system: 'System',
            typescript: 'TypeScript',
            inspector: 'Inspector',
            gizmo: 'Gizmo'
        },
        dialogs: {
            renameTitle: 'Rename',
            cancel: 'Cancel',
            ok: 'OK',
            newFile: 'New {{type}}',
            enterFileName: 'Enter file name ({{ext}} will be added):',
            create: 'Create'
        }
    },

    // ========================================
    // Build
    // ========================================
    build: {
        title: 'Build Settings',
        settingsTitle: 'Build Settings',
        platform: 'Platform',
        outputPath: 'Output Path',
        buildButton: 'Build',
        building: 'Building...',
        success: 'Build successful',
        failed: 'Build failed',
        platforms: {
            web: 'Web',
            desktop: 'Desktop',
            mobile: 'Mobile'
        }
    },

    // ========================================
    // Asset Picker
    // ========================================
    assetPicker: {
        title: 'Select Asset',
        loading: 'Loading...',
        empty: 'No assets found',
        select: 'Select',
        cancel: 'Cancel',
        search: 'Search...',
        back: 'Back',
        listView: 'List View',
        gridView: 'Grid View',
        itemCount: '{{count}} items'
    },

    // ========================================
    // About Dialog
    // ========================================
    about: {
        title: 'About ESEngine Editor',
        version: 'Version',
        description: 'High-performance game editor for ECS-based game development',
        checkUpdate: 'Check for Updates',
        checking: 'Checking...',
        updateAvailable: 'New version available',
        latest: 'You are using the latest version',
        error: 'Failed to check for updates',
        download: 'Download & Install',
        installing: 'Installing...',
        close: 'Close',
        copyright: '© 2025 ESEngine. All rights reserved.',
        website: 'Website',
        github: 'GitHub'
    },

    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        play: 'Play',
        playing: 'Running...',
        stop: 'Stop',
        pause: 'Pause',
        resume: 'Resume',
        step: 'Step Forward',
        save: 'Save Scene (Ctrl+S)',
        open: 'Open Scene',
        undo: 'Undo (Ctrl+Z)',
        redo: 'Redo (Ctrl+Y)',
        preview: 'Preview Mode',
        runOptions: 'Run Options',
        runInBrowser: 'Run in Browser',
        runOnDevice: 'Run on Device'
    },

    // ========================================
    // Title Bar
    // ========================================
    titleBar: {
        noProject: 'No Project',
        unsaved: 'Unsaved Changes',
        minimize: 'Minimize',
        maximize: 'Maximize',
        restore: 'Restore',
        close: 'Close'
    },

    // ========================================
    // Plugin Generator
    // ========================================
    pluginGenerator: {
        title: 'Create Plugin',
        pluginName: 'Plugin Name',
        pluginNamePlaceholder: 'e.g: my-game-plugin',
        pluginVersion: 'Plugin Version',
        outputPath: 'Output Path',
        selectPath: 'Select Path',
        includeExample: 'Include Example Node',
        generate: 'Generate Plugin',
        cancel: 'Cancel',
        generating: 'Generating...',
        success: 'Plugin created successfully!',
        errorEmpty: 'Please enter plugin name',
        errorInvalidName: 'Plugin name can only contain letters, numbers, hyphens and underscores',
        errorNoPath: 'Please select output path'
    },

    // ========================================
    // GitHub Auth
    // ========================================
    github: {
        title: 'GitHub Login',
        githubLogin: 'GitHub Login',
        oauthLogin: 'OAuth Login (Recommended)',
        tokenLogin: 'Token Login',
        oauthStep1: '1. Click "Start Authorization"',
        oauthStep2: '2. Open GitHub authorization page in browser',
        oauthStep3: '3. Enter the code shown below and authorize',
        startAuth: 'Start Authorization',
        authorizing: 'Waiting for authorization...',
        authorized: 'Authorized!',
        authFailed: 'Authorization failed',
        userCode: 'Authorization Code',
        copyCode: 'Copy Code',
        openBrowser: 'Open Browser',
        tokenLabel: 'GitHub Personal Access Token',
        tokenPlaceholder: 'Paste your GitHub Token',
        tokenHint: 'Requires repo and workflow permissions',
        createToken: 'Create Token',
        login: 'Login',
        back: 'Back',
        enterToken: 'Please enter a token',
        authFailedToken: 'Authentication failed. Please check your token.'
    },

    // ========================================
    // Startup Page
    // ========================================
    startup: {
        title: 'ESEngine Editor',
        subtitle: 'Professional Game Development Tool',
        version: 'Version',
        recentProjects: 'Recent Projects',
        newProject: 'New Project',
        openProject: 'Open Project',
        createProject: 'Create Project',
        noRecentProjects: 'No recent projects',
        lastOpened: 'Last opened',
        community: 'Community',
        discord: 'Discord',
        forum: 'Forum',
        documentation: 'Documentation',
        tutorials: 'Tutorials',
        changelog: 'Changelog',
        settings: 'Settings',
        language: 'Language',
        updateAvailable: 'New version available',
        updateNow: 'Update Now',
        installing: 'Installing...',
        later: 'Later',
        removeFromList: 'Remove from List',
        deleteProject: 'Delete Project',
        deleteConfirmTitle: 'Delete Project',
        deleteConfirmMessage: 'Are you sure you want to permanently delete this project? This action cannot be undone.',
        cancel: 'Cancel',
        delete: 'Delete',
        envReady: 'Environment Ready',
        envNotReady: 'Environment Issue',
        esbuildReady: 'esbuild ready',
        esbuildMissing: 'esbuild not found'
    },

    // ========================================
    // Editor Toolbar (BT Editor)
    // ========================================
    editorToolbar: {
        play: 'Play',
        pause: 'Pause',
        resume: 'Resume',
        stop: 'Stop',
        stepForward: 'Step Forward',
        reset: 'Reset',
        resetView: 'Reset View (scroll to zoom, Alt+drag to pan)',
        clearCanvas: 'Clear Canvas',
        clear: 'Clear',
        toggleGizmos: 'Show/Hide Selection Border (Gizmos)',
        undo: 'Undo (Ctrl+Z)',
        redo: 'Redo (Ctrl+Shift+Z / Ctrl+Y)',
        idle: 'Idle',
        running: 'Running',
        paused: 'Paused',
        step: 'Step'
    },

    // ========================================
    // File Tree
    // ========================================
    fileTree: {
        newFile: 'New File',
        newFolder: 'New Folder',
        openFile: 'Open File',
        save: 'Save',
        rename: 'Rename',
        batchRename: 'Batch Rename',
        duplicate: 'Duplicate',
        delete: 'Delete',
        assetActions: 'Asset Actions',
        reimport: 'Reimport',
        exportAsset: 'Export...',
        migrateAsset: 'Migrate Asset',
        assetLocalization: 'Asset Localization',
        createLocalizedAsset: 'Create Localized Asset',
        importTranslation: 'Import Translation',
        exportTranslation: 'Export Translation',
        manageTags: 'Manage Tags',
        copyReference: 'Copy Reference',
        copyObjectPath: 'Copy Object Path',
        copyPackagePath: 'Copy Package Path',
        referenceViewer: 'Reference Viewer',
        sizeMap: 'Size Map',
        showInExplorer: 'Show in Explorer',
        loading: 'Loading...',
        noFolders: 'No folders',
        renameFailed: 'Rename failed',
        deleteFailed: 'Delete failed',
        createFileFailed: 'Create file failed',
        createFolderFailed: 'Create folder failed',
        createTemplateFailed: 'Create template file failed',
        confirmDelete: 'Confirm Delete',
        confirmDeleteFolder: 'Are you sure you want to delete folder "{{name}}" and all its contents?\nThis action cannot be undone.',
        confirmDeleteFile: 'Are you sure you want to delete file "{{name}}"?\nThis action cannot be undone.',
        cancel: 'Cancel',
        create: 'Create',
        newFileTitle: 'New File',
        newFolderTitle: 'New Folder',
        enterFileName: 'Enter file name:',
        enterFolderName: 'Enter folder name:',
        enterTemplateFileName: 'Enter file name (.{{ext}} will be added):',
        fileNamePlaceholder: 'e.g: config.json',
        folderNamePlaceholder: 'e.g: assets',
        templateNamePlaceholder: 'e.g: MyFile'
    },

    // ========================================
    // Compile Dialog
    // ========================================
    compileDialog: {
        compileFailed: 'Compile failed',
        outputFiles: 'Output files',
        errors: 'Errors',
        close: 'Close',
        compiling: 'Compiling...',
        compile: 'Compile'
    },

    // ========================================
    // Build Settings Panel
    // ========================================
    buildSettings: {
        buildProfiles: 'Build Profiles',
        addBuildProfile: 'Add Build Profile',
        playerSettings: 'Player Settings',
        assetImportOverrides: 'Asset Import Overrides',
        platforms: 'Platforms',
        sceneList: 'Scene List',
        active: 'Active',
        switchProfile: 'Switch Profile',
        build: 'Build',
        buildAndRun: 'Build And Run',
        buildData: 'Build Data',
        scriptingDefines: 'Scripting Defines',
        listIsEmpty: 'List is empty',
        addOpenScenes: 'Add Open Scenes',
        platformSettings: 'Platform Settings',
        architecture: 'Architecture',
        developmentBuild: 'Development Build',
        sourceMap: 'Source Map',
        compressionMethod: 'Compression Method',
        buildMode: 'Build Mode',
        splitBundles: 'Split Bundles (Recommended)',
        singleBundle: 'Single Bundle',
        splitBundlesHint: 'Core runtime + plugins loaded on demand. Best for production games.',
        singleBundleHint: 'All code in one file. Best for small games or playable ads.',
        playerSettingsOverrides: 'Player Settings Overrides',
        companyName: 'Company Name',
        productName: 'Product Name',
        version: 'Version',
        defaultIcon: 'Default Icon',
        none: 'None',
        buildInProgress: 'Build in Progress',
        preparing: 'Preparing...',
        compiling: 'Compiling...',
        packaging: 'Packaging assets...',
        copying: 'Copying files...',
        postProcessing: 'Post-processing...',
        completed: 'Completed',
        failed: 'Failed',
        cancelled: 'Cancelled',
        cancel: 'Cancel',
        close: 'Close',
        buildSucceeded: 'Build succeeded!',
        buildFailed: 'Build failed',
        warnings: 'Warnings',
        outputPath: 'Output Path',
        duration: 'Duration',
        selectPlatform: 'Select a platform or build profile',
        settings: 'Settings'
    },

    // ========================================
    // Forum
    // ========================================
    forum: {
        // ForumPanel
        community: 'Community',
        clickToViewProfile: 'Click to view profile',
        loading: 'Loading...',

        // ForumAuth
        communityTitle: 'ESEngine Community',
        signInWithGitHub: 'Sign in with GitHub to join the discussion',
        step1: '1. Click the button below',
        step2: '2. Enter the code on GitHub',
        step3: '3. Authorize the application',
        continueWithGitHub: 'Continue with GitHub',
        waitingForAuth: 'Waiting for authorization...',
        enterCodeOnGitHub: 'Enter this code on GitHub:',
        copyCode: 'Copy code',
        openGitHub: 'Open GitHub',
        authSuccess: 'Authorization successful!',
        authFailed: 'Authorization failed',
        tryAgain: 'Try Again',

        // ForumPostList
        askQuestionsShareIdeas: 'Ask questions, share ideas, and connect with other developers',
        newDiscussion: 'New Discussion',
        viewOnGitHub: 'View on GitHub',
        allCategories: 'All Categories',
        searchDiscussions: 'Search discussions...',
        refresh: 'Refresh',
        new: 'New',
        discussions: 'discussions',
        clearFilter: 'Clear filter',
        justNow: 'Just now',
        minutesAgo: '{{count}}m ago',
        hoursAgo: '{{count}}h ago',
        yesterday: 'Yesterday',
        daysAgo: '{{count}}d ago',
        newBadge: 'New',
        hotBadge: 'Hot',
        openInGitHub: 'Open in GitHub',
        noDiscussionsYet: 'No discussions yet',
        startADiscussion: 'Start a discussion',
        loadMore: 'Load More',
        answered: 'Answered',

        // ForumPostDetail
        backToList: 'Back to list',
        reply: 'Reply',
        replyTo: 'Reply to @{{login}}...',
        cancel: 'Cancel',
        comments: 'Comments',
        writeComment: 'Write a comment... (Markdown supported)',
        posting: 'Posting...',
        postComment: 'Post Comment',
        noCommentsYet: 'No comments yet. Be the first to comment!',
        answer: 'Answer',

        // ForumCreatePost
        startDiscussion: 'Start a Discussion',
        selectCategory: 'Select Category',
        title: 'Title',
        enterDescriptiveTitle: 'Enter a descriptive title...',
        write: 'Write',
        preview: 'Preview',
        bold: 'Bold',
        italic: 'Italic',
        inlineCode: 'Inline code',
        link: 'Link',
        list: 'List',
        quote: 'Quote',
        uploadImage: 'Upload image',
        markdownHelp: 'Markdown Help',
        uploading: 'Uploading...',
        dropImageHere: 'Drop image here',
        editorPlaceholder: 'Write your content here...\n\nYou can use Markdown:\n- **bold** and *italic*\n- `code` and ```code blocks```\n- [links](url) and ![images](url)\n- > quotes and - lists\n\nDrag & drop or paste images to upload',
        nothingToPreview: 'Nothing to preview',
        enterTitle: 'Please enter a title',
        enterContent: 'Please enter content',
        selectCategoryError: 'Please select a category',
        failedToCreateDiscussion: 'Failed to create discussion',
        anErrorOccurred: 'An error occurred',
        creating: 'Creating...',
        createDiscussion: 'Create Discussion',
        tips: 'Tips',
        tip1: 'Use a clear, descriptive title',
        tip2: 'Select the right category for your topic',
        tip3: 'Provide enough context and details',
        tip4: 'Use code blocks for code snippets',
        tip5: 'Be respectful and constructive',
        markdownGuide: 'Markdown Guide',
        failedToUploadImage: 'Failed to upload image',

        // ForumProfile
        viewGitHubProfile: 'View GitHub Profile',
        signOut: 'Sign Out'
    },

    // ========================================
    // Export Runtime Dialog
    // ========================================
    exportRuntime: {
        title: 'Export Runtime Assets',
        workspaceExport: 'Workspace Export',
        currentFile: 'Current File',
        assetOutputPath: 'Asset Output Path',
        selectAssetDir: 'Select Asset Output Directory',
        selectAssetDirPlaceholder: 'Select asset output directory (.btree.bin / .btree.json)...',
        browse: 'Browse',
        typeOutputPath: 'TypeScript Type Definition Output Path',
        typeOutputHintWorkspace: 'Will export the following type definitions:\n• Blackboard variable types for each behavior tree (.d.ts)\n• Global blackboard variable types (GlobalBlackboard.ts)',
        typeOutputHintSingle: 'Will export blackboard variable types for the current behavior tree (.d.ts)',
        selectTypeDir: 'Select Type Definition Output Directory',
        selectTypeDirPlaceholder: 'Select type definition output directory...',
        selectFilesToExport: 'Select files to export',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        binary: 'Binary',
        json: 'JSON',
        noOpenFile: 'No behavior tree file open',
        openFileHint: 'Please open a behavior tree file in the editor first',
        close: 'Close',
        export: 'Export',
        exporting: 'Exporting...',
        errorSelectAssetPath: 'Error: Please select asset output path',
        errorSelectTypePath: 'Error: Please select type definition output path',
        errorSelectFile: 'Error: Please select at least one file',
        errorNoCurrentFile: 'Error: No current file to export',
        exportSuccess: 'Export successful!',
        exportFailed: 'Export failed: {{error}}'
    },

    // ========================================
    // Project Settings Plugin
    // ========================================
    projectSettings: {
        categoryTitle: 'Project',
        categoryDescription: 'Project-level configuration',
        uiSettingsTitle: 'UI Settings',
        uiSettingsDescription: 'Configure UI system base parameters',
        designWidth: 'Design Width',
        designWidthDescription: 'UI canvas design width (pixels)',
        designHeight: 'Design Height',
        designHeightDescription: 'UI canvas design height (pixels)',
        resolutionPreset: 'Resolution Preset',
        resolutionPresetDescription: 'Select a common resolution preset',
        modulesTitle: 'Engine Modules',
        modulesDescription: 'Manage engine modules used by the project. Each module contains runtime components and editor tools. Disable unnecessary modules to reduce build size.',
        moduleList: 'Module List',
        moduleListDescription: 'Uncheck modules you do not need. Core modules cannot be disabled. New modules are enabled by default.'
    },

    // ========================================
    // Compiler Config Dialog
    // ========================================
    compilerConfig: {
        title: 'Compiler Configuration',
        noConfigUI: 'This compiler has no configuration UI',
        compilerNotFound: 'Compiler not found',
        generatedFiles: 'Generated {{count}} files',
        cancel: 'Cancel',
        compiling: 'Compiling...',
        compile: 'Compile',
        compileFailed: 'Compile failed: {{error}}'
    },

    // ========================================
    // Settings Window
    // ========================================
    settingsWindow: {
        editorPreferences: 'Editor Preferences',
        allSettings: 'All Settings',
        search: 'Search',
        settingsBtn: 'Settings',
        export: 'Export...',
        import: 'Import...',
        resetToDefault: 'Reset to Default',
        selectCategory: 'Please select a settings category',
        invalidValue: 'Invalid value',
        pluginManagerUnavailable: 'PluginManager unavailable',
        collisionMatrixNotConfigured: 'Collision matrix editor not configured',
        // Main categories | 主分类
        mainCategories: {
            general: 'General',
            global: 'Global',
            worldPartition: 'World Partition',
            worldPartitionLocal: 'World Partition (Local)',
            performance: 'Performance',
            other: 'Other'
        }
    },

    // ========================================
    // Quick Create Menu (BT Editor)
    // ========================================
    quickCreateMenu: {
        searchPlaceholder: 'Search nodes...',
        noMatchingNodes: 'No matching nodes found',
        uncategorized: 'Uncategorized'
    },

    // ========================================
    // Plugin Settings (registered via SettingsRegistry)
    // 插件设置（通过 SettingsRegistry 注册）
    // ========================================
    pluginSettings: {
        // EditorAppearancePlugin
        appearance: {
            title: 'Appearance',
            description: 'Configure editor appearance settings',
            font: {
                title: 'Font Settings',
                description: 'Configure editor font style',
                fontSize: {
                    label: 'Font Size (px)',
                    description: 'Editor interface font size'
                }
            },
            inspector: {
                title: 'Inspector Settings',
                description: 'Configure property inspector display',
                decimalPlaces: {
                    label: 'Decimal Places',
                    description: 'Number of decimal places for numeric properties, -1 for unlimited'
                }
            },
            scriptEditor: {
                title: 'Script Editor',
                description: 'Configure external editor for opening script files',
                editor: {
                    label: 'Script Editor',
                    description: 'Editor to use when double-clicking script files'
                },
                customCommand: {
                    label: 'Custom Editor Command',
                    description: 'When "Custom" is selected, enter the editor command line (e.g. notepad++)',
                    placeholder: 'e.g.: notepad++'
                }
            }
        },
        // ProfilerPlugin
        profiler: {
            title: 'Profiler',
            description: 'Configure profiler behavior and display options',
            connection: {
                title: 'Connection Settings',
                description: 'Configure WebSocket server connection parameters',
                port: {
                    label: 'Listen Port',
                    description: 'Port number for profiler WebSocket server',
                    placeholder: '8080',
                    errorMessage: 'Port must be between 1024 and 65535'
                },
                autoStart: {
                    label: 'Auto Start Server',
                    description: 'Automatically start profiler server when editor launches'
                }
            },
            display: {
                title: 'Display Settings',
                description: 'Configure performance data display options',
                refreshInterval: {
                    label: 'Refresh Interval (ms)',
                    description: 'Time interval for performance data refresh'
                },
                maxDataPoints: {
                    label: 'Max Data Points',
                    description: 'Maximum number of historical data points in charts'
                }
            }
        },
        // PluginConfigPlugin
        plugins: {
            title: 'Plugins',
            description: 'Manage project plugins',
            management: {
                title: 'Plugin Management',
                description: 'Enable/disable plugins for your project. Disabling unused plugins reduces bundle size.',
                list: {
                    label: 'Plugin List',
                    description: 'Manage installed plugins'
                }
            }
        },
        // ProjectSettingsPlugin
        project: {
            title: 'Project',
            description: 'Project-level configuration',
            uiSettings: {
                title: 'UI Settings',
                description: 'Configure UI system base parameters',
                designWidth: {
                    label: 'Design Width',
                    description: 'UI canvas design width (pixels)'
                },
                designHeight: {
                    label: 'Design Height',
                    description: 'UI canvas design height (pixels)'
                },
                resolutionPreset: {
                    label: 'Resolution Preset',
                    description: 'Select a common resolution preset'
                }
            },
            modules: {
                title: 'Engine Modules',
                description: 'Manage engine modules used by the project. Each module contains runtime components and editor tools. Disabling unused modules reduces build size.',
                list: {
                    label: 'Module List',
                    description: 'Uncheck modules you do not need. Core modules cannot be disabled. New modules are enabled by default.'
                }
            }
        }
    }
};
