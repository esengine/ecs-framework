/* tslint:disable */
/* eslint-disable */
export function reserve_memory(extra_bytes_count: number): void;
export function version(): string;
export enum RawFeatureType {
  Vertex = 0,
  Face = 1,
  Unknown = 2,
}
export enum RawJointAxis {
  LinX = 0,
  LinY = 1,
  AngX = 2,
}
export enum RawJointType {
  Revolute = 0,
  Fixed = 1,
  Prismatic = 2,
  Rope = 3,
  Spring = 4,
  Generic = 5,
}
export enum RawMotorModel {
  AccelerationBased = 0,
  ForceBased = 1,
}
export enum RawRigidBodyType {
  Dynamic = 0,
  Fixed = 1,
  KinematicPositionBased = 2,
  KinematicVelocityBased = 3,
}
export enum RawShapeType {
  Ball = 0,
  Cuboid = 1,
  Capsule = 2,
  Segment = 3,
  Polyline = 4,
  Triangle = 5,
  TriMesh = 6,
  HeightField = 7,
  Compound = 8,
  ConvexPolygon = 9,
  RoundCuboid = 10,
  RoundTriangle = 11,
  RoundConvexPolygon = 12,
  HalfSpace = 13,
  Voxels = 14,
}
export class RawBroadPhase {
  free(): void;
  projectPoint(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, point: RawVector, solid: boolean, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): RawPointColliderProjection | undefined;
  castRayAndGetNormal(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): RawRayColliderIntersection | undefined;
  intersectionsWithRay(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean, callback: Function, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): void;
  intersectionWithShape(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, shapePos: RawVector, shapeRot: RawRotation, shape: RawShape, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): number | undefined;
  intersectionsWithPoint(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, point: RawVector, callback: Function, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): void;
  intersectionsWithShape(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, shapePos: RawVector, shapeRot: RawRotation, shape: RawShape, callback: Function, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): void;
  projectPointAndGetFeature(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, point: RawVector, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): RawPointColliderProjection | undefined;
  collidersWithAabbIntersectingAabb(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, aabbCenter: RawVector, aabbHalfExtents: RawVector, callback: Function): void;
  constructor();
  castRay(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): RawRayColliderHit | undefined;
  castShape(narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, shapePos: RawVector, shapeRot: RawRotation, shapeVel: RawVector, shape: RawShape, target_distance: number, maxToi: number, stop_at_penetration: boolean, filter_flags: number, filter_groups: number | null | undefined, filter_exclude_collider: number | null | undefined, filter_exclude_rigid_body: number | null | undefined, filter_predicate: Function): RawColliderShapeCastHit | undefined;
}
export class RawCCDSolver {
  free(): void;
  constructor();
}
export class RawCharacterCollision {
  free(): void;
  worldNormal1(): RawVector;
  worldNormal2(): RawVector;
  worldWitness1(): RawVector;
  worldWitness2(): RawVector;
  translationDeltaApplied(): RawVector;
  translationDeltaRemaining(): RawVector;
  constructor();
  toi(): number;
  handle(): number;
}
export class RawColliderSet {
  free(): void;
  /**
   * Checks if a collider with the given integer handle exists.
   */
  isHandleValid(handle: number): boolean;
  createCollider(enabled: boolean, shape: RawShape, translation: RawVector, rotation: RawRotation, massPropsMode: number, mass: number, centerOfMass: RawVector, principalAngularInertia: number, density: number, friction: number, restitution: number, frictionCombineRule: number, restitutionCombineRule: number, isSensor: boolean, collisionGroups: number, solverGroups: number, activeCollisionTypes: number, activeHooks: number, activeEvents: number, contactForceEventThreshold: number, contactSkin: number, hasParent: boolean, parent: number, bodies: RawRigidBodySet): number | undefined;
  /**
   * Applies the given JavaScript function to the integer handle of each collider managed by this collider set.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each collider managed by this collider set. Called as `f(handle)`.
   */
  forEachColliderHandle(f: Function): void;
  len(): number;
  constructor();
  /**
   * Removes a collider from this set and wake-up the rigid-body it is attached to.
   */
  remove(handle: number, islands: RawIslandManager, bodies: RawRigidBodySet, wakeUp: boolean): void;
  contains(handle: number): boolean;
  /**
   * The friction coefficient of this collider.
   */
  coFriction(handle: number): number;
  /**
   * Is this collider a sensor?
   */
  coIsSensor(handle: number): boolean;
  /**
   * The world-space orientation of this collider.
   */
  coRotation(handle: number): RawRotation;
  coSetShape(handle: number, shape: RawShape): void;
  coSetVoxel(handle: number, ix: number, iy: number, filled: boolean): void;
  /**
   * The vertices of this triangle mesh, polyline, convex polyhedron, segment, triangle or convex polyhedron, if it is one.
   */
  coVertices(handle: number): Float32Array | undefined;
  coCastShape(handle: number, colliderVel: RawVector, shape2: RawShape, shape2Pos: RawVector, shape2Rot: RawRotation, shape2Vel: RawVector, target_distance: number, maxToi: number, stop_at_penetration: boolean): RawShapeCastHit | undefined;
  coIsEnabled(handle: number): boolean;
  /**
   * Set the radius of this collider if it is a ball, capsule, cylinder, or cone shape.
   */
  coSetRadius(handle: number, newRadius: number): void;
  coSetSensor(handle: number, is_sensor: boolean): void;
  /**
   * The type of the shape of this collider.
   */
  coShapeType(handle: number): RawShapeType;
  coVoxelData(handle: number): Int32Array | undefined;
  coVoxelSize(handle: number): RawVector | undefined;
  /**
   * The half height of this collider if it is a capsule, cylinder, or cone shape.
   */
  coHalfHeight(handle: number): number | undefined;
  coSetDensity(handle: number, density: number): void;
  coSetEnabled(handle: number, enabled: boolean): void;
  /**
   * The physics hooks enabled for this collider.
   */
  coActiveHooks(handle: number): number;
  coContactSkin(handle: number): number;
  /**
   * The half-extents of this collider if it is has a cuboid shape.
   */
  coHalfExtents(handle: number): RawVector | undefined;
  /**
   * The restitution coefficient of this collider.
   */
  coRestitution(handle: number): number;
  /**
   * The radius of the round edges of this collider.
   */
  coRoundRadius(handle: number): number | undefined;
  coSetFriction(handle: number, friction: number): void;
  /**
   * Sets the rotation angle of this collider.
   *
   * # Parameters
   * - `angle`: the rotation angle, in radians.
   * - `wakeUp`: forces the collider to wake-up so it is properly affected by forces if it
   * wasn't moving before modifying its position.
   */
  coSetRotation(handle: number, angle: number): void;
  /**
   * The world-space translation of this collider.
   */
  coTranslation(handle: number): RawVector;
  /**
   * The events enabled for this collider.
   */
  coActiveEvents(handle: number): number;
  coCastCollider(handle: number, collider1Vel: RawVector, collider2handle: number, collider2Vel: RawVector, target_distance: number, max_toi: number, stop_at_penetration: boolean): RawColliderShapeCastHit | undefined;
  coContactShape(handle: number, shape2: RawShape, shapePos2: RawVector, shapeRot2: RawRotation, prediction: number): RawShapeContact | undefined;
  coProjectPoint(handle: number, point: RawVector, solid: boolean): RawPointProjection;
  /**
   * The solver groups of this collider.
   */
  coSolverGroups(handle: number): number;
  coTriMeshFlags(handle: number): number | undefined;
  coContainsPoint(handle: number, point: RawVector): boolean;
  coIntersectsRay(handle: number, rayOrig: RawVector, rayDir: RawVector, maxToi: number): boolean;
  /**
   * Set the half height of this collider if it is a capsule, cylinder, or cone shape.
   */
  coSetHalfHeight(handle: number, newHalfheight: number): void;
  coSetActiveHooks(handle: number, hooks: number): void;
  coSetContactSkin(handle: number, contact_skin: number): void;
  /**
   * Set the half-extents of this collider if it has a cuboid shape.
   */
  coSetHalfExtents(handle: number, newHalfExtents: RawVector): void;
  coSetRestitution(handle: number, restitution: number): void;
  /**
   * Set the radius of the round edges of this collider.
   */
  coSetRoundRadius(handle: number, newBorderRadius: number): void;
  /**
   * Sets the translation of this collider.
   *
   * # Parameters
   * - `x`: the world-space position of the collider along the `x` axis.
   * - `y`: the world-space position of the collider along the `y` axis.
   * - `wakeUp`: forces the collider to wake-up so it is properly affected by forces if it
   * wasn't moving before modifying its position.
   */
  coSetTranslation(handle: number, x: number, y: number): void;
  /**
   * The collision groups of this collider.
   */
  coCollisionGroups(handle: number): number;
  coContactCollider(handle: number, collider2handle: number, prediction: number): RawShapeContact | undefined;
  coHalfspaceNormal(handle: number): RawVector | undefined;
  coIntersectsShape(handle: number, shape2: RawShape, shapePos2: RawVector, shapeRot2: RawRotation): boolean;
  coSetActiveEvents(handle: number, events: number): void;
  coSetSolverGroups(handle: number, groups: number): void;
  /**
   * The scaling factor applied of this heightfield if it is one.
   */
  coHeightfieldScale(handle: number): RawVector | undefined;
  /**
   * The orientation of this collider relative to its parent rigid-body.
   *
   * Returns the `None` if it doesn’t have a parent.
   */
  coRotationWrtParent(handle: number): RawRotation | undefined;
  coSetMassProperties(handle: number, mass: number, centerOfMass: RawVector, principalAngularInertia: number): void;
  coCombineVoxelStates(handle1: number, handle2: number, shift_x: number, shift_y: number): void;
  /**
   * The height of this heightfield if it is one.
   */
  coHeightfieldHeights(handle: number): Float32Array | undefined;
  coSetCollisionGroups(handle: number, groups: number): void;
  coCastRayAndGetNormal(handle: number, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean): RawRayIntersection | undefined;
  coFrictionCombineRule(handle: number): number;
  /**
   * The collision types enabled for this collider.
   */
  coActiveCollisionTypes(handle: number): number;
  coPropagateVoxelChange(handle1: number, handle2: number, ix: number, iy: number, shift_x: number, shift_y: number): void;
  coSetRotationWrtParent(handle: number, angle: number): void;
  /**
   * The translation of this collider relative to its parent rigid-body.
   *
   * Returns the `None` if it doesn’t have a parent.
   */
  coTranslationWrtParent(handle: number): RawVector | undefined;
  coRestitutionCombineRule(handle: number): number;
  coSetFrictionCombineRule(handle: number, rule: number): void;
  coSetActiveCollisionTypes(handle: number, types: number): void;
  coSetTranslationWrtParent(handle: number, x: number, y: number): void;
  coSetRestitutionCombineRule(handle: number, rule: number): void;
  /**
   * The total force magnitude beyond which a contact force event can be emitted.
   */
  coContactForceEventThreshold(handle: number): number;
  coSetContactForceEventThreshold(handle: number, threshold: number): void;
  /**
   * The mass of this collider.
   */
  coMass(handle: number): number;
  /**
   * The unique integer identifier of the collider this collider is attached to.
   */
  coParent(handle: number): number | undefined;
  /**
   * The radius of this collider if it is a ball, capsule, cylinder, or cone shape.
   */
  coRadius(handle: number): number | undefined;
  /**
   * The volume of this collider.
   */
  coVolume(handle: number): number;
  coCastRay(handle: number, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean): number;
  /**
   * The density of this collider.
   */
  coDensity(handle: number): number;
  /**
   * The indices of this triangle mesh, polyline, or convex polyhedron, if it is one.
   */
  coIndices(handle: number): Uint32Array | undefined;
  coSetMass(handle: number, mass: number): void;
}
export class RawColliderShapeCastHit {
  private constructor();
  free(): void;
  colliderHandle(): number;
  time_of_impact(): number;
  normal1(): RawVector;
  normal2(): RawVector;
  witness1(): RawVector;
  witness2(): RawVector;
}
export class RawContactForceEvent {
  private constructor();
  free(): void;
  /**
   * The sum of all the forces between the two colliders.
   */
  total_force(): RawVector;
  /**
   * The world-space (unit) direction of the force with strongest magnitude.
   */
  max_force_direction(): RawVector;
  /**
   * The magnitude of the largest force at a contact point of this contact pair.
   */
  max_force_magnitude(): number;
  /**
   * The sum of the magnitudes of each force between the two colliders.
   *
   * Note that this is **not** the same as the magnitude of `self.total_force`.
   * Here we are summing the magnitude of all the forces, instead of taking
   * the magnitude of their sum.
   */
  total_force_magnitude(): number;
  /**
   * The first collider involved in the contact.
   */
  collider1(): number;
  /**
   * The second collider involved in the contact.
   */
  collider2(): number;
}
export class RawContactManifold {
  private constructor();
  free(): void;
  contact_dist(i: number): number;
  contact_fid1(i: number): number;
  contact_fid2(i: number): number;
  num_contacts(): number;
  contact_impulse(i: number): number;
  contact_local_p1(i: number): RawVector | undefined;
  contact_local_p2(i: number): RawVector | undefined;
  num_solver_contacts(): number;
  solver_contact_dist(i: number): number;
  solver_contact_point(i: number): RawVector | undefined;
  contact_tangent_impulse(i: number): number;
  solver_contact_friction(i: number): number;
  solver_contact_restitution(i: number): number;
  solver_contact_tangent_velocity(i: number): RawVector;
  normal(): RawVector;
  local_n1(): RawVector;
  local_n2(): RawVector;
  subshape1(): number;
  subshape2(): number;
}
export class RawContactPair {
  private constructor();
  free(): void;
  contactManifold(i: number): RawContactManifold | undefined;
  numContactManifolds(): number;
  collider1(): number;
  collider2(): number;
}
export class RawDebugRenderPipeline {
  free(): void;
  constructor();
  colors(): Float32Array;
  render(bodies: RawRigidBodySet, colliders: RawColliderSet, impulse_joints: RawImpulseJointSet, multibody_joints: RawMultibodyJointSet, narrow_phase: RawNarrowPhase, filter_flags: number, filter_predicate: Function): void;
  vertices(): Float32Array;
}
export class RawDeserializedWorld {
  private constructor();
  free(): void;
  takeBodies(): RawRigidBodySet | undefined;
  takeGravity(): RawVector | undefined;
  takeColliders(): RawColliderSet | undefined;
  takeBroadPhase(): RawBroadPhase | undefined;
  takeNarrowPhase(): RawNarrowPhase | undefined;
  takeImpulseJoints(): RawImpulseJointSet | undefined;
  takeIslandManager(): RawIslandManager | undefined;
  takeMultibodyJoints(): RawMultibodyJointSet | undefined;
  takeIntegrationParameters(): RawIntegrationParameters | undefined;
}
/**
 * A structure responsible for collecting events generated
 * by the physics engine.
 */
