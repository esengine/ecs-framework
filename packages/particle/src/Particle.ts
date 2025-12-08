/**
 * 粒子数据结构
 * Particle data structure
 *
 * Represents a single particle with all its runtime state.
 * 表示单个粒子及其所有运行时状态。
 */
export interface Particle {
    /** 是否存活 | Whether particle is alive */
    alive: boolean;

    /** 位置X | Position X */
    x: number;
    /** 位置Y | Position Y */
    y: number;

    /** 速度X | Velocity X */
    vx: number;
    /** 速度Y | Velocity Y */
    vy: number;

    /** 加速度X | Acceleration X */
    ax: number;
    /** 加速度Y | Acceleration Y */
    ay: number;

    /** 旋转角度（弧度）| Rotation (radians) */
    rotation: number;
    /** 角速度 | Angular velocity */
    angularVelocity: number;

    /** 缩放X | Scale X */
    scaleX: number;
    /** 缩放Y | Scale Y */
    scaleY: number;

    /** 颜色R (0-1) | Color R (0-1) */
    r: number;
    /** 颜色G (0-1) | Color G (0-1) */
    g: number;
    /** 颜色B (0-1) | Color B (0-1) */
    b: number;
    /** 透明度 (0-1) | Alpha (0-1) */
    alpha: number;

    /** 当前生命时间（秒）| Current lifetime (seconds) */
    age: number;
    /** 总生命时间（秒）| Total lifetime (seconds) */
    lifetime: number;

    /** 初始缩放X | Initial scale X */
    startScaleX: number;
    /** 初始缩放Y | Initial scale Y */
    startScaleY: number;

    /** 初始颜色R | Initial color R */
    startR: number;
    /** 初始颜色G | Initial color G */
    startG: number;
    /** 初始颜色B | Initial color B */
    startB: number;
    /** 初始透明度 | Initial alpha */
    startAlpha: number;

    // ============= 模块运行时状态 | Module Runtime State =============
    // 这些字段由各模块在运行时设置 | These fields are set by modules at runtime

    /** 初始速度X（VelocityOverLifetimeModule 使用）| Initial velocity X (used by VelocityOverLifetimeModule) */
    startVx?: number;
    /** 初始速度Y（VelocityOverLifetimeModule 使用）| Initial velocity Y (used by VelocityOverLifetimeModule) */
    startVy?: number;

    /** 动画帧索引（TextureSheetAnimationModule 使用）| Animation frame index (used by TextureSheetAnimationModule) */
    _animFrame?: number;
    /** 动画图块列数（TextureSheetAnimationModule 使用）| Animation tiles X (used by TextureSheetAnimationModule) */
    _animTilesX?: number;
    /** 动画图块行数（TextureSheetAnimationModule 使用）| Animation tiles Y (used by TextureSheetAnimationModule) */
    _animTilesY?: number;

    /** 自定义数据槽 | Custom data slot */
    userData?: unknown;
}

/**
 * 创建新粒子
 * Create a new particle
 */
export function createParticle(): Particle {
    return {
        alive: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
        rotation: 0,
        angularVelocity: 0,
        scaleX: 1,
        scaleY: 1,
        r: 1,
        g: 1,
        b: 1,
        alpha: 1,
        age: 0,
        lifetime: 1,
        startScaleX: 1,
        startScaleY: 1,
        startR: 1,
        startG: 1,
        startB: 1,
        startAlpha: 1
    };
}

/**
 * 重置粒子状态
 * Reset particle state
 */
export function resetParticle(p: Particle): void {
    p.alive = false;
    p.x = 0;
    p.y = 0;
    p.vx = 0;
    p.vy = 0;
    p.ax = 0;
    p.ay = 0;
    p.rotation = 0;
    p.angularVelocity = 0;
    p.scaleX = 1;
    p.scaleY = 1;
    p.r = 1;
    p.g = 1;
    p.b = 1;
    p.alpha = 1;
    p.age = 0;
    p.lifetime = 1;
    p.startScaleX = 1;
    p.startScaleY = 1;
    p.startR = 1;
    p.startG = 1;
    p.startB = 1;
    p.startAlpha = 1;
    p.userData = undefined;
}

/**
 * 粒子池
 * Particle pool for efficient memory management
 */
export class ParticlePool {
    private _particles: Particle[] = [];
    private _capacity: number;
    private _activeCount: number = 0;

    constructor(capacity: number) {
        this._capacity = capacity;
        for (let i = 0; i < capacity; i++) {
            this._particles.push(createParticle());
        }
    }

    /** 池容量 | Pool capacity */
    get capacity(): number {
        return this._capacity;
    }

    /** 活跃粒子数 | Active particle count */
    get activeCount(): number {
        return this._activeCount;
    }

    /** 所有粒子（包括不活跃的）| All particles (including inactive) */
    get particles(): readonly Particle[] {
        return this._particles;
    }

    /**
     * 获取一个空闲粒子
     * Get an inactive particle
     */
    spawn(): Particle | null {
        for (const p of this._particles) {
            if (!p.alive) {
                p.alive = true;
                this._activeCount++;
                return p;
            }
        }
        return null;
    }

    /**
     * 回收粒子
     * Recycle a particle
     */
    recycle(p: Particle): void {
        if (p.alive) {
            p.alive = false;
            this._activeCount--;
        }
    }

    /**
     * 回收所有粒子
     * Recycle all particles
     */
    recycleAll(): void {
        for (const p of this._particles) {
            p.alive = false;
        }
        this._activeCount = 0;
    }

    /**
     * 遍历活跃粒子
     * Iterate over active particles
     */
    forEachActive(callback: (p: Particle, index: number) => void): void {
        let index = 0;
        for (const p of this._particles) {
            if (p.alive) {
                callback(p, index++);
            }
        }
    }

    /**
     * 调整池大小
     * Resize the pool
     */
    resize(newCapacity: number): void {
        if (newCapacity > this._capacity) {
            for (let i = this._capacity; i < newCapacity; i++) {
                this._particles.push(createParticle());
            }
        } else if (newCapacity < this._capacity) {
            // 回收超出容量的活跃粒子 | Recycle active particles beyond capacity
            for (let i = newCapacity; i < this._capacity; i++) {
                if (this._particles[i].alive) {
                    this._activeCount--;
                }
            }
            this._particles.length = newCapacity;
        }
        this._capacity = newCapacity;
    }
}
