/**
 * Spanish translations for Particle Editor
 * Traducciones en español del editor de partículas
 */
export const es = {
    // ========================================
    // Panel
    // ========================================
    panel: {
        title: 'Editor de Partículas',
        noFileOpen: 'No hay archivo de partículas abierto',
        dropToOpen: 'Arrastre un archivo .particle aquí o use el botón Abrir'
    },

    // ========================================
    // Toolbar
    // ========================================
    toolbar: {
        play: 'Reproducir',
        pause: 'Pausar',
        restart: 'Reiniciar',
        save: 'Guardar',
        open: 'Abrir',
        maximize: 'Maximizar vista previa',
        minimize: 'Minimizar vista previa',
        followMouse: 'Seguir ratón',
        resetPosition: 'Restablecer posición'
    },

    // ========================================
    // Sections
    // ========================================
    sections: {
        basic: 'Básico',
        emission: 'Emisión',
        particle: 'Partícula',
        color: 'Color',
        modules: 'Módulos',
        presets: 'Preajustes'
    },

    // ========================================
    // Basic Properties
    // ========================================
    basic: {
        name: 'Nombre',
        texture: 'Textura',
        maxParticles: 'Máx. Partículas',
        looping: 'Bucle',
        duration: 'Duración',
        prewarm: 'Precalentamiento',
        playSpeed: 'Velocidad',
        blendMode: 'Modo mezcla',
        space: 'Espacio',
        particleSize: 'Tamaño partícula',
        sortOrder: 'Orden'
    },

    // ========================================
    // Blend Modes
    // ========================================
    blendMode: {
        normal: 'Normal',
        additive: 'Aditivo',
        multiply: 'Multiplicar'
    },

    // ========================================
    // Simulation Space
    // ========================================
    space: {
        world: 'Mundo',
        local: 'Local'
    },

    // ========================================
    // Emission Properties
    // ========================================
    emission: {
        rate: 'Tasa',
        shape: 'Forma',
        radius: 'Radio',
        width: 'Ancho',
        height: 'Alto',
        coneAngle: 'Ángulo cono'
    },

    // ========================================
    // Emission Shapes
    // ========================================
    shapes: {
        point: 'Punto',
        circle: 'Círculo',
        ring: 'Anillo',
        rectangle: 'Rectángulo',
        edge: 'Borde',
        line: 'Línea',
        cone: 'Cono'
    },

    // ========================================
    // Particle Properties
    // ========================================
    particle: {
        lifetime: 'Vida',
        speed: 'Velocidad',
        direction: 'Dirección',
        spread: 'Dispersión',
        scale: 'Escala',
        gravity: 'Gravedad'
    },

    // ========================================
    // Color Properties
    // ========================================
    color: {
        startColor: 'Color inicial',
        startAlpha: 'Alfa inicial',
        endAlpha: 'Alfa final',
        endScale: 'Escala final'
    },

    // ========================================
    // Module Names
    // ========================================
    modules: {
        colorOverLifetime: 'Color durante vida',
        sizeOverLifetime: 'Tamaño durante vida',
        velocityOverLifetime: 'Velocidad durante vida',
        rotationOverLifetime: 'Rotación durante vida',
        noise: 'Ruido',
        collision: 'Colisión',
        forceField: 'Campo de fuerza'
    },

    // ========================================
    // Velocity Over Lifetime
    // ========================================
    velocity: {
        drag: 'Arrastre',
        orbital: 'Orbital',
        radial: 'Radial'
    },

    // ========================================
    // Rotation Over Lifetime
    // ========================================
    rotation: {
        startMult: 'Mult. inicial',
        endMult: 'Mult. final',
        additional: 'Adicional'
    },

    // ========================================
    // Noise Module
    // ========================================
    noise: {
        position: 'Posición',
        velocity: 'Velocidad',
        rotation: 'Rotación',
        frequency: 'Frecuencia',
        scroll: 'Desplazamiento'
    },

    // ========================================
    // Collision Module
    // ========================================
    collision: {
        boundary: 'Límite',
        behavior: 'Comportamiento',
        left: 'Izquierda',
        right: 'Derecha',
        top: 'Arriba',
        bottom: 'Abajo',
        radius: 'Radio',
        bounce: 'Rebote',
        lifeLoss: 'Pérdida de vida'
    },

    // ========================================
    // Boundary Types
    // ========================================
    boundaryType: {
        none: 'Ninguno',
        rectangle: 'Rectángulo',
        circle: 'Círculo'
    },

    // ========================================
    // Collision Behaviors
    // ========================================
    collisionBehavior: {
        kill: 'Eliminar',
        bounce: 'Rebotar',
        wrap: 'Envolver'
    },

    // ========================================
    // Force Field Module
    // ========================================
    forceField: {
        type: 'Tipo',
        strength: 'Fuerza',
        directionX: 'Dirección X',
        directionY: 'Dirección Y',
        centerX: 'Centro X',
        centerY: 'Centro Y',
        range: 'Rango',
        falloff: 'Caída'
    },

    // ========================================
    // Force Field Types
    // ========================================
    forceFieldType: {
        wind: 'Viento',
        point: 'Punto',
        vortex: 'Vórtice',
        turbulence: 'Turbulencia'
    },

    // ========================================
    // Curve Editor
    // ========================================
    curve: {
        deletePoint: 'Eliminar punto',
        constant: 'Valor constante',
        fadeIn: 'Aparecer',
        fadeOut: 'Desvanecer',
        bellCurve: 'Curva campana',
        uCurve: 'Curva U'
    },

    // ========================================
    // Gradient Editor
    // ========================================
    gradient: {
        deleteStop: 'Eliminar parada'
    },

    // ========================================
    // Texture Picker
    // ========================================
    texturePicker: {
        browse: 'Examinar...',
        clear: 'Limpiar'
    },

    // ========================================
    // Notifications
    // ========================================
    notifications: {
        fileSaved: 'Archivo guardado: {{path}}',
        fileSaveFailed: 'Error al guardar archivo',
        fileOpened: 'Archivo abierto: {{path}}',
        fileOpenFailed: 'Error al abrir archivo'
    },

    // ========================================
    // Dialogs
    // ========================================
    dialogs: {
        selectTexture: 'Seleccionar imagen de textura',
        selectParticleFile: 'Seleccionar archivo de partículas',
        saveParticleFile: 'Guardar archivo de partículas'
    }
};