export class RawEventQueue {
  free(): void;
  /**
   * Applies the given javascript closure on each collision event of this collector, then clear
   * the internal collision event buffer.
   *
   * # Parameters
   * - `f(handle1, handle2, started)`:  JavaScript closure applied to each collision event. The
   * closure should take three arguments: two integers representing the handles of the colliders
   * involved in the collision, and a boolean indicating if the collision started (true) or stopped
   * (false).
   */
  drainCollisionEvents(f: Function): void;
  drainContactForceEvents(f: Function): void;
  /**
   * Creates a new event collector.
   *
   * # Parameters
   * - `autoDrain`: setting this to `true` is strongly recommended. If true, the collector will
   * be automatically drained before each `world.step(collector)`. If false, the collector will
   * keep all events in memory unless it is manually drained/cleared; this may lead to unbounded use of
   * RAM if no drain is performed.
   */
  constructor(autoDrain: boolean);
  /**
   * Removes all events contained by this collector.
   */
  clear(): void;
}
export class RawGenericJoint {
  private constructor();
  free(): void;
  static rope(length: number, anchor1: RawVector, anchor2: RawVector): RawGenericJoint;
  /**
   * Creates a new joint descriptor that builds a Fixed joint.
   *
   * A fixed joint removes all the degrees of freedom between the affected bodies.
   */
  static fixed(anchor1: RawVector, axes1: RawRotation, anchor2: RawVector, axes2: RawRotation): RawGenericJoint;
  static spring(rest_length: number, stiffness: number, damping: number, anchor1: RawVector, anchor2: RawVector): RawGenericJoint;
  /**
   * Create a new joint descriptor that builds Revolute joints.
   *
   * A revolute joint removes all degrees of freedom between the affected
   * bodies except for the rotation.
   */
  static revolute(anchor1: RawVector, anchor2: RawVector): RawGenericJoint | undefined;
  /**
   * Creates a new joint descriptor that builds a Prismatic joint.
   *
   * A prismatic joint removes all the degrees of freedom between the
   * affected bodies, except for the translation along one axis.
   *
   * Returns `None` if any of the provided axes cannot be normalized.
   */
  static prismatic(anchor1: RawVector, anchor2: RawVector, axis: RawVector, limitsEnabled: boolean, limitsMin: number, limitsMax: number): RawGenericJoint | undefined;
}
export class RawImpulseJointSet {
  free(): void;
  /**
   * The position of the first anchor of this joint.
   *
   * The first anchor gives the position of the points application point on the
   * local frame of the first rigid-body it is attached to.
   */
  jointAnchor1(handle: number): RawVector;
  /**
   * The position of the second anchor of this joint.
   *
   * The second anchor gives the position of the points application point on the
   * local frame of the second rigid-body it is attached to.
   */
  jointAnchor2(handle: number): RawVector;
  /**
   * The angular part of the joint’s local frame relative to the first rigid-body it is attached to.
   */
  jointFrameX1(handle: number): RawRotation;
  /**
   * The angular part of the joint’s local frame relative to the second rigid-body it is attached to.
   */
  jointFrameX2(handle: number): RawRotation;
  /**
   * If this is a prismatic joint, returns its upper limit.
   */
  jointLimitsMax(handle: number, axis: RawJointAxis): number;
  /**
   * Return the lower limit along the given joint axis.
   */
  jointLimitsMin(handle: number, axis: RawJointAxis): number;
  /**
   * Enables and sets the joint limits
   */
  jointSetLimits(handle: number, axis: RawJointAxis, min: number, max: number): void;
  /**
   * Sets the position of the first local anchor
   */
  jointSetAnchor1(handle: number, newPos: RawVector): void;
  /**
   * Sets the position of the second local anchor
   */
  jointSetAnchor2(handle: number, newPos: RawVector): void;
  /**
   * The unique integer identifier of the first rigid-body this joint it attached to.
   */
  jointBodyHandle1(handle: number): number;
  /**
   * The unique integer identifier of the second rigid-body this joint is attached to.
   */
  jointBodyHandle2(handle: number): number;
  /**
   * Are the limits for this joint enabled?
   */
  jointLimitsEnabled(handle: number, axis: RawJointAxis): boolean;
  jointConfigureMotor(handle: number, axis: RawJointAxis, targetPos: number, targetVel: number, stiffness: number, damping: number): void;
  /**
   * Are contacts between the rigid-bodies attached by this joint enabled?
   */
  jointContactsEnabled(handle: number): boolean;
  /**
   * Sets whether contacts are enabled between the rigid-bodies attached by this joint.
   */
  jointSetContactsEnabled(handle: number, enabled: boolean): void;
  jointConfigureMotorModel(handle: number, axis: RawJointAxis, model: RawMotorModel): void;
  jointConfigureMotorPosition(handle: number, axis: RawJointAxis, targetPos: number, stiffness: number, damping: number): void;
  jointConfigureMotorVelocity(handle: number, axis: RawJointAxis, targetVel: number, factor: number): void;
  /**
   * The type of this joint.
   */
  jointType(handle: number): RawJointType;
  createJoint(params: RawGenericJoint, parent1: number, parent2: number, wake_up: boolean): number;
  /**
   * Applies the given JavaScript function to the integer handle of each joint managed by this physics world.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each joint managed by this set. Called as `f(collider)`.
   */
  forEachJointHandle(f: Function): void;
  /**
   * Applies the given JavaScript function to the integer handle of each joint attached to the given rigid-body.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each joint attached to the rigid-body. Called as `f(collider)`.
   */
  forEachJointAttachedToRigidBody(body: number, f: Function): void;
  len(): number;
  constructor();
  remove(handle: number, wakeUp: boolean): void;
  contains(handle: number): boolean;
}
export class RawIntegrationParameters {
  free(): void;
  constructor();
  lengthUnit: number;
  readonly contact_erp: number;
  minIslandSize: number;
  maxCcdSubsteps: number;
  numSolverIterations: number;
  numInternalPgsIterations: number;
  normalizedAllowedLinearError: number;
  normalizedPredictionDistance: number;
  set contact_natural_frequency(value: number);
  dt: number;
}
export class RawIslandManager {
  free(): void;
  /**
   * Applies the given JavaScript function to the integer handle of each active rigid-body
   * managed by this island manager.
   *
   * After a short time of inactivity, a rigid-body is automatically deactivated ("asleep") by
   * the physics engine in order to save computational power. A sleeping rigid-body never moves
   * unless it is moved manually by the user.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each active rigid-body managed by this
   *   set. Called as `f(collider)`.
   */
  forEachActiveRigidBodyHandle(f: Function): void;
  constructor();
}
export class RawKinematicCharacterController {
  free(): void;
  slideEnabled(): boolean;
  enableAutostep(maxHeight: number, minWidth: number, includeDynamicBodies: boolean): void;
  autostepEnabled(): boolean;
  disableAutostep(): void;
  setSlideEnabled(enabled: boolean): void;
  autostepMinWidth(): number | undefined;
  computedGrounded(): boolean;
  computedMovement(): RawVector;
  autostepMaxHeight(): number | undefined;
  computedCollision(i: number, collision: RawCharacterCollision): boolean;
  normalNudgeFactor(): number;
  enableSnapToGround(distance: number): void;
  maxSlopeClimbAngle(): number;
  minSlopeSlideAngle(): number;
  disableSnapToGround(): void;
  snapToGroundEnabled(): boolean;
  setNormalNudgeFactor(value: number): void;
  snapToGroundDistance(): number | undefined;
  numComputedCollisions(): number;
  setMaxSlopeClimbAngle(angle: number): void;
  setMinSlopeSlideAngle(angle: number): void;
  computeColliderMovement(dt: number, broad_phase: RawBroadPhase, narrow_phase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, collider_handle: number, desired_translation_delta: RawVector, apply_impulses_to_dynamic_bodies: boolean, character_mass: number | null | undefined, filter_flags: number, filter_groups: number | null | undefined, filter_predicate: Function): void;
  autostepIncludesDynamicBodies(): boolean | undefined;
  up(): RawVector;
  constructor(offset: number);
  setUp(vector: RawVector): void;
  offset(): number;
  setOffset(value: number): void;
}
export class RawMultibodyJointSet {
  free(): void;
  /**
   * The position of the first anchor of this joint.
   *
   * The first anchor gives the position of the points application point on the
   * local frame of the first rigid-body it is attached to.
   */
  jointAnchor1(handle: number): RawVector;
  /**
   * The position of the second anchor of this joint.
   *
   * The second anchor gives the position of the points application point on the
   * local frame of the second rigid-body it is attached to.
   */
  jointAnchor2(handle: number): RawVector;
  /**
   * The angular part of the joint’s local frame relative to the first rigid-body it is attached to.
   */
  jointFrameX1(handle: number): RawRotation;
  /**
   * The angular part of the joint’s local frame relative to the second rigid-body it is attached to.
   */
  jointFrameX2(handle: number): RawRotation;
  /**
   * If this is a prismatic joint, returns its upper limit.
   */
  jointLimitsMax(handle: number, axis: RawJointAxis): number;
  /**
   * Return the lower limit along the given joint axis.
   */
  jointLimitsMin(handle: number, axis: RawJointAxis): number;
  /**
   * Are the limits for this joint enabled?
   */
  jointLimitsEnabled(handle: number, axis: RawJointAxis): boolean;
  /**
   * Are contacts between the rigid-bodies attached by this joint enabled?
   */
  jointContactsEnabled(handle: number): boolean;
  /**
   * Sets whether contacts are enabled between the rigid-bodies attached by this joint.
   */
  jointSetContactsEnabled(handle: number, enabled: boolean): void;
  /**
   * The type of this joint.
   */
  jointType(handle: number): RawJointType;
  createJoint(params: RawGenericJoint, parent1: number, parent2: number, wakeUp: boolean): number;
  /**
   * Applies the given JavaScript function to the integer handle of each joint managed by this physics world.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each joint managed by this set. Called as `f(collider)`.
   */
  forEachJointHandle(f: Function): void;
  /**
   * Applies the given JavaScript function to the integer handle of each joint attached to the given rigid-body.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each joint attached to the rigid-body. Called as `f(collider)`.
   */
  forEachJointAttachedToRigidBody(body: number, f: Function): void;
  constructor();
  remove(handle: number, wakeUp: boolean): void;
  contains(handle: number): boolean;
}
export class RawNarrowPhase {
  free(): void;
  contact_pair(handle1: number, handle2: number): RawContactPair | undefined;
  intersection_pair(handle1: number, handle2: number): boolean;
  contact_pairs_with(handle1: number, f: Function): void;
  intersection_pairs_with(handle1: number, f: Function): void;
  constructor();
}
export class RawPhysicsPipeline {
  free(): void;
  timing_ccd(): number;
  timing_step(): number;
  timing_solver(): number;
  stepWithEvents(gravity: RawVector, integrationParameters: RawIntegrationParameters, islands: RawIslandManager, broadPhase: RawBroadPhase, narrowPhase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, joints: RawImpulseJointSet, articulations: RawMultibodyJointSet, ccd_solver: RawCCDSolver, eventQueue: RawEventQueue, hookObject: object, hookFilterContactPair: Function, hookFilterIntersectionPair: Function): void;
  timing_ccd_solver(): number;
  timing_broad_phase(): number;
  is_profiler_enabled(): boolean;
  timing_narrow_phase(): number;
  timing_user_changes(): number;
  set_profiler_enabled(enabled: boolean): void;
  timing_ccd_broad_phase(): number;
  timing_velocity_update(): number;
  timing_ccd_narrow_phase(): number;
  timing_velocity_assembly(): number;
  timing_velocity_writeback(): number;
  timing_ccd_toi_computation(): number;
  timing_collision_detection(): number;
  timing_island_construction(): number;
  timing_velocity_resolution(): number;
  constructor();
  step(gravity: RawVector, integrationParameters: RawIntegrationParameters, islands: RawIslandManager, broadPhase: RawBroadPhase, narrowPhase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, joints: RawImpulseJointSet, articulations: RawMultibodyJointSet, ccd_solver: RawCCDSolver): void;
}
export class RawPidController {
  free(): void;
  set_axes_mask(axes_mask: number): void;
  reset_integrals(): void;
  linear_correction(dt: number, bodies: RawRigidBodySet, rb_handle: number, target_translation: RawVector, target_linvel: RawVector): RawVector;
  angular_correction(dt: number, bodies: RawRigidBodySet, rb_handle: number, target_rotation: number, target_angvel: number): number;
  apply_linear_correction(dt: number, bodies: RawRigidBodySet, rb_handle: number, target_translation: RawVector, target_linvel: RawVector): void;
  apply_angular_correction(dt: number, bodies: RawRigidBodySet, rb_handle: number, target_rotation: number, target_angvel: number): void;
  constructor(kp: number, ki: number, kd: number, axes_mask: number);
  set_kd(kd: number, axes: number): void;
  set_ki(ki: number, axes: number): void;
  set_kp(kp: number, axes: number): void;
}
export class RawPointColliderProjection {
  private constructor();
  free(): void;
  featureType(): RawFeatureType;
  colliderHandle(): number;
  point(): RawVector;
  isInside(): boolean;
  featureId(): number | undefined;
}
export class RawPointProjection {
  private constructor();
  free(): void;
  point(): RawVector;
  isInside(): boolean;
}
export class RawRayColliderHit {
  private constructor();
  free(): void;
  timeOfImpact(): number;
  colliderHandle(): number;
}
export class RawRayColliderIntersection {
  private constructor();
  free(): void;
  featureType(): RawFeatureType;
  colliderHandle(): number;
  time_of_impact(): number;
  normal(): RawVector;
  featureId(): number | undefined;
}
export class RawRayIntersection {
  private constructor();
  free(): void;
  featureType(): RawFeatureType;
  time_of_impact(): number;
  normal(): RawVector;
  featureId(): number | undefined;
}
export class RawRigidBodySet {
  free(): void;
  /**
   * Adds a force at the center-of-mass of this rigid-body.
   *
   * # Parameters
   * - `force`: the world-space force to apply on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbAddForce(handle: number, force: RawVector, wakeUp: boolean): void;
  /**
   * The status of this rigid-body: fixed, dynamic, or kinematic.
   */
  rbBodyType(handle: number): RawRigidBodyType;
  /**
   * Retrieves the `i-th` collider attached to this rigid-body.
   *
   * # Parameters
   * - `at`: The index of the collider to retrieve. Must be a number in `[0, this.numColliders()[`.
   *         This index is **not** the same as the unique identifier of the collider.
   */
  rbCollider(handle: number, at: number): number;
  /**
   * Is the velocity of this rigid-body not zero?
   */
  rbIsMoving(handle: number): boolean;
  /**
   * The center of mass of a rigid-body expressed in its local-space.
   */
  rbLocalCom(handle: number): RawVector;
  /**
   * The world-space orientation of this rigid-body.
   */
  rbRotation(handle: number): RawRotation;
  /**
   * An arbitrary user-defined 32-bit integer
   */
  rbUserData(handle: number): number;
  /**
   * The world-space center of mass of the rigid-body.
   */
  rbWorldCom(handle: number): RawVector;
  /**
   * Adds a torque at the center-of-mass of this rigid-body.
   *
   * # Parameters
   * - `torque`: the torque to apply on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbAddTorque(handle: number, torque: number, wakeUp: boolean): void;
  rbEnableCcd(handle: number, enabled: boolean): void;
  /**
   * Is this rigid-body dynamic?
   */
  rbIsDynamic(handle: number): boolean;
  rbIsEnabled(handle: number): boolean;
  /**
   * Sets the angular velocity of this rigid-body.
   */
  rbSetAngvel(handle: number, angvel: number, wakeUp: boolean): void;
  /**
   * Sets the linear velocity of this rigid-body.
   */
  rbSetLinvel(handle: number, linvel: RawVector, wakeUp: boolean): void;
  /**
   * Retrieves the constant force(s) the user added to this rigid-body.
   * Returns zero if the rigid-body is not dynamic.
   */
  rbUserForce(handle: number): RawVector;
  /**
   * Is this rigid-body sleeping?
   */
  rbIsSleeping(handle: number): boolean;
  rbSetEnabled(handle: number, enabled: boolean): void;
  /**
   * Retrieves the constant torque(s) the user added to this rigid-body.
   * Returns zero if the rigid-body is not dynamic.
   */
  rbUserTorque(handle: number): number;
  /**
   * Is this rigid-body kinematic?
   */
  rbIsKinematic(handle: number): boolean;
  /**
   * Resets to zero all user-added forces added to this rigid-body.
   */
  rbResetForces(handle: number, wakeUp: boolean): void;
  /**
   * Set a new status for this rigid-body: fixed, dynamic, or kinematic.
   */
  rbSetBodyType(handle: number, status: RawRigidBodyType, wake_up: boolean): void;
  /**
   * Sets the rotation angle of this rigid-body.
   *
   * # Parameters
   * - `angle`: the rotation angle, in radians.
   * - `wakeUp`: forces the rigid-body to wake-up so it is properly affected by forces if it
   * wasn't moving before modifying its position.
   */
  rbSetRotation(handle: number, angle: number, wakeUp: boolean): void;
  /**
   * Sets the user-defined 32-bit integer of this rigid-body.
   *
   * # Parameters
   * - `data`: an arbitrary user-defined 32-bit integer.
   */
  rbSetUserData(handle: number, data: number): void;
  /**
   * The world-space translation of this rigid-body.
   */
  rbTranslation(handle: number): RawVector;
  /**
   * Applies an impulse at the center-of-mass of this rigid-body.
   *
   * # Parameters
   * - `impulse`: the world-space impulse to apply on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbApplyImpulse(handle: number, impulse: RawVector, wakeUp: boolean): void;
  rbGravityScale(handle: number): number;
  /**
   * Is Continuous Collision Detection enabled for this rigid-body?
   */
  rbIsCcdEnabled(handle: number): boolean;
  /**
   * The world-space predicted orientation of this rigid-body.
   *
   * If this rigid-body is kinematic this value is set by the `setNextKinematicRotation`
   * method and is used for estimating the kinematic body velocity at the next timestep.
   * For non-kinematic bodies, this value is currently unspecified.
   */
  rbNextRotation(handle: number): RawRotation;
  /**
   * The number of colliders attached to this rigid-body.
   */
  rbNumColliders(handle: number): number;
  /**
   * Resets to zero all user-added torques added to this rigid-body.
   */
  rbResetTorques(handle: number, wakeUp: boolean): void;
  /**
   * The linear damping coefficient of this rigid-body.
   */
  rbLinearDamping(handle: number): number;
  rbLockRotations(handle: number, locked: boolean, wake_up: boolean): void;
  /**
   * The angular damping coefficient of this rigid-body.
   */
  rbAngularDamping(handle: number): number;
  rbDominanceGroup(handle: number): number;
  /**
   * Sets the translation of this rigid-body.
   *
   * # Parameters
   * - `x`: the world-space position of the rigid-body along the `x` axis.
   * - `y`: the world-space position of the rigid-body along the `y` axis.
   * - `wakeUp`: forces the rigid-body to wake-up so it is properly affected by forces if it
   * wasn't moving before modifying its position.
   */
  rbSetTranslation(handle: number, x: number, y: number, wakeUp: boolean): void;
  /**
   * Adds a force at the given world-space point of this rigid-body.
   *
   * # Parameters
   * - `force`: the world-space force to apply on the rigid-body.
   * - `point`: the world-space point where the impulse is to be applied on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbAddForceAtPoint(handle: number, force: RawVector, point: RawVector, wakeUp: boolean): void;
  /**
   * The world-space predicted translation of this rigid-body.
   *
   * If this rigid-body is kinematic this value is set by the `setNextKinematicTranslation`
   * method and is used for estimating the kinematic body velocity at the next timestep.
   * For non-kinematic bodies, this value is currently unspecified.
   */
  rbNextTranslation(handle: number): RawVector;
  rbSetGravityScale(handle: number, factor: number, wakeUp: boolean): void;
  /**
   * The velocity of the given world-space point on this rigid-body.
   */
  rbVelocityAtPoint(handle: number, point: RawVector): RawVector;
  /**
   * The inverse mass taking into account translation locking.
   */
  rbEffectiveInvMass(handle: number): RawVector;
  rbLockTranslations(handle: number, locked: boolean, wake_up: boolean): void;
  /**
   * The angular inertia along the principal inertia axes of the rigid-body.
   */
  rbPrincipalInertia(handle: number): number;
  rbSetLinearDamping(handle: number, factor: number): void;
  rbSetAdditionalMass(handle: number, mass: number, wake_up: boolean): void;
  rbSetAngularDamping(handle: number, factor: number): void;
  rbSetDominanceGroup(handle: number, group: number): void;
  rbSoftCcdPrediction(handle: number): number;
  /**
   * Applies an impulsive torque at the center-of-mass of this rigid-body.
   *
   * # Parameters
   * - `torque impulse`: the torque impulse to apply on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbApplyTorqueImpulse(handle: number, torque_impulse: number, wakeUp: boolean): void;
  /**
   * Applies an impulse at the given world-space point of this rigid-body.
   *
   * # Parameters
   * - `impulse`: the world-space impulse to apply on the rigid-body.
   * - `point`: the world-space point where the impulse is to be applied on the rigid-body.
   * - `wakeUp`: should the rigid-body be automatically woken-up?
   */
  rbApplyImpulseAtPoint(handle: number, impulse: RawVector, point: RawVector, wakeUp: boolean): void;
  /**
   * The inverse of the principal angular inertia of the rigid-body.
   *
   * Components set to zero are assumed to be infinite along the corresponding principal axis.
   */
  rbInvPrincipalInertia(handle: number): number;
  rbSetSoftCcdPrediction(handle: number, prediction: number): void;
  rbSetEnabledTranslations(handle: number, allow_x: boolean, allow_y: boolean, wake_up: boolean): void;
  /**
   * The effective world-space angular inertia (that takes the potential rotation locking into account) of
   * this rigid-body.
   */
  rbEffectiveAngularInertia(handle: number): number;
  /**
   * The world-space inverse angular inertia tensor of the rigid-body,
   * taking into account rotation locking.
   */
  rbEffectiveWorldInvInertia(handle: number): number;
  /**
   * If this rigid body is kinematic, sets its future rotation after the next timestep integration.
   *
   * This should be used instead of `rigidBody.setRotation` to make the dynamic object
   * interacting with this kinematic body behave as expected. Internally, Rapier will compute
   * an artificial velocity for this rigid-body from its current position and its next kinematic
   * position. This velocity will be used to compute forces on dynamic bodies interacting with
   * this body.
   *
   * # Parameters
   * - `angle`: the rotation angle, in radians.
   */
  rbSetNextKinematicRotation(handle: number, angle: number): void;
  rbAdditionalSolverIterations(handle: number): number;
  rbSetAdditionalMassProperties(handle: number, mass: number, centerOfMass: RawVector, principalAngularInertia: number, wake_up: boolean): void;
  /**
   * If this rigid body is kinematic, sets its future translation after the next timestep integration.
   *
   * This should be used instead of `rigidBody.setTranslation` to make the dynamic object
   * interacting with this kinematic body behave as expected. Internally, Rapier will compute
   * an artificial velocity for this rigid-body from its current position and its next kinematic
   * position. This velocity will be used to compute forces on dynamic bodies interacting with
   * this body.
   *
   * # Parameters
   * - `x`: the world-space position of the rigid-body along the `x` axis.
   * - `y`: the world-space position of the rigid-body along the `y` axis.
   */
  rbSetNextKinematicTranslation(handle: number, x: number, y: number): void;
  rbSetAdditionalSolverIterations(handle: number, iters: number): void;
  rbRecomputeMassPropertiesFromColliders(handle: number, colliders: RawColliderSet): void;
  /**
   * The mass of this rigid-body.
   */
  rbMass(handle: number): number;
  /**
   * Put the given rigid-body to sleep.
   */
  rbSleep(handle: number): void;
  /**
   * The angular velocity of this rigid-body.
   */
  rbAngvel(handle: number): number;
  /**
   * The linear velocity of this rigid-body.
   */
  rbLinvel(handle: number): RawVector;
  /**
   * Wakes this rigid-body up.
   *
   * A dynamic rigid-body that does not move during several consecutive frames will
   * be put to sleep by the physics engine, i.e., it will stop being simulated in order
   * to avoid useless computations.
   * This method forces a sleeping rigid-body to wake-up. This is useful, e.g., before modifying
   * the position of a dynamic body so that it is properly simulated afterwards.
   */
  rbWakeUp(handle: number): void;
  /**
   * The inverse of the mass of a rigid-body.
   *
   * If this is zero, the rigid-body is assumed to have infinite mass.
   */
  rbInvMass(handle: number): number;
  /**
   * Is this rigid-body fixed?
   */
  rbIsFixed(handle: number): boolean;
  createRigidBody(enabled: boolean, translation: RawVector, rotation: RawRotation, gravityScale: number, mass: number, massOnly: boolean, centerOfMass: RawVector, linvel: RawVector, angvel: number, principalAngularInertia: number, translationEnabledX: boolean, translationEnabledY: boolean, rotationsEnabled: boolean, linearDamping: number, angularDamping: number, rb_type: RawRigidBodyType, canSleep: boolean, sleeping: boolean, softCcdPrediciton: number, ccdEnabled: boolean, dominanceGroup: number, additional_solver_iterations: number): number;
  /**
   * Applies the given JavaScript function to the integer handle of each rigid-body managed by this set.
   *
   * # Parameters
   * - `f(handle)`: the function to apply to the integer handle of each rigid-body managed by this set. Called as `f(collider)`.
   */
  forEachRigidBodyHandle(f: Function): void;
  /**
   * The number of rigid-bodies on this set.
   */
  len(): number;
  constructor();
  propagateModifiedBodyPositionsToColliders(colliders: RawColliderSet): void;
  remove(handle: number, islands: RawIslandManager, colliders: RawColliderSet, joints: RawImpulseJointSet, articulations: RawMultibodyJointSet): void;
  /**
   * Checks if a rigid-body with the given integer handle exists.
   */
  contains(handle: number): boolean;
}
/**
 * A rotation quaternion.
 */
