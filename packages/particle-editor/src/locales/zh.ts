/**
 * Chinese translations for Particle Editor
 * 粒子编辑器中文翻译
 */
export const zh = {
    // ========================================
    // Panel
    // ========================================
    panel: {
        title: '粒子编辑器',
        noFileOpen: '没有打开的粒子文件',
        dropToOpen: '拖放 .particle 文件到这里或使用打开按钮'
    },

    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        play: '播放',
        pause: '暂停',
        restart: '重新开始',
        save: '保存',
        open: '打开',
        maximize: '最大化预览',
        minimize: '最小化预览',
        followMouse: '跟随鼠标',
        resetPosition: '重置位置'
    },

    // ========================================
    // Sections
    // ========================================
    sections: {
        basic: '基础',
        emission: '发射',
        particle: '粒子',
        color: '颜色',
        modules: '模块',
        presets: '预设'
    },

    // ========================================
    // Basic Properties
    // ========================================
    basic: {
        name: '名称',
        texture: '纹理',
        maxParticles: '最大粒子数',
        looping: '循环',
        duration: '持续时间',
        prewarm: '预热',
        playSpeed: '播放速度',
        blendMode: '混合模式',
        space: '空间',
        particleSize: '粒子大小',
        sortOrder: '排序顺序'
    },

    // ========================================
    // Blend Modes
    // ========================================
    blendMode: {
        normal: '普通',
        additive: '叠加',
        multiply: '乘法'
    },

    // ========================================
    // Simulation Space
    // ========================================
    space: {
        world: '世界',
        local: '本地'
    },

    // ========================================
    // Emission Properties
    // ========================================
    emission: {
        rate: '发射率',
        shape: '形状',
        radius: '半径',
        width: '宽度',
        height: '高度',
        coneAngle: '锥形角度'
    },

    // ========================================
    // Emission Shapes
    // ========================================
    shapes: {
        point: '点',
        circle: '圆形',
        ring: '环形',
        rectangle: '矩形',
        edge: '边缘',
        line: '线',
        cone: '锥形'
    },

    // ========================================
    // Particle Properties
    // ========================================
    particle: {
        lifetime: '生命周期',
        speed: '速度',
        direction: '方向',
        spread: '散布',
        scale: '缩放',
        gravity: '重力'
    },

    // ========================================
    // Color Properties
    // ========================================
    color: {
        startColor: '起始颜色',
        startAlpha: '起始透明度',
        endAlpha: '结束透明度',
        endScale: '结束缩放'
    },

    // ========================================
    // Module Names
    // ========================================
    modules: {
        colorOverLifetime: '颜色随生命周期',
        sizeOverLifetime: '大小随生命周期',
        velocityOverLifetime: '速度随生命周期',
        rotationOverLifetime: '旋转随生命周期',
        noise: '噪声',
        collision: '碰撞',
        forceField: '力场'
    },

    // ========================================
    // Velocity Over Lifetime
    // ========================================
    velocity: {
        drag: '阻力',
        orbital: '轨道',
        radial: '径向'
    },

    // ========================================
    // Rotation Over Lifetime
    // ========================================
    rotation: {
        startMult: '起始倍数',
        endMult: '结束倍数',
        additional: '附加'
    },

    // ========================================
    // Noise Module
    // ========================================
    noise: {
        position: '位置',
        velocity: '速度',
        rotation: '旋转',
        frequency: '频率',
        scroll: '滚动'
    },

    // ========================================
    // Collision Module
    // ========================================
    collision: {
        boundary: '边界',
        behavior: '行为',
        left: '左',
        right: '右',
        top: '上',
        bottom: '下',
        radius: '半径',
        bounce: '弹跳',
        lifeLoss: '生命损失'
    },

    // ========================================
    // Boundary Types
    // ========================================
    boundaryType: {
        none: '无',
        rectangle: '矩形',
        circle: '圆形'
    },

    // ========================================
    // Collision Behaviors
    // ========================================
    collisionBehavior: {
        kill: '消灭',
        bounce: '弹跳',
        wrap: '环绕'
    },

    // ========================================
    // Force Field Module
    // ========================================
    forceField: {
        type: '类型',
        strength: '强度',
        directionX: '方向 X',
        directionY: '方向 Y',
        centerX: '中心 X',
        centerY: '中心 Y',
        range: '范围',
        falloff: '衰减'
    },

    // ========================================
    // Force Field Types
    // ========================================
    forceFieldType: {
        wind: '风',
        point: '点',
        vortex: '漩涡',
        turbulence: '湍流'
    },

    // ========================================
    // Curve Editor
    // ========================================
    curve: {
        deletePoint: '删除点',
        constant: '常量',
        fadeIn: '淡入',
        fadeOut: '淡出',
        bellCurve: '钟形曲线',
        uCurve: 'U 形曲线'
    },

    // ========================================
    // Gradient Editor
    // ========================================
    gradient: {
        deleteStop: '删除色标'
    },

    // ========================================
    // Texture Picker
    // ========================================
    texturePicker: {
        browse: '浏览...',
        clear: '清除'
    },

    // ========================================
    // Notifications
    // ========================================
    notifications: {
        fileSaved: '文件已保存: {{path}}',
        fileSaveFailed: '保存文件失败',
        fileOpened: '文件已打开: {{path}}',
        fileOpenFailed: '打开文件失败'
    },

    // ========================================
    // Dialogs
    // ========================================
    dialogs: {
        selectTexture: '选择纹理图片',
        selectParticleFile: '选择粒子文件',
        saveParticleFile: '保存粒子文件'
    }
};
