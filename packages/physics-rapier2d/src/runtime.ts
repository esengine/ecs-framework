/**
 * @esengine/physics-rapier2d Runtime Entry Point
 *
 * This entry point exports only runtime-related code without any editor dependencies.
 * Use this for standalone game runtime builds.
 */

// Types
export {
    RigidbodyType2D,
    CollisionDetectionMode2D,
    type Physics2DConfig,
    DEFAULT_PHYSICS_CONFIG,
    CollisionLayer2D,
    ForceMode2D,
    type RaycastHit2D,
    type ShapeCastHit2D,
    type OverlapResult2D,
    PhysicsMaterial2DPreset,
    getPhysicsMaterialPreset,
    JointType2D
} from './types/Physics2DTypes';

// Re-export IVector2 from math package
export type { IVector2 } from '@esengine/ecs-framework-math';

export {
    type CollisionEventType,
    type TriggerEventType,
    type ContactPoint2D,
    type CollisionEvent2D,
    type TriggerEvent2D,
    PHYSICS_EVENTS,
    type Physics2DEventMap
} from './types/Physics2DEvents';

// Components
export { Rigidbody2DComponent, type RigidbodyConstraints2D } from './components/Rigidbody2DComponent';
export { Collider2DBase } from './components/Collider2DBase';
export { BoxCollider2DComponent } from './components/BoxCollider2DComponent';
export { CircleCollider2DComponent } from './components/CircleCollider2DComponent';
export { CapsuleCollider2DComponent, CapsuleDirection2D } from './components/CapsuleCollider2DComponent';
export { PolygonCollider2DComponent } from './components/PolygonCollider2DComponent';

// World
export { Physics2DWorld, type Physics2DWorldState } from './world/Physics2DWorld';

// Systems
export { Physics2DSystem, type Physics2DSystemConfig } from './systems/Physics2DSystem';

// Services
export { Physics2DService } from './services/Physics2DService';

// Runtime module and plugin
export { PhysicsRuntimeModule, PhysicsPlugin } from './PhysicsRuntimeModule';

// Service tokens
export {
    Physics2DQueryToken,
    Physics2DSystemToken,
    Physics2DWorldToken,
    PhysicsConfigToken,
    type IPhysics2DQuery,
    type PhysicsConfig
} from './tokens';