export class RawRotation {
  private constructor();
  free(): void;
  /**
   * The identity rotation.
   */
  static identity(): RawRotation;
  /**
   * The rotation with thegiven angle.
   */
  static fromAngle(angle: number): RawRotation;
  /**
   * The imaginary part of this complex number.
   */
  readonly im: number;
  /**
   * The real part of this complex number.
   */
  readonly re: number;
  /**
   * The rotation angle in radians.
   */
  readonly angle: number;
}
export class RawSerializationPipeline {
  free(): void;
  serializeAll(gravity: RawVector, integrationParameters: RawIntegrationParameters, islands: RawIslandManager, broadPhase: RawBroadPhase, narrowPhase: RawNarrowPhase, bodies: RawRigidBodySet, colliders: RawColliderSet, impulse_joints: RawImpulseJointSet, multibody_joints: RawMultibodyJointSet): Uint8Array | undefined;
  deserializeAll(data: Uint8Array): RawDeserializedWorld | undefined;
  constructor();
}
export class RawShape {
  private constructor();
  free(): void;
  static convexHull(points: Float32Array): RawShape | undefined;
  static heightfield(heights: Float32Array, scale: RawVector): RawShape;
  static roundCuboid(hx: number, hy: number, borderRadius: number): RawShape;
  contactShape(shapePos1: RawVector, shapeRot1: RawRotation, shape2: RawShape, shapePos2: RawVector, shapeRot2: RawRotation, prediction: number): RawShapeContact | undefined;
  projectPoint(shapePos: RawVector, shapeRot: RawRotation, point: RawVector, solid: boolean): RawPointProjection;
  containsPoint(shapePos: RawVector, shapeRot: RawRotation, point: RawVector): boolean;
  intersectsRay(shapePos: RawVector, shapeRot: RawRotation, rayOrig: RawVector, rayDir: RawVector, maxToi: number): boolean;
  static roundTriangle(p1: RawVector, p2: RawVector, p3: RawVector, borderRadius: number): RawShape;
  static convexPolyline(vertices: Float32Array): RawShape | undefined;
  intersectsShape(shapePos1: RawVector, shapeRot1: RawRotation, shape2: RawShape, shapePos2: RawVector, shapeRot2: RawRotation): boolean;
  static roundConvexHull(points: Float32Array, borderRadius: number): RawShape | undefined;
  static voxelsFromPoints(voxel_size: RawVector, points: Float32Array): RawShape;
  castRayAndGetNormal(shapePos: RawVector, shapeRot: RawRotation, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean): RawRayIntersection | undefined;
  static roundConvexPolyline(vertices: Float32Array, borderRadius: number): RawShape | undefined;
  static ball(radius: number): RawShape;
  static cuboid(hx: number, hy: number): RawShape;
  static voxels(voxel_size: RawVector, grid_coords: Int32Array): RawShape;
  static capsule(halfHeight: number, radius: number): RawShape;
  castRay(shapePos: RawVector, shapeRot: RawRotation, rayOrig: RawVector, rayDir: RawVector, maxToi: number, solid: boolean): number;
  static segment(p1: RawVector, p2: RawVector): RawShape;
  static trimesh(vertices: Float32Array, indices: Uint32Array, flags: number): RawShape | undefined;
  static polyline(vertices: Float32Array, indices: Uint32Array): RawShape;
  static triangle(p1: RawVector, p2: RawVector, p3: RawVector): RawShape;
  castShape(shapePos1: RawVector, shapeRot1: RawRotation, shapeVel1: RawVector, shape2: RawShape, shapePos2: RawVector, shapeRot2: RawRotation, shapeVel2: RawVector, target_distance: number, maxToi: number, stop_at_penetration: boolean): RawShapeCastHit | undefined;
  static halfspace(normal: RawVector): RawShape;
}
export class RawShapeCastHit {
  private constructor();
  free(): void;
  time_of_impact(): number;
  normal1(): RawVector;
  normal2(): RawVector;
  witness1(): RawVector;
  witness2(): RawVector;
}
export class RawShapeContact {
  private constructor();
  free(): void;
  point1(): RawVector;
  point2(): RawVector;
  normal1(): RawVector;
  normal2(): RawVector;
  distance(): number;
}
/**
 * A vector.
 */
