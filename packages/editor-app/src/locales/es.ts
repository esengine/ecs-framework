import type { Translations } from '@esengine/editor-core';

/**
 * Spanish translations (Editor Core)
 * Traducciones en español（编辑器核心）
 *
 * 注意：插件翻译应通过 LocaleService.extendTranslations() 注册
 * Note: Plugin translations should be registered via LocaleService.extendTranslations()
 */
export const es: Translations = {
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
        ok: 'Aceptar',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        close: 'Cerrar',
        confirm: 'Confirmar',
        apply: 'Aplicar',
        reset: 'Restablecer',
        search: 'Buscar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia',
        info: 'Información',
        yes: 'Sí',
        no: 'No',
        create: 'Crear',
        open: 'Abrir',
        browse: 'Examinar',
        name: 'Nombre',
        type: 'Tipo',
        value: 'Valor',
        enabled: 'Habilitado',
        disabled: 'Deshabilitado'
    },

    // ========================================
    // Header
    // ========================================
    header: {
        toolbar: {
            openProject: 'Abrir Proyecto',
            createEntity: 'Crear Entidad',
            deleteEntity: 'Eliminar Entidad'
        },
        status: {
            initializing: 'Inicializando...',
            ready: 'Editor Listo',
            failed: 'Inicialización Fallida',
            projectOpened: 'Proyecto Abierto',
            remoteConnected: 'Juego Remoto Conectado'
        }
    },

    // ========================================
    // Panels
    // ========================================
    panel: {
        sceneHierarchy: 'Jerarquía de Escena',
        viewport: 'Vista',
        inspector: 'Inspector',
        forum: 'Foro',
        console: 'Consola',
        assetBrowser: 'Explorador de Recursos',
        profiler: 'Perfilador'
    },

    hierarchy: {
        title: 'Jerarquía de Escena',
        empty: 'Sin entidades',
        emptyHint: 'Crear una entidad para comenzar',
        remoteEmpty: 'Sin entidades en el juego remoto',
        loading: 'Cargando...',
        search: 'Buscar...',
        createEntity: 'Crear Entidad',
        createEmptyEntity: 'Crear Entidad Vacía',
        createFolder: 'Crear Carpeta',
        deleteEntity: 'Eliminar Entidad',
        deleteConfirm: '¿Está seguro de que desea eliminar la entidad "{{name}}"?',
        renameEntity: 'Renombrar Entidad',
        duplicateEntity: 'Duplicar Entidad',
        localScene: 'Escena Local',
        remoteEntities: 'Entidades Remotas',
        visibility: 'Visibilidad',
        favorite: 'Favorito',
        lock: 'Bloquear',
        settings: 'Configuración',
        actors: 'actores',
        selected: 'seleccionados',
        categories: {
            rendering: 'Renderizado',
            ui: 'UI',
            effects: 'Efectos',
            physics: 'Física',
            audio: 'Audio',
            basic: 'Básico',
            other: 'Otro'
        },
        entityTemplates: {
            sprite: 'Sprite',
            animatedSprite: 'Sprite Animado',
            tilemap: 'Mapa de Tiles',
            camera2d: 'Cámara 2D',
            particleEffect: 'Efecto de Partículas'
        }
    },

    inspector: {
        title: 'Inspector',
        empty: 'Ninguna entidad seleccionada',
        entityInfo: {
            title: 'Información de Entidad',
            id: 'ID',
            name: 'Nombre',
            enabled: 'Habilitado',
            yes: 'Sí',
            no: 'No'
        },
        components: {
            title: 'Componentes',
            empty: 'Sin componentes',
            add: 'Agregar Componente',
            remove: 'Eliminar'
        }
    },

    addComponent: {
        title: 'Agregar Componente',
        search: 'Buscar componentes...',
        empty: 'Sin componentes disponibles',
        cancel: 'Cancelar',
        add: 'Agregar Componente'
    },

    viewport: {
        title: 'Vista',
        placeholder: 'La vista de escena aparecerá aquí',
        tools: {
            select: 'Seleccionar (Q)',
            move: 'Mover (W)',
            rotate: 'Rotar (E)',
            scale: 'Escalar (R)'
        },
        gizmo: {
            local: 'Local',
            world: 'Mundo'
        },
        snap: {
            toggle: 'Alternar Ajuste',
            grid: 'Ajuste de Cuadrícula',
            rotation: 'Ajuste de Rotación',
            scale: 'Ajuste de Escala'
        },
        view: {
            showGrid: 'Mostrar Cuadrícula',
            showGizmos: 'Mostrar Gizmos',
            stats: 'Estadísticas',
            resetView: 'Restablecer Vista',
            fullscreen: 'Pantalla Completa'
        },
        run: {
            options: 'Opciones de Ejecución',
            inBrowser: 'Ejecutar en Navegador',
            onDevice: 'Ejecutar en Dispositivo',
            openedInBrowser: 'Abierto en navegador: {{url}}',
            serverStarted: 'Servidor Iniciado',
            previewUrl: 'URL de Vista Previa: {{url}}',
            failed: 'Ejecución Fallida',
            startFailed: 'Error al Iniciar'
        },
        errors: {
            noScene: 'No hay escena para ejecutar',
            missingCamera: 'Falta Cámara: No hay entidad de cámara en la escena. Agregue una entidad con componente Camera.',
            noSceneFirst: 'Por favor, cree una escena primero'
        },
        notifications: {
            noScene: 'Sin Escena'
        }
    },

    console: {
        title: 'Consola',
        placeholder: 'La salida de consola aparecerá aquí',
        clear: 'Limpiar',
        filter: 'Filtrar',
        levels: {
            all: 'Todo',
            info: 'Información',
            warn: 'Advertencias',
            error: 'Errores'
        }
    },

    outputLog: {
        searchPlaceholder: 'Buscar registros...',
        filters: 'Filtros',
        logLevels: 'Niveles de Registro',
        remoteOnly: 'Solo Remoto',
        pauseAutoScroll: 'Pausar desplazamiento automático',
        resumeAutoScroll: 'Reanudar desplazamiento automático',
        settings: 'Configuración',
        clearLogs: 'Limpiar Registros',
        noMatchingLogs: 'No hay registros coincidentes',
        noLogs: 'Sin registros para mostrar',
        logs: 'registros',
        scrollToBottom: 'Ir al final',
        copy: 'Copiar',
        callStack: 'Pila de llamadas:'
    },

    // ========================================
    // Footer / Status Bar
    // ========================================
    footer: {
        plugins: 'Plugins',
        entities: 'Entidades',
        core: 'Núcleo',
        active: 'Activo',
        inactive: 'Inactivo'
    },

    statusBar: {
        contentDrawer: 'Panel de Contenido',
        outputLog: 'Registro de Salida',
        consolePlaceholder: 'Ingrese Comando de Consola',
        trace: 'Seguimiento',
        network: 'Red',
        sourceControl: 'Control de Código',
        allSaved: 'Todo Guardado',
        revisionControl: 'Control de Revisión'
    },

    // ========================================
    // Scene
    // ========================================
    scene: {
        new: 'Nueva Escena',
        open: 'Abrir Escena',
        save: 'Guardar Escena',
        saveAs: 'Guardar Escena Como',
        newCreated: 'Nueva escena creada',
        createFailed: 'Error al crear escena',
        openedSuccess: 'Escena abierta: {{name}}',
        openFailed: 'Error al abrir escena',
        savedSuccess: 'Escena guardada: {{name}}',
        saveFailed: 'Error al guardar escena',
        saveAsFailed: 'Error al guardar escena como'
    },

    // ========================================
    // Project
    // ========================================
    project: {
        open: 'Abrir Proyecto',
        create: 'Crear Proyecto',
        close: 'Cerrar Proyecto',
        creating: 'Creando proyecto...',
        opening: 'Abriendo proyecto...',
        createFailed: 'Error al Crear Proyecto',
        openFailed: 'Error al Abrir Proyecto',
        deleteFailed: 'Error al Eliminar Proyecto',
        alreadyExists: 'El Proyecto Ya Existe',
        existsQuestion: 'Ya existe un proyecto ECS en este directorio. ¿Desea abrirlo?',
        invalidDirectory: 'El directorio del proyecto no existe o es inválido',
        serviceUnavailable: 'El servicio de proyecto no está disponible. Por favor reinicie el editor.',
        createdOpening: 'Proyecto creado, abriendo...',
        browser: {
            title: 'Explorador de Proyectos',
            recentProjects: 'Proyectos Recientes',
            newProject: 'Nuevo Proyecto',
            openExisting: 'Abrir Existente',
            noRecentProjects: 'Sin proyectos recientes',
            lastOpened: 'Última apertura',
            openInExplorer: 'Abrir en Explorador',
            removeFromList: 'Eliminar de la Lista'
        },
        wizard: {
            title: 'Explorador de Proyectos',
            projectName: 'Nombre del Proyecto',
            projectLocation: 'Ubicación del Proyecto',
            template: 'Plantilla',
            selectTemplate: 'Seleccionar una Plantilla',
            projectSettings: 'Configuración del Proyecto',
            browse: 'Examinar...',
            create: 'Crear',
            cancel: 'Cancelar',
            templates: {
                empty: 'Proyecto Vacío',
                demo2d: 'Demo 2D',
                demo3d: 'Demo 3D',
                blank: 'Vacío',
                blankDesc: 'Un proyecto vacío sin contenido inicial. Perfecto para comenzar desde cero.'
            }
        }
    },

    // ========================================
    // Plugin
    // ========================================
    plugin: {
        reloadedSuccess: 'Plugins recargados',
        reloadFailed: 'Error al recargar plugins',
        manager: 'Administrador de Plugins',
        enable: 'Habilitar',
        disable: 'Deshabilitar',
        settings: 'Configuración',
        version: 'Versión',
        author: 'Autor',
        dependencies: 'Dependencias'
    },

    // ========================================
    // Loading
    // ========================================
    loading: {
        step1: 'Paso 1/3: Abriendo configuración del proyecto...',
        step2: 'Paso 2/3: Inicializando motor y módulos...',
        step3: 'Paso 3/3: Inicializando escena...',
        loadingPlugins: 'Cargando plugins del proyecto...',
        engineTimeoutError: 'Tiempo de espera de inicialización del motor agotado'
    },

    // ========================================
    // Menu
    // ========================================
    menu: {
        file: {
            title: 'Archivo',
            newScene: 'Nueva Escena',
            openScene: 'Abrir Escena',
            saveScene: 'Guardar Escena',
            saveSceneAs: 'Guardar Escena Como...',
            openProject: 'Abrir Proyecto',
            closeProject: 'Cerrar Proyecto',
            exit: 'Salir',
            buildSettings: 'Configuración de Compilación'
        },
        edit: {
            title: 'Editar',
            undo: 'Deshacer',
            redo: 'Rehacer',
            cut: 'Cortar',
            copy: 'Copiar',
            paste: 'Pegar',
            delete: 'Eliminar',
            selectAll: 'Seleccionar Todo'
        },
        view: {
            title: 'Ver',
            resetLayout: 'Restablecer Diseño',
            fullscreen: 'Pantalla Completa',
            zoomIn: 'Acercar',
            zoomOut: 'Alejar'
        },
        window: {
            title: 'Ventana',
            sceneHierarchy: 'Jerarquía de Escena',
            inspector: 'Inspector',
            assets: 'Recursos',
            console: 'Consola',
            viewport: 'Vista',
            pluginManager: 'Administrador de Plugins',
            devtools: 'Herramientas de Desarrollo'
        },
        tools: {
            title: 'Herramientas',
            pluginManager: 'Administrador de Plugins',
            createPlugin: 'Crear Plugin',
            reloadPlugins: 'Recargar Plugins',
            portManager: 'Administrador de Puertos',
            settings: 'Configuración',
            devtools: 'Herramientas de Desarrollo',
            build: 'Configuración de Compilación'
        },
        help: {
            title: 'Ayuda',
            documentation: 'Documentación',
            checkForUpdates: 'Buscar Actualizaciones',
            about: 'Acerca de'
        }
    },

    // ========================================
    // Settings
    // ========================================
    settings: {
        title: 'Configuración',
        general: 'General',
        appearance: 'Apariencia',
        language: 'Idioma',
        theme: 'Tema',
        plugins: 'Plugins',
        editor: 'Editor',
        shortcuts: 'Atajos',
        scriptEditor: {
            systemDefault: 'Predeterminado del Sistema',
            custom: 'Personalizado'
        }
    },

    // ========================================
    // Dialog
    // ========================================
    dialog: {
        confirm: 'Confirmar',
        cancel: 'Cancelar',
        yes: 'Sí',
        no: 'No',
        ok: 'Aceptar',
        close: 'Cerrar',
        save: 'Guardar',
        dontSave: 'No Guardar',
        unsavedChanges: 'Cambios sin Guardar',
        unsavedChangesMessage: 'Tiene cambios sin guardar. ¿Desea guardar antes de cerrar?'
    },

    // ========================================
    // Asset Browser
    // ========================================
    assetBrowser: {
        title: 'Explorador de Recursos',
        import: 'Importar',
        refresh: 'Actualizar',
        newFolder: 'Nueva Carpeta',
        rename: 'Renombrar',
        delete: 'Eliminar',
        duplicate: 'Duplicar',
        showInExplorer: 'Mostrar en Explorador',
        noAssets: 'Sin recursos en esta carpeta',
        filter: {
            all: 'Todo',
            textures: 'Texturas',
            audio: 'Audio',
            scenes: 'Escenas',
            scripts: 'Scripts',
            prefabs: 'Prefabs'
        }
    },

    // ========================================
    // Content Browser
    // ========================================
    contentBrowser: {
        favorites: 'Favoritos',
        collections: 'Colecciones',
        add: 'Agregar',
        import: 'Importar',
        saveAll: 'Guardar Todo',
        search: 'Buscar',
        items: 'elementos',
        dockInLayout: 'Anclar en Diseño',
        noProject: 'Ningún proyecto cargado',
        empty: 'Esta carpeta está vacía',
        newFolder: 'Nueva Carpeta',
        newPrefix: 'Nuevo',
        managedDirectoryTooltip: 'Directorio administrado por GUID - Los recursos aquí obtienen IDs únicos para referencias',
        unmanagedWarning: 'Esta carpeta no es administrada por el sistema GUID. Los recursos creados aquí no pueden ser referenciados por GUID.',
        unmanagedWarningTitle: 'Directorio No Administrado',
        rename: 'Renombrar',
        delete: 'Eliminar',
        batchRename: 'Renombrar en Lote',
        duplicate: 'Duplicar',
        open: 'Abrir',
        save: 'Guardar',
        openInExplorer: 'Mostrar en Explorador',
        copyPath: 'Copiar Ruta',
        newSubfolder: 'Nueva Subcarpeta',
        deleteConfirmTitle: 'Confirmar Eliminación',
        deleteConfirmMessage: '¿Eliminar "{{name}}"?',
        cannotDeleteRoot: 'No se puede eliminar el directorio raíz',
        refresh: 'Actualizar',
        assetActions: 'Acciones de Recursos',
        reimport: 'Reimportar',
        export: 'Exportar...',
        migrateAsset: 'Migrar Recurso',
        assetLocalization: 'Localización de Recurso',
        createLocalizedAsset: 'Crear Recurso Localizado',
        importTranslation: 'Importar Traducción',
        exportTranslation: 'Exportar Traducción',
        manageTags: 'Administrar Etiquetas',
        copyReference: 'Copiar Referencia',
        copyObjectPath: 'Copiar Ruta de Objeto',
        copyPackagePath: 'Copiar Ruta de Paquete',
        referenceViewer: 'Visor de Referencias',
        sizeMap: 'Mapa de Tamaños',
        templateLabels: {
            material: 'Material',
            shader: 'Shader',
            tilemap: 'Mapa de Tiles',
            tileset: 'Conjunto de Tiles',
            component: 'Componente',
            system: 'Sistema',
            typescript: 'TypeScript',
            inspector: 'Inspector',
            gizmo: 'Gizmo'
        },
        dialogs: {
            renameTitle: 'Renombrar',
            cancel: 'Cancelar',
            ok: 'Aceptar',
            newFile: 'Nuevo {{type}}',
            enterFileName: 'Ingrese nombre de archivo (se agregará {{ext}}):',
            create: 'Crear'
        }
    },

    // ========================================
    // Build
    // ========================================
    build: {
        title: 'Configuración de Compilación',
        settingsTitle: 'Configuración de Compilación',
        platform: 'Plataforma',
        outputPath: 'Ruta de Salida',
        buildButton: 'Compilar',
        building: 'Compilando...',
        success: 'Compilación exitosa',
        failed: 'Compilación fallida',
        platforms: {
            web: 'Web',
            desktop: 'Escritorio',
            mobile: 'Móvil'
        }
    },

    // ========================================
    // Asset Picker
    // ========================================
    assetPicker: {
        title: 'Seleccionar Recurso',
        loading: 'Cargando...',
        empty: 'No se encontraron recursos',
        select: 'Seleccionar',
        cancel: 'Cancelar',
        search: 'Buscar...',
        back: 'Volver',
        listView: 'Vista de Lista',
        gridView: 'Vista de Cuadrícula',
        itemCount: '{{count}} elementos'
    },

    // ========================================
    // About Dialog
    // ========================================
    about: {
        title: 'Acerca de ESEngine Editor',
        version: 'Versión',
        description: 'Editor de juegos de alto rendimiento para desarrollo basado en ECS',
        checkUpdate: 'Buscar Actualizaciones',
        checking: 'Verificando...',
        updateAvailable: 'Nueva versión disponible',
        latest: 'Está usando la última versión',
        error: 'Error al buscar actualizaciones',
        download: 'Descargar e Instalar',
        installing: 'Instalando...',
        close: 'Cerrar',
        copyright: '© 2025 ESEngine. Todos los derechos reservados.',
        website: 'Sitio Web',
        github: 'GitHub'
    },

    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        play: 'Reproducir',
        playing: 'Ejecutando...',
        stop: 'Detener',
        pause: 'Pausar',
        resume: 'Reanudar',
        step: 'Avanzar Paso',
        save: 'Guardar Escena (Ctrl+S)',
        open: 'Abrir Escena',
        undo: 'Deshacer (Ctrl+Z)',
        redo: 'Rehacer (Ctrl+Y)',
        preview: 'Modo Vista Previa',
        runOptions: 'Opciones de Ejecución',
        runInBrowser: 'Ejecutar en Navegador',
        runOnDevice: 'Ejecutar en Dispositivo'
    },

    // ========================================
    // Title Bar
    // ========================================
    titleBar: {
        noProject: 'Sin Proyecto',
        unsaved: 'Cambios sin Guardar',
        minimize: 'Minimizar',
        maximize: 'Maximizar',
        restore: 'Restaurar',
        close: 'Cerrar'
    },

    // ========================================
    // Plugin Generator
    // ========================================
    pluginGenerator: {
        title: 'Crear Plugin',
        pluginName: 'Nombre del Plugin',
        pluginNamePlaceholder: 'ej: mi-plugin-de-juego',
        pluginVersion: 'Versión del Plugin',
        outputPath: 'Ruta de Salida',
        selectPath: 'Seleccionar Ruta',
        includeExample: 'Incluir Nodo de Ejemplo',
        generate: 'Generar Plugin',
        cancel: 'Cancelar',
        generating: 'Generando...',
        success: '¡Plugin creado exitosamente!',
        errorEmpty: 'Por favor ingrese el nombre del plugin',
        errorInvalidName: 'El nombre del plugin solo puede contener letras, números, guiones y guiones bajos',
        errorNoPath: 'Por favor seleccione la ruta de salida'
    },

    // ========================================
    // GitHub Auth
    // ========================================
    github: {
        title: 'Inicio de Sesión GitHub',
        githubLogin: 'Inicio de Sesión GitHub',
        oauthLogin: 'Inicio OAuth (Recomendado)',
        tokenLogin: 'Inicio con Token',
        oauthStep1: '1. Haga clic en "Iniciar Autorización"',
        oauthStep2: '2. Abra la página de autorización de GitHub en el navegador',
        oauthStep3: '3. Ingrese el código mostrado abajo y autorice',
        startAuth: 'Iniciar Autorización',
        authorizing: 'Esperando autorización...',
        authorized: '¡Autorizado!',
        authFailed: 'Error de autorización',
        userCode: 'Código de Autorización',
        copyCode: 'Copiar Código',
        openBrowser: 'Abrir Navegador',
        tokenLabel: 'Token de Acceso Personal de GitHub',
        tokenPlaceholder: 'Pegue su Token de GitHub',
        tokenHint: 'Requiere permisos de repo y workflow',
        createToken: 'Crear Token',
        login: 'Iniciar Sesión',
        back: 'Volver',
        enterToken: 'Por favor ingrese un token',
        authFailedToken: 'Error de autenticación. Por favor verifique su token.'
    },

    // ========================================
    // Startup Page
    // ========================================
    startup: {
        title: 'ESEngine Editor',
        subtitle: 'Herramienta Profesional de Desarrollo de Juegos',
        version: 'Versión',
        recentProjects: 'Proyectos Recientes',
        newProject: 'Nuevo Proyecto',
        openProject: 'Abrir Proyecto',
        createProject: 'Crear Proyecto',
        noRecentProjects: 'Sin proyectos recientes',
        lastOpened: 'Última apertura',
        community: 'Comunidad',
        discord: 'Discord',
        forum: 'Foro',
        documentation: 'Documentación',
        tutorials: 'Tutoriales',
        changelog: 'Registro de cambios',
        settings: 'Configuración',
        language: 'Idioma',
        updateAvailable: 'Nueva versión disponible',
        updateNow: 'Actualizar Ahora',
        installing: 'Instalando...',
        later: 'Más Tarde',
        removeFromList: 'Quitar de la Lista',
        deleteProject: 'Eliminar Proyecto',
        deleteConfirmTitle: 'Eliminar Proyecto',
        deleteConfirmMessage: '¿Está seguro de que desea eliminar permanentemente este proyecto? Esta acción no se puede deshacer.',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        envReady: 'Entorno Listo',
        envNotReady: 'Problema de Entorno',
        esbuildReady: 'esbuild listo',
        esbuildMissing: 'esbuild no encontrado'
    },

    // ========================================
    // Editor Toolbar (BT Editor)
    // ========================================
    editorToolbar: {
        play: 'Reproducir',
        pause: 'Pausar',
        resume: 'Reanudar',
        stop: 'Detener',
        stepForward: 'Avanzar Paso',
        reset: 'Restablecer',
        resetView: 'Restablecer Vista (rueda para zoom, Alt+arrastrar para mover)',
        clearCanvas: 'Limpiar Lienzo',
        clear: 'Limpiar',
        toggleGizmos: 'Mostrar/Ocultar Borde de Selección (Gizmos)',
        undo: 'Deshacer (Ctrl+Z)',
        redo: 'Rehacer (Ctrl+Shift+Z / Ctrl+Y)',
        idle: 'Inactivo',
        running: 'Ejecutando',
        paused: 'En Pausa',
        step: 'Paso'
    },

    // ========================================
    // File Tree
    // ========================================
    fileTree: {
        newFile: 'Nuevo Archivo',
        newFolder: 'Nueva Carpeta',
        openFile: 'Abrir Archivo',
        save: 'Guardar',
        rename: 'Renombrar',
        batchRename: 'Renombrar en Lote',
        duplicate: 'Duplicar',
        delete: 'Eliminar',
        assetActions: 'Acciones de Recursos',
        reimport: 'Reimportar',
        exportAsset: 'Exportar...',
        migrateAsset: 'Migrar Recurso',
        assetLocalization: 'Localización de Recurso',
        createLocalizedAsset: 'Crear Recurso Localizado',
        importTranslation: 'Importar Traducción',
        exportTranslation: 'Exportar Traducción',
        manageTags: 'Administrar Etiquetas',
        copyReference: 'Copiar Referencia',
        copyObjectPath: 'Copiar Ruta de Objeto',
        copyPackagePath: 'Copiar Ruta de Paquete',
        referenceViewer: 'Visor de Referencias',
        sizeMap: 'Mapa de Tamaños',
        showInExplorer: 'Mostrar en Explorador',
        loading: 'Cargando...',
        noFolders: 'Sin carpetas',
        renameFailed: 'Error al renombrar',
        deleteFailed: 'Error al eliminar',
        createFileFailed: 'Error al crear archivo',
        createFolderFailed: 'Error al crear carpeta',
        createTemplateFailed: 'Error al crear archivo de plantilla',
        confirmDelete: 'Confirmar Eliminación',
        confirmDeleteFolder: '¿Está seguro de que desea eliminar la carpeta "{{name}}" y todo su contenido?\nEsta acción no se puede deshacer.',
        confirmDeleteFile: '¿Está seguro de que desea eliminar el archivo "{{name}}"?\nEsta acción no se puede deshacer.',
        cancel: 'Cancelar',
        create: 'Crear',
        newFileTitle: 'Nuevo Archivo',
        newFolderTitle: 'Nueva Carpeta',
        enterFileName: 'Ingrese nombre de archivo:',
        enterFolderName: 'Ingrese nombre de carpeta:',
        enterTemplateFileName: 'Ingrese nombre de archivo (se agregará .{{ext}}):',
        fileNamePlaceholder: 'ej: config.json',
        folderNamePlaceholder: 'ej: assets',
        templateNamePlaceholder: 'ej: MiArchivo'
    },

    // ========================================
    // Compile Dialog
    // ========================================
    compileDialog: {
        compileFailed: 'Error de compilación',
        outputFiles: 'Archivos de salida',
        errors: 'Errores',
        close: 'Cerrar',
        compiling: 'Compilando...',
        compile: 'Compilar'
    },

    // ========================================
    // Build Settings Panel
    // ========================================
    buildSettings: {
        buildProfiles: 'Perfiles de Compilación',
        addBuildProfile: 'Agregar Perfil de Compilación',
        playerSettings: 'Configuración del Jugador',
        assetImportOverrides: 'Sobrescrituras de Importación de Recursos',
        platforms: 'Plataformas',
        sceneList: 'Lista de Escenas',
        active: 'Activo',
        switchProfile: 'Cambiar Perfil',
        build: 'Compilar',
        buildAndRun: 'Compilar y Ejecutar',
        buildData: 'Datos de Compilación',
        scriptingDefines: 'Definiciones de Script',
        listIsEmpty: 'La lista está vacía',
        addOpenScenes: 'Agregar Escenas Abiertas',
        platformSettings: 'Configuración de Plataforma',
        architecture: 'Arquitectura',
        developmentBuild: 'Compilación de Desarrollo',
        sourceMap: 'Source Map',
        compressionMethod: 'Método de Compresión',
        buildMode: 'Modo de Compilación',
        splitBundles: 'Paquetes Separados (Recomendado)',
        singleBundle: 'Paquete Único',
        splitBundlesHint: 'Runtime core + plugins cargados bajo demanda. Mejor para juegos de producción.',
        singleBundleHint: 'Todo el código en un archivo. Mejor para juegos pequeños o anuncios jugables.',
        playerSettingsOverrides: 'Sobrescrituras de Configuración del Jugador',
        companyName: 'Nombre de Empresa',
        productName: 'Nombre del Producto',
        version: 'Versión',
        defaultIcon: 'Icono Predeterminado',
        none: 'Ninguno',
        buildInProgress: 'Compilación en Progreso',
        preparing: 'Preparando...',
        compiling: 'Compilando...',
        packaging: 'Empaquetando recursos...',
        copying: 'Copiando archivos...',
        postProcessing: 'Post-procesando...',
        completed: 'Completado',
        failed: 'Fallido',
        cancelled: 'Cancelado',
        cancel: 'Cancelar',
        close: 'Cerrar',
        buildSucceeded: '¡Compilación exitosa!',
        buildFailed: 'Compilación fallida',
        warnings: 'Advertencias',
        outputPath: 'Ruta de Salida',
        duration: 'Duración',
        selectPlatform: 'Seleccione una plataforma o perfil de compilación',
        settings: 'Configuración'
    },

    // ========================================
    // Forum
    // ========================================
    forum: {
        // ForumPanel
        community: 'Comunidad',
        clickToViewProfile: 'Clic para ver perfil',
        loading: 'Cargando...',

        // ForumAuth
        communityTitle: 'Comunidad ESEngine',
        signInWithGitHub: 'Inicia sesión con GitHub para unirte a la discusión',
        step1: '1. Haz clic en el botón de abajo',
        step2: '2. Ingresa el código en GitHub',
        step3: '3. Autoriza la aplicación',
        continueWithGitHub: 'Continuar con GitHub',
        waitingForAuth: 'Esperando autorización...',
        enterCodeOnGitHub: 'Ingresa este código en GitHub:',
        copyCode: 'Copiar código',
        openGitHub: 'Abrir GitHub',
        authSuccess: '¡Autorización exitosa!',
        authFailed: 'Autorización fallida',
        tryAgain: 'Reintentar',

        // ForumPostList
        askQuestionsShareIdeas: 'Haz preguntas, comparte ideas y conecta con otros desarrolladores',
        newDiscussion: 'Nueva Discusión',
        viewOnGitHub: 'Ver en GitHub',
        allCategories: 'Todas las Categorías',
        searchDiscussions: 'Buscar discusiones...',
        refresh: 'Actualizar',
        new: 'Nuevo',
        discussions: 'discusiones',
        clearFilter: 'Limpiar filtro',
        justNow: 'Ahora mismo',
        minutesAgo: 'hace {{count}}m',
        hoursAgo: 'hace {{count}}h',
        yesterday: 'Ayer',
        daysAgo: 'hace {{count}}d',
        newBadge: 'Nuevo',
        hotBadge: 'Popular',
        openInGitHub: 'Abrir en GitHub',
        noDiscussionsYet: 'Aún no hay discusiones',
        startADiscussion: 'Iniciar una discusión',
        loadMore: 'Cargar Más',
        answered: 'Respondido',

        // ForumPostDetail
        backToList: 'Volver a la lista',
        reply: 'Responder',
        replyTo: 'Responder a @{{login}}...',
        cancel: 'Cancelar',
        comments: 'Comentarios',
        writeComment: 'Escribe un comentario... (Markdown soportado)',
        posting: 'Publicando...',
        postComment: 'Publicar Comentario',
        noCommentsYet: 'Aún no hay comentarios. ¡Sé el primero en comentar!',
        answer: 'Respuesta',

        // ForumCreatePost
        startDiscussion: 'Iniciar una Discusión',
        selectCategory: 'Seleccionar Categoría',
        title: 'Título',
        enterDescriptiveTitle: 'Ingresa un título descriptivo...',
        write: 'Escribir',
        preview: 'Vista Previa',
        bold: 'Negrita',
        italic: 'Cursiva',
        inlineCode: 'Código en línea',
        link: 'Enlace',
        list: 'Lista',
        quote: 'Cita',
        uploadImage: 'Subir imagen',
        markdownHelp: 'Ayuda de Markdown',
        uploading: 'Subiendo...',
        dropImageHere: 'Suelta la imagen aquí',
        editorPlaceholder: 'Escribe tu contenido aquí...\n\nPuedes usar Markdown:\n- **negrita** e *cursiva*\n- `código` y ```bloques de código```\n- [enlaces](url) e ![imágenes](url)\n- > citas y - listas\n\nArrastra y suelta o pega imágenes para subir',
        nothingToPreview: 'Nada que previsualizar',
        enterTitle: 'Por favor ingresa un título',
        enterContent: 'Por favor ingresa contenido',
        selectCategoryError: 'Por favor selecciona una categoría',
        failedToCreateDiscussion: 'Error al crear la discusión',
        anErrorOccurred: 'Ocurrió un error',
        creating: 'Creando...',
        createDiscussion: 'Crear Discusión',
        tips: 'Consejos',
        tip1: 'Usa un título claro y descriptivo',
        tip2: 'Selecciona la categoría correcta para tu tema',
        tip3: 'Proporciona suficiente contexto y detalles',
        tip4: 'Usa bloques de código para fragmentos de código',
        tip5: 'Sé respetuoso y constructivo',
        markdownGuide: 'Guía de Markdown',
        failedToUploadImage: 'Error al subir la imagen',

        // ForumProfile
        viewGitHubProfile: 'Ver Perfil de GitHub',
        signOut: 'Cerrar Sesión'
    },

    // ========================================
    // Export Runtime Dialog
    // ========================================
    exportRuntime: {
        title: 'Exportar Recursos de Tiempo de Ejecución',
        workspaceExport: 'Exportar Espacio de Trabajo',
        currentFile: 'Archivo Actual',
        assetOutputPath: 'Ruta de Salida de Recursos',
        selectAssetDir: 'Seleccionar Directorio de Salida de Recursos',
        selectAssetDirPlaceholder: 'Seleccionar directorio de salida de recursos (.btree.bin / .btree.json)...',
        browse: 'Explorar',
        typeOutputPath: 'Ruta de Salida de Definiciones de Tipo TypeScript',
        typeOutputHintWorkspace: 'Se exportarán las siguientes definiciones de tipo:\n• Tipos de variables de pizarra para cada árbol de comportamiento (.d.ts)\n• Tipos de variables de pizarra global (GlobalBlackboard.ts)',
        typeOutputHintSingle: 'Se exportarán los tipos de variables de pizarra del árbol de comportamiento actual (.d.ts)',
        selectTypeDir: 'Seleccionar Directorio de Salida de Definiciones de Tipo',
        selectTypeDirPlaceholder: 'Seleccionar directorio de salida de definiciones de tipo...',
        selectFilesToExport: 'Seleccionar archivos para exportar',
        selectAll: 'Seleccionar Todo',
        deselectAll: 'Deseleccionar Todo',
        binary: 'Binario',
        json: 'JSON',
        noOpenFile: 'No hay archivo de árbol de comportamiento abierto',
        openFileHint: 'Por favor abre un archivo de árbol de comportamiento en el editor primero',
        close: 'Cerrar',
        export: 'Exportar',
        exporting: 'Exportando...',
        errorSelectAssetPath: 'Error: Por favor selecciona la ruta de salida de recursos',
        errorSelectTypePath: 'Error: Por favor selecciona la ruta de salida de definiciones de tipo',
        errorSelectFile: 'Error: Por favor selecciona al menos un archivo',
        errorNoCurrentFile: 'Error: No hay archivo actual para exportar',
        exportSuccess: '¡Exportación exitosa!',
        exportFailed: 'Exportación fallida: {{error}}'
    },

    // ========================================
    // Project Settings Plugin
    // ========================================
    projectSettings: {
        categoryTitle: 'Proyecto',
        categoryDescription: 'Configuración a nivel de proyecto',
        uiSettingsTitle: 'Configuración de UI',
        uiSettingsDescription: 'Configurar parámetros base del sistema UI',
        designWidth: 'Ancho de Diseño',
        designWidthDescription: 'Ancho de diseño del canvas UI (píxeles)',
        designHeight: 'Alto de Diseño',
        designHeightDescription: 'Alto de diseño del canvas UI (píxeles)',
        resolutionPreset: 'Preajuste de Resolución',
        resolutionPresetDescription: 'Seleccionar un preajuste de resolución común',
        modulesTitle: 'Módulos del Motor',
        modulesDescription: 'Gestionar módulos del motor usados por el proyecto. Cada módulo contiene componentes de tiempo de ejecución y herramientas del editor. Deshabilitar módulos innecesarios reduce el tamaño de compilación.',
        moduleList: 'Lista de Módulos',
        moduleListDescription: 'Desmarcar módulos que no necesitas. Los módulos principales no se pueden deshabilitar. Los nuevos módulos se habilitan por defecto.'
    },

    // ========================================
    // Compiler Config Dialog
    // ========================================
    compilerConfig: {
        title: 'Configuración del Compilador',
        noConfigUI: 'Este compilador no tiene interfaz de configuración',
        compilerNotFound: 'Compilador no encontrado',
        generatedFiles: 'Generados {{count}} archivos',
        cancel: 'Cancelar',
        compiling: 'Compilando...',
        compile: 'Compilar',
        compileFailed: 'Compilación fallida: {{error}}'
    },

    // ========================================
    // Settings Window
    // ========================================
    settingsWindow: {
        editorPreferences: 'Preferencias del Editor',
        allSettings: 'Todas las Configuraciones',
        search: 'Buscar',
        settingsBtn: 'Configuración',
        export: 'Exportar...',
        import: 'Importar...',
        resetToDefault: 'Restablecer a Predeterminado',
        selectCategory: 'Por favor seleccione una categoría de configuración',
        invalidValue: 'Valor inválido',
        pluginManagerUnavailable: 'PluginManager no disponible',
        collisionMatrixNotConfigured: 'Editor de matriz de colisión no configurado',
        // Main categories | 主分类
        mainCategories: {
            general: 'General',
            global: 'Global',
            worldPartition: 'Partición de Mundo',
            worldPartitionLocal: 'Partición de Mundo (Local)',
            performance: 'Rendimiento',
            other: 'Otro'
        }
    },

    // ========================================
    // Quick Create Menu (BT Editor)
    // ========================================
    quickCreateMenu: {
        searchPlaceholder: 'Buscar nodos...',
        noMatchingNodes: 'No se encontraron nodos coincidentes',
        uncategorized: 'Sin categoría'
    },

    // ========================================
    // Plugin Settings (registered via SettingsRegistry)
    // 插件设置（通过 SettingsRegistry 注册）
    // ========================================
    pluginSettings: {
        // EditorAppearancePlugin
        appearance: {
            title: 'Apariencia',
            description: 'Configurar ajustes de apariencia del editor',
            font: {
                title: 'Configuración de Fuente',
                description: 'Configurar estilo de fuente del editor',
                fontSize: {
                    label: 'Tamaño de Fuente (px)',
                    description: 'Tamaño de fuente de la interfaz del editor'
                }
            },
            inspector: {
                title: 'Configuración del Inspector',
                description: 'Configurar visualización del inspector de propiedades',
                decimalPlaces: {
                    label: 'Decimales',
                    description: 'Número de decimales para propiedades numéricas, -1 para ilimitado'
                }
            },
            scriptEditor: {
                title: 'Editor de Scripts',
                description: 'Configurar editor externo para abrir archivos de script',
                editor: {
                    label: 'Editor de Scripts',
                    description: 'Editor a usar al hacer doble clic en archivos de script'
                },
                customCommand: {
                    label: 'Comando de Editor Personalizado',
                    description: 'Cuando se selecciona "Personalizado", ingresa el comando del editor (ej. notepad++)',
                    placeholder: 'ej.: notepad++'
                }
            }
        },
        // ProfilerPlugin
        profiler: {
            title: 'Perfilador',
            description: 'Configurar comportamiento y opciones de visualización del perfilador',
            connection: {
                title: 'Configuración de Conexión',
                description: 'Configurar parámetros de conexión del servidor WebSocket',
                port: {
                    label: 'Puerto de Escucha',
                    description: 'Número de puerto del servidor WebSocket del perfilador',
                    placeholder: '8080',
                    errorMessage: 'El puerto debe estar entre 1024 y 65535'
                },
                autoStart: {
                    label: 'Iniciar Servidor Automáticamente',
                    description: 'Iniciar servidor del perfilador cuando se abra el editor'
                }
            },
            display: {
                title: 'Configuración de Visualización',
                description: 'Configurar opciones de visualización de datos de rendimiento',
                refreshInterval: {
                    label: 'Intervalo de Refresco (ms)',
                    description: 'Intervalo de tiempo para refresco de datos de rendimiento'
                },
                maxDataPoints: {
                    label: 'Máximo de Puntos de Datos',
                    description: 'Número máximo de puntos de datos históricos en gráficos'
                }
            }
        },
        // PluginConfigPlugin
        plugins: {
            title: 'Plugins',
            description: 'Administrar plugins del proyecto',
            management: {
                title: 'Gestión de Plugins',
                description: 'Habilitar/deshabilitar plugins para tu proyecto. Deshabilitar plugins no usados reduce el tamaño del bundle.',
                list: {
                    label: 'Lista de Plugins',
                    description: 'Administrar plugins instalados'
                }
            }
        },
        // ProjectSettingsPlugin
        project: {
            title: 'Proyecto',
            description: 'Configuración a nivel de proyecto',
            uiSettings: {
                title: 'Configuración de UI',
                description: 'Configurar parámetros base del sistema UI',
                designWidth: {
                    label: 'Ancho de Diseño',
                    description: 'Ancho de diseño del canvas UI (píxeles)'
                },
                designHeight: {
                    label: 'Alto de Diseño',
                    description: 'Alto de diseño del canvas UI (píxeles)'
                },
                resolutionPreset: {
                    label: 'Preajuste de Resolución',
                    description: 'Seleccionar un preajuste de resolución común'
                }
            },
            modules: {
                title: 'Módulos del Motor',
                description: 'Administrar módulos del motor usados por el proyecto. Cada módulo contiene componentes de tiempo de ejecución y herramientas del editor. Deshabilitar módulos no usados reduce el tamaño de compilación.',
                list: {
                    label: 'Lista de Módulos',
                    description: 'Desmarcar módulos que no necesitas. Los módulos principales no se pueden deshabilitar. Los nuevos módulos se habilitan por defecto.'
                }
            }
        }
    }
};
