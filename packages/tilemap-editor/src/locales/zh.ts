/**
 * Chinese translations for Tilemap Editor
 * 瓦片地图编辑器中文翻译
 */
export const zh = {
    // ========================================
    // Panel
    // ========================================
    panel: {
        title: '瓦片地图编辑器',
        noTilemapSelected: '未选择瓦片地图',
        details: '细节',
        search: '搜索'
    },

    // ========================================
    // Tools
    // ========================================
    tools: {
        tileMode: '瓦片编辑模式',
        collisionMode: '碰撞编辑模式',
        tile: '瓦片',
        collision: '碰撞',
        draw: '绘制',
        drawTile: '绘制瓦片',
        drawCollision: '绘制碰撞',
        eraser: '橡皮擦',
        eraseTile: '擦除瓦片',
        eraseCollision: '擦除碰撞',
        fill: '填充',
        fillTile: '填充瓦片',
        fillCollision: '填充碰撞',
        rectangle: '矩形',
        rectangleTile: '矩形绘制',
        rectangleCollision: '矩形碰撞',
        select: '选择',
        selectRegion: '选择区域'
    },

    // ========================================
    // Tileset
    // ========================================
    tileset: {
        activeTileset: '活跃瓦片集',
        showGrid: '显示网格',
        search: '搜索',
        none: '(无)',
        addTileset: '+ 添加瓦片集...',
        zoom: '缩放 {{zoom}}:1',
        selector: '瓦片集选择器',
        selectTileset: '选择瓦片集',
        selected: '已选择: {{width}}×{{height}}'
    },

    // ========================================
    // Collision Mode
    // ========================================
    collisionMode: {
        title: '碰撞编辑模式',
        drawHint: '使用画笔绘制碰撞区域',
        eraseHint: '使用橡皮擦清除碰撞'
    },

    // ========================================
    // Layers
    // ========================================
    layers: {
        title: '图层',
        addLayer: '添加图层',
        layerCount: '图层 ({{count}})',
        layer: '图层',
        layerNumber: '图层 {{number}}',
        editingCollision: '当前编辑碰撞',
        drawingLayer: '当前绘制图层',
        moveUp: '上移图层',
        moveDown: '下移图层',
        delete: '删除图层',
        duplicate: '复制图层',
        hide: '隐藏图层',
        show: '显示图层'
    },

    // ========================================
    // Layer Properties
    // ========================================
    layerProperties: {
        title: '选定层',
        name: '名称',
        editName: '双击编辑名称',
        hideInEditor: '编辑器中隐藏',
        hideInGame: '游戏中隐藏',
        opacity: '图层透明度',
        collision: '图层碰撞',
        overrideThickness: '重载碰撞厚度',
        overrideOffset: '重载碰撞偏移',
        thicknessOverride: '碰撞厚度重载',
        offsetOverride: '碰撞偏移重载',
        color: '图层颜色',
        material: '{{name}} 材质'
    },

    // ========================================
    // Configuration
    // ========================================
    config: {
        title: '配置',
        mapWidth: '地图宽度',
        mapHeight: '地图高度',
        tileWidth: '瓦片宽度',
        tileHeight: '瓦片高度',
        pixelsPerUnit: '逻辑单位像素',
        separateByLayer: '逐图层分隔'
    },

    // ========================================
    // Layer Materials
    // ========================================
    materials: {
        title: '图层材质',
        default: '默认材质',
        selectMaterial: '点击选择材质',
        copyPath: '复制路径',
        clear: '清除'
    },

    // ========================================
    // Advanced
    // ========================================
    advanced: {
        title: '高级',
        projection: '投射模式',
        orthographic: '正交',
        isometric: '等轴测',
        hexagonal: '六方',
        hexSideLength: '六方格边长度',
        backgroundColor: '背景颜色',
        tileGridColor: '瓦片网格颜色',
        multiTileGridColor: '多瓦片网格颜色',
        multiTileGridWidth: '多瓦片网格宽度'
    },

    // ========================================
    // Collision Settings
    // ========================================
    collisionSettings: {
        title: '碰撞',
        showCollision: '显示碰撞'
    },

    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        toggleGrid: '切换网格',
        showCollision: '显示碰撞',
        save: '保存 (Ctrl+S)',
        saveButton: '保存',
        zoomOut: '缩小',
        zoomIn: '放大',
        resetView: '重置视图',
        cells: ' 格'
    },

    // ========================================
    // Dialogs
    // ========================================
    dialogs: {
        selectTilesetImage: '选择瓦片集图片',
        selectLayerMaterial: '选择图层材质',
        searchAssets: '搜索资产...'
    },

    // ========================================
    // Animation Editor
    // ========================================
    animation: {
        frames: '动画帧',
        deleteFrame: '删除帧',
        addFrameHint: '点击瓦片添加帧'
    }
};