export class RawVector {
  free(): void;
  /**
   * Create a new 2D vector from this vector with its components rearranged as `{x, y}`.
   */
  xy(): RawVector;
  /**
   * Create a new 2D vector from this vector with its components rearranged as `{y, x}`.
   */
  yx(): RawVector;
  /**
   * Creates a new 2D vector from its two components.
   *
   * # Parameters
   * - `x`: the `x` component of this 2D vector.
   * - `y`: the `y` component of this 2D vector.
   */
  constructor(x: number, y: number);
  /**
   * Creates a new vector filled with zeros.
   */
  static zero(): RawVector;
  /**
   * The `x` component of this vector.
   */
  x: number;
  /**
   * The `y` component of this vector.
   */
  y: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_rawbroadphase_free: (a: number, b: number) => void;
  readonly __wbg_rawccdsolver_free: (a: number, b: number) => void;
  readonly __wbg_rawcharactercollision_free: (a: number, b: number) => void;
  readonly __wbg_rawcolliderset_free: (a: number, b: number) => void;
  readonly __wbg_rawcollidershapecasthit_free: (a: number, b: number) => void;
  readonly __wbg_rawcontactforceevent_free: (a: number, b: number) => void;
  readonly __wbg_rawcontactmanifold_free: (a: number, b: number) => void;
  readonly __wbg_rawdebugrenderpipeline_free: (a: number, b: number) => void;
  readonly __wbg_rawdeserializedworld_free: (a: number, b: number) => void;
  readonly __wbg_raweventqueue_free: (a: number, b: number) => void;
  readonly __wbg_rawgenericjoint_free: (a: number, b: number) => void;
  readonly __wbg_rawimpulsejointset_free: (a: number, b: number) => void;
  readonly __wbg_rawintegrationparameters_free: (a: number, b: number) => void;
  readonly __wbg_rawislandmanager_free: (a: number, b: number) => void;
  readonly __wbg_rawkinematiccharactercontroller_free: (a: number, b: number) => void;
  readonly __wbg_rawmultibodyjointset_free: (a: number, b: number) => void;
  readonly __wbg_rawnarrowphase_free: (a: number, b: number) => void;
  readonly __wbg_rawphysicspipeline_free: (a: number, b: number) => void;
  readonly __wbg_rawpidcontroller_free: (a: number, b: number) => void;
  readonly __wbg_rawpointcolliderprojection_free: (a: number, b: number) => void;
  readonly __wbg_rawpointprojection_free: (a: number, b: number) => void;
  readonly __wbg_rawrayintersection_free: (a: number, b: number) => void;
  readonly __wbg_rawrigidbodyset_free: (a: number, b: number) => void;
  readonly __wbg_rawrotation_free: (a: number, b: number) => void;
  readonly __wbg_rawshape_free: (a: number, b: number) => void;
  readonly __wbg_rawshapecontact_free: (a: number, b: number) => void;
  readonly __wbg_rawvector_free: (a: number, b: number) => void;
  readonly rawbroadphase_castRay: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => number;
  readonly rawbroadphase_castRayAndGetNormal: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => number;
  readonly rawbroadphase_castShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number) => number;
  readonly rawbroadphase_collidersWithAabbIntersectingAabb: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly rawbroadphase_intersectionWithShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => void;
  readonly rawbroadphase_intersectionsWithPoint: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
  readonly rawbroadphase_intersectionsWithRay: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number) => void;
  readonly rawbroadphase_intersectionsWithShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => void;
  readonly rawbroadphase_new: () => number;
  readonly rawbroadphase_projectPoint: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => number;
  readonly rawbroadphase_projectPointAndGetFeature: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => number;
  readonly rawcharactercollision_handle: (a: number) => number;
  readonly rawcharactercollision_new: () => number;
  readonly rawcharactercollision_toi: (a: number) => number;
  readonly rawcharactercollision_translationDeltaApplied: (a: number) => number;
  readonly rawcharactercollision_translationDeltaRemaining: (a: number) => number;
  readonly rawcharactercollision_worldNormal1: (a: number) => number;
  readonly rawcharactercollision_worldNormal2: (a: number) => number;
  readonly rawcharactercollision_worldWitness1: (a: number) => number;
  readonly rawcharactercollision_worldWitness2: (a: number) => number;
  readonly rawcolliderset_coActiveCollisionTypes: (a: number, b: number) => number;
  readonly rawcolliderset_coActiveEvents: (a: number, b: number) => number;
  readonly rawcolliderset_coActiveHooks: (a: number, b: number) => number;
  readonly rawcolliderset_coCastCollider: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly rawcolliderset_coCastRay: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawcolliderset_coCastRayAndGetNormal: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawcolliderset_coCastShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => number;
  readonly rawcolliderset_coCollisionGroups: (a: number, b: number) => number;
  readonly rawcolliderset_coCombineVoxelStates: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawcolliderset_coContactCollider: (a: number, b: number, c: number, d: number) => number;
  readonly rawcolliderset_coContactForceEventThreshold: (a: number, b: number) => number;
  readonly rawcolliderset_coContactShape: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawcolliderset_coContactSkin: (a: number, b: number) => number;
  readonly rawcolliderset_coContainsPoint: (a: number, b: number, c: number) => number;
  readonly rawcolliderset_coDensity: (a: number, b: number) => number;
  readonly rawcolliderset_coFriction: (a: number, b: number) => number;
  readonly rawcolliderset_coFrictionCombineRule: (a: number, b: number) => number;
  readonly rawcolliderset_coHalfExtents: (a: number, b: number) => number;
  readonly rawcolliderset_coHalfHeight: (a: number, b: number) => number;
  readonly rawcolliderset_coHalfspaceNormal: (a: number, b: number) => number;
  readonly rawcolliderset_coHeightfieldHeights: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coHeightfieldScale: (a: number, b: number) => number;
  readonly rawcolliderset_coIndices: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coIntersectsRay: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawcolliderset_coIntersectsShape: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawcolliderset_coIsEnabled: (a: number, b: number) => number;
  readonly rawcolliderset_coIsSensor: (a: number, b: number) => number;
  readonly rawcolliderset_coMass: (a: number, b: number) => number;
  readonly rawcolliderset_coParent: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coProjectPoint: (a: number, b: number, c: number, d: number) => number;
  readonly rawcolliderset_coPropagateVoxelChange: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly rawcolliderset_coRadius: (a: number, b: number) => number;
  readonly rawcolliderset_coRestitution: (a: number, b: number) => number;
  readonly rawcolliderset_coRestitutionCombineRule: (a: number, b: number) => number;
  readonly rawcolliderset_coRotation: (a: number, b: number) => number;
  readonly rawcolliderset_coRotationWrtParent: (a: number, b: number) => number;
  readonly rawcolliderset_coRoundRadius: (a: number, b: number) => number;
  readonly rawcolliderset_coSetActiveCollisionTypes: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetActiveEvents: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetActiveHooks: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetCollisionGroups: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetContactForceEventThreshold: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetContactSkin: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetDensity: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetEnabled: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetFriction: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetFrictionCombineRule: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetHalfExtents: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetHalfHeight: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetMass: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetMassProperties: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawcolliderset_coSetRadius: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetRestitution: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetRestitutionCombineRule: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetRotation: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetRotationWrtParent: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetRoundRadius: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetSensor: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetShape: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetSolverGroups: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coSetTranslation: (a: number, b: number, c: number, d: number) => void;
  readonly rawcolliderset_coSetTranslationWrtParent: (a: number, b: number, c: number, d: number) => void;
  readonly rawcolliderset_coSetVoxel: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawcolliderset_coShapeType: (a: number, b: number) => number;
  readonly rawcolliderset_coSolverGroups: (a: number, b: number) => number;
  readonly rawcolliderset_coTranslation: (a: number, b: number) => number;
  readonly rawcolliderset_coTranslationWrtParent: (a: number, b: number) => number;
  readonly rawcolliderset_coTriMeshFlags: (a: number, b: number) => number;
  readonly rawcolliderset_coVertices: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coVolume: (a: number, b: number) => number;
  readonly rawcolliderset_coVoxelData: (a: number, b: number, c: number) => void;
  readonly rawcolliderset_coVoxelSize: (a: number, b: number) => number;
  readonly rawcolliderset_contains: (a: number, b: number) => number;
  readonly rawcolliderset_createCollider: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number, u: number, v: number, w: number, x: number, y: number, z: number) => void;
  readonly rawcolliderset_forEachColliderHandle: (a: number, b: number) => void;
  readonly rawcolliderset_len: (a: number) => number;
  readonly rawcolliderset_new: () => number;
  readonly rawcolliderset_remove: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawcollidershapecasthit_colliderHandle: (a: number) => number;
  readonly rawcollidershapecasthit_normal1: (a: number) => number;
  readonly rawcollidershapecasthit_normal2: (a: number) => number;
  readonly rawcollidershapecasthit_time_of_impact: (a: number) => number;
  readonly rawcollidershapecasthit_witness1: (a: number) => number;
  readonly rawcollidershapecasthit_witness2: (a: number) => number;
  readonly rawcontactforceevent_collider2: (a: number) => number;
  readonly rawcontactforceevent_max_force_magnitude: (a: number) => number;
  readonly rawcontactforceevent_total_force: (a: number) => number;
  readonly rawcontactforceevent_total_force_magnitude: (a: number) => number;
  readonly rawcontactmanifold_contact_dist: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_fid1: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_fid2: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_impulse: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_local_p1: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_local_p2: (a: number, b: number) => number;
  readonly rawcontactmanifold_contact_tangent_impulse: (a: number, b: number) => number;
  readonly rawcontactmanifold_local_n1: (a: number) => number;
  readonly rawcontactmanifold_local_n2: (a: number) => number;
  readonly rawcontactmanifold_normal: (a: number) => number;
  readonly rawcontactmanifold_num_contacts: (a: number) => number;
  readonly rawcontactmanifold_num_solver_contacts: (a: number) => number;
  readonly rawcontactmanifold_solver_contact_dist: (a: number, b: number) => number;
  readonly rawcontactmanifold_solver_contact_friction: (a: number, b: number) => number;
  readonly rawcontactmanifold_solver_contact_point: (a: number, b: number) => number;
  readonly rawcontactmanifold_solver_contact_restitution: (a: number, b: number) => number;
  readonly rawcontactmanifold_solver_contact_tangent_velocity: (a: number, b: number) => number;
  readonly rawcontactmanifold_subshape1: (a: number) => number;
  readonly rawcontactmanifold_subshape2: (a: number) => number;
  readonly rawcontactpair_collider1: (a: number) => number;
  readonly rawcontactpair_collider2: (a: number) => number;
  readonly rawcontactpair_contactManifold: (a: number, b: number) => number;
  readonly rawcontactpair_numContactManifolds: (a: number) => number;
  readonly rawdebugrenderpipeline_colors: (a: number) => number;
  readonly rawdebugrenderpipeline_new: () => number;
  readonly rawdebugrenderpipeline_render: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly rawdebugrenderpipeline_vertices: (a: number) => number;
  readonly rawdeserializedworld_takeBodies: (a: number) => number;
  readonly rawdeserializedworld_takeBroadPhase: (a: number) => number;
  readonly rawdeserializedworld_takeColliders: (a: number) => number;
  readonly rawdeserializedworld_takeGravity: (a: number) => number;
  readonly rawdeserializedworld_takeImpulseJoints: (a: number) => number;
  readonly rawdeserializedworld_takeIntegrationParameters: (a: number) => number;
  readonly rawdeserializedworld_takeIslandManager: (a: number) => number;
  readonly rawdeserializedworld_takeMultibodyJoints: (a: number) => number;
  readonly rawdeserializedworld_takeNarrowPhase: (a: number) => number;
  readonly raweventqueue_clear: (a: number) => void;
  readonly raweventqueue_drainCollisionEvents: (a: number, b: number) => void;
  readonly raweventqueue_drainContactForceEvents: (a: number, b: number) => void;
  readonly raweventqueue_new: (a: number) => number;
  readonly rawgenericjoint_fixed: (a: number, b: number, c: number, d: number) => number;
  readonly rawgenericjoint_prismatic: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawgenericjoint_revolute: (a: number, b: number) => number;
  readonly rawgenericjoint_rope: (a: number, b: number, c: number) => number;
  readonly rawgenericjoint_spring: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawimpulsejointset_contains: (a: number, b: number) => number;
  readonly rawimpulsejointset_createJoint: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawimpulsejointset_forEachJointAttachedToRigidBody: (a: number, b: number, c: number) => void;
  readonly rawimpulsejointset_forEachJointHandle: (a: number, b: number) => void;
  readonly rawimpulsejointset_jointAnchor1: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointAnchor2: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointBodyHandle1: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointBodyHandle2: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointConfigureMotor: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly rawimpulsejointset_jointConfigureMotorModel: (a: number, b: number, c: number, d: number) => void;
  readonly rawimpulsejointset_jointConfigureMotorPosition: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawimpulsejointset_jointConfigureMotorVelocity: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawimpulsejointset_jointContactsEnabled: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointFrameX1: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointFrameX2: (a: number, b: number) => number;
  readonly rawimpulsejointset_jointLimitsEnabled: (a: number, b: number, c: number) => number;
  readonly rawimpulsejointset_jointLimitsMax: (a: number, b: number, c: number) => number;
  readonly rawimpulsejointset_jointLimitsMin: (a: number, b: number, c: number) => number;
  readonly rawimpulsejointset_jointSetAnchor1: (a: number, b: number, c: number) => void;
  readonly rawimpulsejointset_jointSetAnchor2: (a: number, b: number, c: number) => void;
  readonly rawimpulsejointset_jointSetContactsEnabled: (a: number, b: number, c: number) => void;
  readonly rawimpulsejointset_jointSetLimits: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawimpulsejointset_jointType: (a: number, b: number) => number;
  readonly rawimpulsejointset_len: (a: number) => number;
  readonly rawimpulsejointset_new: () => number;
  readonly rawimpulsejointset_remove: (a: number, b: number, c: number) => void;
  readonly rawintegrationparameters_contact_erp: (a: number) => number;
  readonly rawintegrationparameters_dt: (a: number) => number;
  readonly rawintegrationparameters_lengthUnit: (a: number) => number;
  readonly rawintegrationparameters_maxCcdSubsteps: (a: number) => number;
  readonly rawintegrationparameters_minIslandSize: (a: number) => number;
  readonly rawintegrationparameters_new: () => number;
  readonly rawintegrationparameters_numInternalPgsIterations: (a: number) => number;
  readonly rawintegrationparameters_numSolverIterations: (a: number) => number;
  readonly rawintegrationparameters_set_contact_natural_frequency: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_dt: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_lengthUnit: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_maxCcdSubsteps: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_minIslandSize: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_normalizedAllowedLinearError: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_normalizedPredictionDistance: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_numInternalPgsIterations: (a: number, b: number) => void;
  readonly rawintegrationparameters_set_numSolverIterations: (a: number, b: number) => void;
  readonly rawislandmanager_forEachActiveRigidBodyHandle: (a: number, b: number) => void;
  readonly rawislandmanager_new: () => number;
  readonly rawkinematiccharactercontroller_autostepEnabled: (a: number) => number;
  readonly rawkinematiccharactercontroller_autostepIncludesDynamicBodies: (a: number) => number;
  readonly rawkinematiccharactercontroller_autostepMaxHeight: (a: number) => number;
  readonly rawkinematiccharactercontroller_autostepMinWidth: (a: number) => number;
  readonly rawkinematiccharactercontroller_computeColliderMovement: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
  readonly rawkinematiccharactercontroller_computedCollision: (a: number, b: number, c: number) => number;
  readonly rawkinematiccharactercontroller_computedGrounded: (a: number) => number;
  readonly rawkinematiccharactercontroller_computedMovement: (a: number) => number;
  readonly rawkinematiccharactercontroller_disableAutostep: (a: number) => void;
  readonly rawkinematiccharactercontroller_disableSnapToGround: (a: number) => void;
  readonly rawkinematiccharactercontroller_enableAutostep: (a: number, b: number, c: number, d: number) => void;
  readonly rawkinematiccharactercontroller_enableSnapToGround: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_maxSlopeClimbAngle: (a: number) => number;
  readonly rawkinematiccharactercontroller_minSlopeSlideAngle: (a: number) => number;
  readonly rawkinematiccharactercontroller_new: (a: number) => number;
  readonly rawkinematiccharactercontroller_normalNudgeFactor: (a: number) => number;
  readonly rawkinematiccharactercontroller_numComputedCollisions: (a: number) => number;
  readonly rawkinematiccharactercontroller_offset: (a: number) => number;
  readonly rawkinematiccharactercontroller_setMaxSlopeClimbAngle: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_setMinSlopeSlideAngle: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_setNormalNudgeFactor: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_setOffset: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_setSlideEnabled: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_setUp: (a: number, b: number) => void;
  readonly rawkinematiccharactercontroller_slideEnabled: (a: number) => number;
  readonly rawkinematiccharactercontroller_snapToGroundDistance: (a: number) => number;
  readonly rawkinematiccharactercontroller_snapToGroundEnabled: (a: number) => number;
  readonly rawmultibodyjointset_contains: (a: number, b: number) => number;
  readonly rawmultibodyjointset_createJoint: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawmultibodyjointset_forEachJointAttachedToRigidBody: (a: number, b: number, c: number) => void;
  readonly rawmultibodyjointset_forEachJointHandle: (a: number, b: number) => void;
  readonly rawmultibodyjointset_jointAnchor1: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointAnchor2: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointContactsEnabled: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointFrameX1: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointFrameX2: (a: number, b: number) => number;
  readonly rawmultibodyjointset_jointLimitsEnabled: (a: number, b: number, c: number) => number;
  readonly rawmultibodyjointset_jointLimitsMax: (a: number, b: number, c: number) => number;
  readonly rawmultibodyjointset_jointLimitsMin: (a: number, b: number, c: number) => number;
  readonly rawmultibodyjointset_jointSetContactsEnabled: (a: number, b: number, c: number) => void;
  readonly rawmultibodyjointset_jointType: (a: number, b: number) => number;
  readonly rawmultibodyjointset_new: () => number;
  readonly rawmultibodyjointset_remove: (a: number, b: number, c: number) => void;
  readonly rawnarrowphase_contact_pair: (a: number, b: number, c: number) => number;
  readonly rawnarrowphase_contact_pairs_with: (a: number, b: number, c: number) => void;
  readonly rawnarrowphase_intersection_pair: (a: number, b: number, c: number) => number;
  readonly rawnarrowphase_intersection_pairs_with: (a: number, b: number, c: number) => void;
  readonly rawnarrowphase_new: () => number;
  readonly rawphysicspipeline_is_profiler_enabled: (a: number) => number;
  readonly rawphysicspipeline_new: () => number;
  readonly rawphysicspipeline_set_profiler_enabled: (a: number, b: number) => void;
  readonly rawphysicspipeline_step: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly rawphysicspipeline_stepWithEvents: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => void;
  readonly rawphysicspipeline_timing_broad_phase: (a: number) => number;
  readonly rawphysicspipeline_timing_ccd: (a: number) => number;
  readonly rawphysicspipeline_timing_ccd_broad_phase: (a: number) => number;
  readonly rawphysicspipeline_timing_ccd_narrow_phase: (a: number) => number;
  readonly rawphysicspipeline_timing_ccd_solver: (a: number) => number;
  readonly rawphysicspipeline_timing_ccd_toi_computation: (a: number) => number;
  readonly rawphysicspipeline_timing_collision_detection: (a: number) => number;
  readonly rawphysicspipeline_timing_island_construction: (a: number) => number;
  readonly rawphysicspipeline_timing_narrow_phase: (a: number) => number;
  readonly rawphysicspipeline_timing_solver: (a: number) => number;
  readonly rawphysicspipeline_timing_step: (a: number) => number;
  readonly rawphysicspipeline_timing_user_changes: (a: number) => number;
  readonly rawphysicspipeline_timing_velocity_assembly: (a: number) => number;
  readonly rawphysicspipeline_timing_velocity_resolution: (a: number) => number;
  readonly rawphysicspipeline_timing_velocity_update: (a: number) => number;
  readonly rawphysicspipeline_timing_velocity_writeback: (a: number) => number;
  readonly rawpidcontroller_angular_correction: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawpidcontroller_apply_angular_correction: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawpidcontroller_apply_linear_correction: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawpidcontroller_linear_correction: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawpidcontroller_new: (a: number, b: number, c: number, d: number) => number;
  readonly rawpidcontroller_reset_integrals: (a: number) => void;
  readonly rawpidcontroller_set_axes_mask: (a: number, b: number) => void;
  readonly rawpidcontroller_set_kd: (a: number, b: number, c: number) => void;
  readonly rawpidcontroller_set_ki: (a: number, b: number, c: number) => void;
  readonly rawpidcontroller_set_kp: (a: number, b: number, c: number) => void;
  readonly rawpointcolliderprojection_colliderHandle: (a: number) => number;
  readonly rawpointcolliderprojection_featureId: (a: number) => number;
  readonly rawpointcolliderprojection_featureType: (a: number) => number;
  readonly rawpointcolliderprojection_isInside: (a: number) => number;
  readonly rawpointcolliderprojection_point: (a: number) => number;
  readonly rawpointprojection_isInside: (a: number) => number;
  readonly rawpointprojection_point: (a: number) => number;
  readonly rawrigidbodyset_contains: (a: number, b: number) => number;
  readonly rawrigidbodyset_createRigidBody: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number, u: number, v: number, w: number) => number;
  readonly rawrigidbodyset_forEachRigidBodyHandle: (a: number, b: number) => void;
  readonly rawrigidbodyset_len: (a: number) => number;
  readonly rawrigidbodyset_new: () => number;
  readonly rawrigidbodyset_propagateModifiedBodyPositionsToColliders: (a: number, b: number) => void;
  readonly rawrigidbodyset_rbAddForce: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbAddForceAtPoint: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawrigidbodyset_rbAddTorque: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbAdditionalSolverIterations: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbAngularDamping: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbAngvel: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbApplyImpulse: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbApplyImpulseAtPoint: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawrigidbodyset_rbApplyTorqueImpulse: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbBodyType: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbCollider: (a: number, b: number, c: number) => number;
  readonly rawrigidbodyset_rbDominanceGroup: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbEffectiveAngularInertia: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbEffectiveInvMass: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbEffectiveWorldInvInertia: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbEnableCcd: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbGravityScale: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbInvMass: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbInvPrincipalInertia: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbIsCcdEnabled: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbIsDynamic: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbIsEnabled: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbIsFixed: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbIsKinematic: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbIsMoving: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbIsSleeping: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbLinearDamping: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbLinvel: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbLocalCom: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbLockRotations: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbLockTranslations: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbMass: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbNextRotation: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbNextTranslation: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbNumColliders: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbPrincipalInertia: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbRecomputeMassPropertiesFromColliders: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbResetForces: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbResetTorques: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbRotation: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbSetAdditionalMass: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetAdditionalMassProperties: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawrigidbodyset_rbSetAdditionalSolverIterations: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetAngularDamping: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetAngvel: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetBodyType: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetDominanceGroup: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetEnabled: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetEnabledTranslations: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawrigidbodyset_rbSetGravityScale: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetLinearDamping: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetLinvel: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetNextKinematicRotation: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetNextKinematicTranslation: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetRotation: (a: number, b: number, c: number, d: number) => void;
  readonly rawrigidbodyset_rbSetSoftCcdPrediction: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSetTranslation: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rawrigidbodyset_rbSetUserData: (a: number, b: number, c: number) => void;
  readonly rawrigidbodyset_rbSleep: (a: number, b: number) => void;
  readonly rawrigidbodyset_rbSoftCcdPrediction: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbTranslation: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbUserData: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbUserForce: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbUserTorque: (a: number, b: number) => number;
  readonly rawrigidbodyset_rbVelocityAtPoint: (a: number, b: number, c: number) => number;
  readonly rawrigidbodyset_rbWakeUp: (a: number, b: number) => void;
  readonly rawrigidbodyset_rbWorldCom: (a: number, b: number) => number;
  readonly rawrigidbodyset_remove: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rawrotation_angle: (a: number) => number;
  readonly rawrotation_fromAngle: (a: number) => number;
  readonly rawrotation_identity: () => number;
  readonly rawserializationpipeline_deserializeAll: (a: number, b: number) => number;
  readonly rawserializationpipeline_serializeAll: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => number;
  readonly rawshape_ball: (a: number) => number;
  readonly rawshape_capsule: (a: number, b: number) => number;
  readonly rawshape_castRay: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly rawshape_castRayAndGetNormal: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly rawshape_castShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => number;
  readonly rawshape_contactShape: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly rawshape_containsPoint: (a: number, b: number, c: number, d: number) => number;
  readonly rawshape_convexHull: (a: number, b: number) => number;
  readonly rawshape_convexPolyline: (a: number, b: number) => number;
  readonly rawshape_cuboid: (a: number, b: number) => number;
  readonly rawshape_halfspace: (a: number) => number;
  readonly rawshape_heightfield: (a: number, b: number, c: number) => number;
  readonly rawshape_intersectsRay: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawshape_intersectsShape: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly rawshape_polyline: (a: number, b: number, c: number, d: number) => number;
  readonly rawshape_projectPoint: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawshape_roundConvexHull: (a: number, b: number, c: number) => number;
  readonly rawshape_roundConvexPolyline: (a: number, b: number, c: number) => number;
  readonly rawshape_roundCuboid: (a: number, b: number, c: number) => number;
  readonly rawshape_roundTriangle: (a: number, b: number, c: number, d: number) => number;
  readonly rawshape_segment: (a: number, b: number) => number;
  readonly rawshape_triangle: (a: number, b: number, c: number) => number;
  readonly rawshape_trimesh: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly rawshape_voxels: (a: number, b: number, c: number) => number;
  readonly rawshape_voxelsFromPoints: (a: number, b: number, c: number) => number;
  readonly rawshapecasthit_witness1: (a: number) => number;
  readonly rawvector_new: (a: number, b: number) => number;
  readonly rawvector_set_y: (a: number, b: number) => void;
  readonly rawvector_xy: (a: number) => number;
  readonly rawvector_yx: (a: number) => number;
  readonly rawvector_zero: () => number;
  readonly version: (a: number) => void;
  readonly rawcolliderset_isHandleValid: (a: number, b: number) => number;
  readonly rawvector_set_x: (a: number, b: number) => void;
  readonly reserve_memory: (a: number) => void;
  readonly rawraycolliderintersection_featureId: (a: number) => number;
  readonly rawrayintersection_featureId: (a: number) => number;
  readonly rawcontactforceevent_collider1: (a: number) => number;
  readonly rawintegrationparameters_normalizedAllowedLinearError: (a: number) => number;
  readonly rawintegrationparameters_normalizedPredictionDistance: (a: number) => number;
  readonly rawraycolliderhit_colliderHandle: (a: number) => number;
  readonly rawraycolliderhit_timeOfImpact: (a: number) => number;
  readonly rawraycolliderintersection_colliderHandle: (a: number) => number;
  readonly rawraycolliderintersection_featureType: (a: number) => number;
  readonly rawraycolliderintersection_time_of_impact: (a: number) => number;
  readonly rawrayintersection_featureType: (a: number) => number;
  readonly rawrayintersection_time_of_impact: (a: number) => number;
  readonly rawrotation_im: (a: number) => number;
  readonly rawrotation_re: (a: number) => number;
  readonly rawshapecasthit_time_of_impact: (a: number) => number;
  readonly rawshapecontact_distance: (a: number) => number;
  readonly rawvector_x: (a: number) => number;
  readonly rawvector_y: (a: number) => number;
  readonly __wbg_rawcontactpair_free: (a: number, b: number) => void;
  readonly __wbg_rawraycolliderhit_free: (a: number, b: number) => void;
  readonly __wbg_rawraycolliderintersection_free: (a: number, b: number) => void;
  readonly __wbg_rawserializationpipeline_free: (a: number, b: number) => void;
  readonly __wbg_rawshapecasthit_free: (a: number, b: number) => void;
  readonly rawcontactforceevent_max_force_direction: (a: number) => number;
  readonly rawkinematiccharactercontroller_up: (a: number) => number;
  readonly rawraycolliderintersection_normal: (a: number) => number;
  readonly rawrayintersection_normal: (a: number) => number;
  readonly rawshapecasthit_normal1: (a: number) => number;
  readonly rawshapecasthit_normal2: (a: number) => number;
  readonly rawshapecasthit_witness2: (a: number) => number;
  readonly rawshapecontact_normal1: (a: number) => number;
  readonly rawshapecontact_normal2: (a: number) => number;
  readonly rawshapecontact_point1: (a: number) => number;
  readonly rawshapecontact_point2: (a: number) => number;
  readonly rawccdsolver_new: () => number;
  readonly rawserializationpipeline_new: () => number;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_1: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_2: (a: number, b: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
