/**
 * Spanish translations for Behavior Tree Editor
 * Traducciones en español del Editor de Árbol de Comportamiento
 */
export const es = {
    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        openFile: 'Abrir Archivo (Ctrl+O)',
        save: 'Guardar (Ctrl+S)',
        saveUnsaved: 'Guardar (Ctrl+S) - Cambios sin guardar',
        export: 'Exportar Configuración de Ejecución',
        copyToClipboard: 'Copiar JSON al Portapapeles',
        run: 'Ejecutar (Play)',
        resume: 'Continuar',
        pause: 'Pausar',
        stop: 'Detener',
        step: 'Paso a Paso',
        resetView: 'Restablecer Vista (scroll para zoom, Alt+arrastrar para desplazar)',
        undo: 'Deshacer (Ctrl+Z)',
        redo: 'Rehacer (Ctrl+Shift+Z / Ctrl+Y)',
        goToRoot: 'Ir al Nodo Raíz'
    },

    // ========================================
    // Execution Status
    // ========================================
    execution: {
        idle: 'Inactivo',
        running: 'Ejecutando',
        paused: 'Pausado'
    },

    // ========================================
    // Node
    // ========================================
    node: {
        executionOrder: 'Orden de Ejecución: {{order}}',
        initialValue: 'Valor Inicial',
        currentValue: 'Valor Actual'
    },

    // ========================================
    // Context Menu
    // ========================================
    contextMenu: {
        delete: 'Eliminar',
        duplicate: 'Duplicar',
        copy: 'Copiar',
        paste: 'Pegar'
    },

    // ========================================
    // Quick Create Menu
    // ========================================
    quickCreate: {
        searchPlaceholder: 'Buscar nodos...',
        uncategorized: 'Sin categoría',
        noMatchingNodes: 'No se encontraron nodos coincidentes'
    },

    // ========================================
    // Blackboard Panel
    // ========================================
    blackboard: {
        title: 'Pizarra',
        variableName: 'nombre.variable',
        copy: 'Copiar',
        edit: 'Editar',
        delete: 'Eliminar',
        addVariable: 'Agregar Variable'
    },

    // ========================================
    // Compiler
    // ========================================
    compiler: {
        name: 'Compilador de Árbol de Comportamiento',
        description: 'Compilar recursos de árbol de comportamiento',
        selectAssetOutput: 'Seleccionar directorio de salida de recursos...',
        selectTypeOutput: 'Seleccionar directorio de salida de definiciones de tipo...',
        compile: 'Compilar',
        compiling: 'Compilando...',
        success: 'Compilación exitosa',
        failed: 'Compilación fallida'
    },

    // ========================================
    // Notifications
    // ========================================
    notifications: {
        fileSaved: 'Archivo guardado: {{path}}',
        fileSaveFailed: 'Error al guardar archivo',
        fileOpened: 'Archivo abierto: {{path}}',
        fileOpenFailed: 'Error al abrir archivo',
        copiedToClipboard: 'Copiado al portapapeles',
        exportSuccess: 'Exportación exitosa',
        exportFailed: 'Exportación fallida',
        validationError: 'Error de validación: {{message}}'
    },

    // ========================================
    // Dialogs
    // ========================================
    dialogs: {
        createBehaviorTree: 'Crear Recurso de Árbol de Comportamiento',
        confirmDelete: '¿Está seguro de que desea eliminar este nodo?',
        unsavedChanges: 'Tiene cambios sin guardar. ¿Desea guardar antes de cerrar?'
    },

    // ========================================
    // Panel
    // ========================================
    panel: {
        title: 'Editor de Árbol de Comportamiento',
        noFileOpen: 'No hay archivo de árbol de comportamiento abierto',
        dropToOpen: 'Arrastre un archivo .btree aquí o use el botón Abrir'
    },

    // ========================================
    // Validation Errors
    // Errores de validación
    // ========================================
    validation: {
        rootNodeMaxChildren: 'El nodo raíz solo puede conectar a un nodo hijo',
        decoratorNodeMaxChildren: 'El nodo decorador solo puede conectar a un nodo hijo',
        leafNodeNoChildren: 'El nodo hoja no puede tener hijos',
        circularReference: 'Referencia circular detectada, el nodo {{nodeId}} no puede conectarse a sí mismo o a sus descendientes',
        invalidConnection: 'Conexión inválida: {{reason}}',
        nodeIdRequired: 'El ID del nodo no puede estar vacío',
        nodeTemplateRequired: 'La plantilla del nodo no puede estar vacía',
        sourceNodeNotFound: 'Nodo fuente de conexión no encontrado: {{nodeId}}',
        targetNodeNotFound: 'Nodo destino de conexión no encontrado: {{nodeId}}',
        selfConnection: 'El nodo no puede conectarse a sí mismo',
        cycleDetected: 'Referencia circular detectada en el árbol de comportamiento'
    }
};
