import type { Particle } from '../Particle';
import type { IParticleModule } from './IParticleModule';

/**
 * 边界类型
 * Boundary type
 */
export enum BoundaryType {
    /** 无边界 | No boundary */
    None = 'none',
    /** 矩形边界 | Rectangle boundary */
    Rectangle = 'rectangle',
    /** 圆形边界 | Circle boundary */
    Circle = 'circle'
}

/**
 * 碰撞行为
 * Collision behavior
 */
export enum CollisionBehavior {
    /** 销毁粒子 | Kill particle */
    Kill = 'kill',
    /** 反弹 | Bounce */
    Bounce = 'bounce',
    /** 环绕（从另一边出现）| Wrap (appear on opposite side) */
    Wrap = 'wrap'
}

/**
 * 碰撞模块
 * Collision module for particle boundaries
 */
export class CollisionModule implements IParticleModule {
    readonly name = 'Collision';
    enabled = true;

    // ============= 边界设置 | Boundary Settings =============

    /** 边界类型 | Boundary type */
    boundaryType: BoundaryType = BoundaryType.Rectangle;

    /** 碰撞行为 | Collision behavior */
    behavior: CollisionBehavior = CollisionBehavior.Kill;

    // ============= 矩形边界 | Rectangle Boundary =============

    /** 左边界（相对于发射器）| Left boundary (relative to emitter) */
    left: number = -200;

    /** 右边界（相对于发射器）| Right boundary (relative to emitter) */
    right: number = 200;

    /** 上边界（相对于发射器）| Top boundary (relative to emitter) */
    top: number = -200;

    /** 下边界（相对于发射器）| Bottom boundary (relative to emitter) */
    bottom: number = 200;

    // ============= 圆形边界 | Circle Boundary =============

    /** 圆形边界半径 | Circle boundary radius */
    radius: number = 200;

    // ============= 反弹设置 | Bounce Settings =============

    /** 反弹系数 (0-1)，1 = 完全弹性 | Bounce factor (0-1), 1 = fully elastic */
    bounceFactor: number = 0.8;

    /** 最小速度阈值（低于此速度时销毁）| Min velocity threshold (kill if below) */
    minVelocityThreshold: number = 5;

    /** 反弹时的生命损失 (0-1) | Life loss on bounce (0-1) */
    lifeLossOnBounce: number = 0;

    // ============= 发射器位置（运行时设置）| Emitter Position (set at runtime) =============

    /** 发射器 X 坐标 | Emitter X position */
    emitterX: number = 0;

    /** 发射器 Y 坐标 | Emitter Y position */
    emitterY: number = 0;

    /** 粒子死亡标记数组 | Particle death flag array */
    private _particlesToKill: Set<Particle> = new Set();

    /**
     * 获取需要销毁的粒子
     * Get particles to kill
     */
    getParticlesToKill(): Set<Particle> {
        return this._particlesToKill;
    }

    /**
     * 清除死亡标记
     * Clear death flags
     */
    clearDeathFlags(): void {
        this._particlesToKill.clear();
    }

    update(p: Particle, _dt: number, _normalizedAge: number): void {
        if (this.boundaryType === BoundaryType.None) return;

        // 计算相对于发射器的位置 | Calculate position relative to emitter
        const relX = p.x - this.emitterX;
        const relY = p.y - this.emitterY;

        let collision = false;
        let normalX = 0;
        let normalY = 0;

        if (this.boundaryType === BoundaryType.Rectangle) {
            // 矩形边界检测 | Rectangle boundary detection
            if (relX < this.left) {
                collision = true;
                normalX = 1;
                if (this.behavior === CollisionBehavior.Wrap) {
                    p.x = this.emitterX + this.right;
                } else if (this.behavior === CollisionBehavior.Bounce) {
                    p.x = this.emitterX + this.left;
                }
            } else if (relX > this.right) {
                collision = true;
                normalX = -1;
                if (this.behavior === CollisionBehavior.Wrap) {
                    p.x = this.emitterX + this.left;
                } else if (this.behavior === CollisionBehavior.Bounce) {
                    p.x = this.emitterX + this.right;
                }
            }

            if (relY < this.top) {
                collision = true;
                normalY = 1;
                if (this.behavior === CollisionBehavior.Wrap) {
                    p.y = this.emitterY + this.bottom;
                } else if (this.behavior === CollisionBehavior.Bounce) {
                    p.y = this.emitterY + this.top;
                }
            } else if (relY > this.bottom) {
                collision = true;
                normalY = -1;
                if (this.behavior === CollisionBehavior.Wrap) {
                    p.y = this.emitterY + this.top;
                } else if (this.behavior === CollisionBehavior.Bounce) {
                    p.y = this.emitterY + this.bottom;
                }
            }
        } else if (this.boundaryType === BoundaryType.Circle) {
            // 圆形边界检测 | Circle boundary detection
            const dist = Math.sqrt(relX * relX + relY * relY);
            if (dist > this.radius) {
                collision = true;
                if (dist > 0.001) {
                    normalX = -relX / dist;
                    normalY = -relY / dist;
                }

                if (this.behavior === CollisionBehavior.Wrap) {
                    // 移动到对面 | Move to opposite side
                    p.x = this.emitterX - relX * (this.radius / dist) * 0.9;
                    p.y = this.emitterY - relY * (this.radius / dist) * 0.9;
                } else if (this.behavior === CollisionBehavior.Bounce) {
                    // 移回边界内 | Move back inside boundary
                    p.x = this.emitterX + relX * (this.radius / dist) * 0.99;
                    p.y = this.emitterY + relY * (this.radius / dist) * 0.99;
                }
            }
        }

        if (collision) {
            switch (this.behavior) {
                case CollisionBehavior.Kill:
                    this._particlesToKill.add(p);
                    break;

                case CollisionBehavior.Bounce:
                    this._applyBounce(p, normalX, normalY);
                    break;

                case CollisionBehavior.Wrap:
                    // 位置已经在上面处理 | Position already handled above
                    break;
            }
        }
    }

    /**
     * 应用反弹
     * Apply bounce effect
     */
    private _applyBounce(p: Particle, normalX: number, normalY: number): void {
        // 反弹速度计算 | Calculate bounce velocity
        if (normalX !== 0) {
            p.vx = -p.vx * this.bounceFactor;
        }
        if (normalY !== 0) {
            p.vy = -p.vy * this.bounceFactor;
        }

        // 更新存储的初始速度（如果有速度曲线模块）| Update stored initial velocity
        if (p.startVx !== undefined && normalX !== 0) {
            p.startVx = -(p.startVx) * this.bounceFactor;
        }
        if (p.startVy !== undefined && normalY !== 0) {
            p.startVy = -(p.startVy) * this.bounceFactor;
        }

        // 应用生命损失 | Apply life loss
        if (this.lifeLossOnBounce > 0) {
            p.lifetime *= (1 - this.lifeLossOnBounce);
        }

        // 检查最小速度 | Check minimum velocity
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < this.minVelocityThreshold) {
            this._particlesToKill.add(p);
        }
    }
}
