/**
 * Physics 2D Types exports
 */

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
} from './Physics2DTypes';

// Re-export IVector2 for type compatibility
export type { IVector2 } from '@esengine/ecs-framework-math';

export {
    type CollisionEventType,
    type TriggerEventType,
    type ContactPoint2D,
    type CollisionEvent2D,
    type TriggerEvent2D,
    PHYSICS_EVENTS,
    type Physics2DEventMap
} from './Physics2DEvents';
