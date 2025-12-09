/**
 * English translations for Particle Editor
 * 粒子编辑器英文翻译
 */
export const en = {
    // ========================================
    // Panel
    // ========================================
    panel: {
        title: 'Particle Editor',
        noFileOpen: 'No particle file is open',
        dropToOpen: 'Drop a .particle file here or use Open button'
    },

    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        play: 'Play',
        pause: 'Pause',
        restart: 'Restart',
        save: 'Save',
        open: 'Open',
        maximize: 'Maximize preview',
        minimize: 'Minimize preview',
        followMouse: 'Follow mouse',
        resetPosition: 'Reset position'
    },

    // ========================================
    // Sections
    // ========================================
    sections: {
        basic: 'Basic',
        emission: 'Emission',
        particle: 'Particle',
        color: 'Color',
        modules: 'Modules',
        presets: 'Presets'
    },

    // ========================================
    // Basic Properties
    // ========================================
    basic: {
        name: 'Name',
        texture: 'Texture',
        maxParticles: 'Max Particles',
        looping: 'Looping',
        duration: 'Duration',
        prewarm: 'Prewarm',
        playSpeed: 'Play Speed',
        blendMode: 'Blend Mode',
        space: 'Space',
        particleSize: 'Particle Size',
        sortOrder: 'Sort Order'
    },

    // ========================================
    // Blend Modes
    // ========================================
    blendMode: {
        normal: 'Normal',
        additive: 'Additive',
        multiply: 'Multiply'
    },

    // ========================================
    // Simulation Space
    // ========================================
    space: {
        world: 'World',
        local: 'Local'
    },

    // ========================================
    // Emission Properties
    // ========================================
    emission: {
        rate: 'Rate',
        shape: 'Shape',
        radius: 'Radius',
        width: 'Width',
        height: 'Height',
        coneAngle: 'Cone Angle'
    },

    // ========================================
    // Emission Shapes
    // ========================================
    shapes: {
        point: 'Point',
        circle: 'Circle',
        ring: 'Ring',
        rectangle: 'Rectangle',
        edge: 'Edge',
        line: 'Line',
        cone: 'Cone'
    },

    // ========================================
    // Particle Properties
    // ========================================
    particle: {
        lifetime: 'Lifetime',
        speed: 'Speed',
        direction: 'Direction',
        spread: 'Spread',
        scale: 'Scale',
        gravity: 'Gravity'
    },

    // ========================================
    // Color Properties
    // ========================================
    color: {
        startColor: 'Start Color',
        startAlpha: 'Start Alpha',
        endAlpha: 'End Alpha',
        endScale: 'End Scale'
    },

    // ========================================
    // Module Names
    // ========================================
    modules: {
        colorOverLifetime: 'Color Over Lifetime',
        sizeOverLifetime: 'Size Over Lifetime',
        velocityOverLifetime: 'Velocity Over Lifetime',
        rotationOverLifetime: 'Rotation Over Lifetime',
        noise: 'Noise',
        collision: 'Collision',
        forceField: 'Force Field'
    },

    // ========================================
    // Velocity Over Lifetime
    // ========================================
    velocity: {
        drag: 'Drag',
        orbital: 'Orbital',
        radial: 'Radial'
    },

    // ========================================
    // Rotation Over Lifetime
    // ========================================
    rotation: {
        startMult: 'Start Mult',
        endMult: 'End Mult',
        additional: 'Additional'
    },

    // ========================================
    // Noise Module
    // ========================================
    noise: {
        position: 'Position',
        velocity: 'Velocity',
        rotation: 'Rotation',
        frequency: 'Frequency',
        scroll: 'Scroll'
    },

    // ========================================
    // Collision Module
    // ========================================
    collision: {
        boundary: 'Boundary',
        behavior: 'Behavior',
        left: 'Left',
        right: 'Right',
        top: 'Top',
        bottom: 'Bottom',
        radius: 'Radius',
        bounce: 'Bounce',
        lifeLoss: 'Life Loss'
    },

    // ========================================
    // Boundary Types
    // ========================================
    boundaryType: {
        none: 'None',
        rectangle: 'Rectangle',
        circle: 'Circle'
    },

    // ========================================
    // Collision Behaviors
    // ========================================
    collisionBehavior: {
        kill: 'Kill',
        bounce: 'Bounce',
        wrap: 'Wrap'
    },

    // ========================================
    // Force Field Module
    // ========================================
    forceField: {
        type: 'Type',
        strength: 'Strength',
        directionX: 'Direction X',
        directionY: 'Direction Y',
        centerX: 'Center X',
        centerY: 'Center Y',
        range: 'Range',
        falloff: 'Falloff'
    },

    // ========================================
    // Force Field Types
    // ========================================
    forceFieldType: {
        wind: 'Wind',
        point: 'Point',
        vortex: 'Vortex',
        turbulence: 'Turbulence'
    },

    // ========================================
    // Curve Editor
    // ========================================
    curve: {
        deletePoint: 'Delete point',
        constant: 'Constant value',
        fadeIn: 'Fade in',
        fadeOut: 'Fade out',
        bellCurve: 'Bell curve',
        uCurve: 'U curve'
    },

    // ========================================
    // Gradient Editor
    // ========================================
    gradient: {
        deleteStop: 'Delete stop'
    },

    // ========================================
    // Texture Picker
    // ========================================
    texturePicker: {
        browse: 'Browse...',
        clear: 'Clear'
    },

    // ========================================
    // Notifications
    // ========================================
    notifications: {
        fileSaved: 'File saved: {{path}}',
        fileSaveFailed: 'Failed to save file',
        fileOpened: 'File opened: {{path}}',
        fileOpenFailed: 'Failed to open file'
    },

    // ========================================
    // Dialogs
    // ========================================
    dialogs: {
        selectTexture: 'Select texture image',
        selectParticleFile: 'Select particle file',
        saveParticleFile: 'Save particle file'
    }
};
