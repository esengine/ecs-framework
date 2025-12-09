/**
 * Spanish translations for Tilemap Editor
 * Traducciones en español del editor de mapas de tiles
 */
export const es = {
    // ========================================
    // Panel
    // ========================================
    panel: {
        title: 'Editor de Tilemap',
        noTilemapSelected: 'Ningún tilemap seleccionado',
        details: 'Detalles',
        search: 'Buscar'
    },

    // ========================================
    // Tools
    // ========================================
    tools: {
        tileMode: 'Modo de edición de tiles',
        collisionMode: 'Modo de edición de colisión',
        tile: 'Tile',
        collision: 'Colisión',
        draw: 'Dibujar',
        drawTile: 'Dibujar tiles',
        drawCollision: 'Dibujar colisión',
        eraser: 'Borrador',
        eraseTile: 'Borrar tiles',
        eraseCollision: 'Borrar colisión',
        fill: 'Rellenar',
        fillTile: 'Rellenar tiles',
        fillCollision: 'Rellenar colisión',
        rectangle: 'Rectángulo',
        rectangleTile: 'Dibujo rectangular',
        rectangleCollision: 'Colisión rectangular',
        select: 'Seleccionar',
        selectRegion: 'Seleccionar región'
    },

    // ========================================
    // Tileset
    // ========================================
    tileset: {
        activeTileset: 'Tileset activo',
        showGrid: 'Mostrar cuadrícula',
        search: 'Buscar',
        none: '(Ninguno)',
        addTileset: '+ Agregar Tileset...',
        zoom: 'Zoom {{zoom}}:1',
        selector: 'Selector de Tileset',
        selectTileset: 'Seleccionar Tileset',
        selected: 'Seleccionado: {{width}}×{{height}}'
    },

    // ========================================
    // Collision Mode
    // ========================================
    collisionMode: {
        title: 'Modo de edición de colisión',
        drawHint: 'Use el pincel para dibujar áreas de colisión',
        eraseHint: 'Use el borrador para eliminar colisión'
    },

    // ========================================
    // Layers
    // ========================================
    layers: {
        title: 'Capas',
        addLayer: 'Agregar capa',
        layerCount: 'Capas ({{count}})',
        layer: 'Capa',
        layerNumber: 'Capa {{number}}',
        editingCollision: 'Editando colisión actualmente',
        drawingLayer: 'Dibujando en capa actualmente',
        moveUp: 'Mover capa arriba',
        moveDown: 'Mover capa abajo',
        delete: 'Eliminar capa',
        duplicate: 'Duplicar capa',
        hide: 'Ocultar capa',
        show: 'Mostrar capa'
    },

    // ========================================
    // Layer Properties
    // ========================================
    layerProperties: {
        title: 'Capa seleccionada',
        name: 'Nombre',
        editName: 'Doble clic para editar nombre',
        hideInEditor: 'Ocultar en editor',
        hideInGame: 'Ocultar en juego',
        opacity: 'Opacidad de capa',
        collision: 'Colisión de capa',
        overrideThickness: 'Anular grosor de colisión',
        overrideOffset: 'Anular desplazamiento de colisión',
        thicknessOverride: 'Anulación de grosor de colisión',
        offsetOverride: 'Anulación de desplazamiento de colisión',
        color: 'Color de capa',
        material: 'Material {{name}}'
    },

    // ========================================
    // Configuration
    // ========================================
    config: {
        title: 'Configuración',
        mapWidth: 'Ancho del mapa',
        mapHeight: 'Alto del mapa',
        tileWidth: 'Ancho de tile',
        tileHeight: 'Alto de tile',
        pixelsPerUnit: 'Píxeles por unidad',
        separateByLayer: 'Separar por capa'
    },

    // ========================================
    // Layer Materials
    // ========================================
    materials: {
        title: 'Materiales de capa',
        default: 'Material predeterminado',
        selectMaterial: 'Clic para seleccionar material',
        copyPath: 'Copiar ruta',
        clear: 'Limpiar'
    },

    // ========================================
    // Advanced
    // ========================================
    advanced: {
        title: 'Avanzado',
        projection: 'Modo de proyección',
        orthographic: 'Ortográfico',
        isometric: 'Isométrico',
        hexagonal: 'Hexagonal',
        hexSideLength: 'Longitud del lado hexagonal',
        backgroundColor: 'Color de fondo',
        tileGridColor: 'Color de cuadrícula de tiles',
        multiTileGridColor: 'Color de cuadrícula multi-tile',
        multiTileGridWidth: 'Ancho de cuadrícula multi-tile'
    },

    // ========================================
    // Collision Settings
    // ========================================
    collisionSettings: {
        title: 'Colisión',
        showCollision: 'Mostrar colisión'
    },

    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        toggleGrid: 'Alternar cuadrícula',
        showCollision: 'Mostrar colisión',
        save: 'Guardar (Ctrl+S)',
        saveButton: 'Guardar',
        zoomOut: 'Alejar',
        zoomIn: 'Acercar',
        resetView: 'Restablecer vista',
        cells: ' celdas'
    },

    // ========================================
    // Dialogs
    // ========================================
    dialogs: {
        selectTilesetImage: 'Seleccionar imagen de tileset',
        selectLayerMaterial: 'Seleccionar material de capa',
        searchAssets: 'Buscar assets...'
    },

    // ========================================
    // Animation Editor
    // ========================================
    animation: {
        frames: 'Fotogramas de animación',
        deleteFrame: 'Eliminar fotograma',
        addFrameHint: 'Clic en un tile para agregar fotograma'
    }
};
