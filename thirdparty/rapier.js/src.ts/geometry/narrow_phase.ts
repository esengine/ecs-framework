import {RawNarrowPhase, RawContactManifold} from "../raw";
import {ColliderHandle} from "./collider";
import {Vector, VectorOps} from "../math";

/**
 * The narrow-phase used for precise collision-detection.
 *
 * To avoid leaking WASM resources, this MUST be freed manually with `narrowPhase.free()`
 * once you are done using it.
 */
export class NarrowPhase {
    raw: RawNarrowPhase;
    tempManifold: TempContactManifold;

    /**
     * Release the WASM memory occupied by this narrow-phase.
     */
    public free() {
        if (!!this.raw) {
            this.raw.free();
        }
        this.raw = undefined;
    }

    constructor(raw?: RawNarrowPhase) {
        this.raw = raw || new RawNarrowPhase();
        this.tempManifold = new TempContactManifold(null);
    }

    /**
     * Enumerates all the colliders potentially in contact with the given collider.
     *
     * @param collider1 - The second collider involved in the contact.
     * @param f - Closure that will be called on each collider that is in contact with `collider1`.
     */
    public contactPairsWith(
        collider1: ColliderHandle,
        f: (collider2: ColliderHandle) => void,
    ) {
        this.raw.contact_pairs_with(collider1, f);
    }

    /**
     * Enumerates all the colliders intersecting the given colliders, assuming one of them
     * is a sensor.
     */
    public intersectionPairsWith(
        collider1: ColliderHandle,
        f: (collider2: ColliderHandle) => void,
    ) {
        this.raw.intersection_pairs_with(collider1, f);
    }

    /**
     * Iterates through all the contact manifolds between the given pair of colliders.
     *
     * @param collider1 - The first collider involved in the contact.
     * @param collider2 - The second collider involved in the contact.
     * @param f - Closure that will be called on each contact manifold between the two colliders. If the second argument
     *            passed to this closure is `true`, then the contact manifold data is flipped, i.e., methods like `localNormal1`
     *            actually apply to the `collider2` and fields like `localNormal2` apply to the `collider1`.
     */
    public contactPair(
        collider1: ColliderHandle,
        collider2: ColliderHandle,
        f: (manifold: TempContactManifold, flipped: boolean) => void,
    ) {
        const rawPair = this.raw.contact_pair(collider1, collider2);

        if (!!rawPair) {
            const flipped = rawPair.collider1() != collider1;

            let i;
            for (i = 0; i < rawPair.numContactManifolds(); ++i) {
                this.tempManifold.raw = rawPair.contactManifold(i);
                if (!!this.tempManifold.raw) {
                    f(this.tempManifold, flipped);
                }

                // SAFETY: The RawContactManifold stores a raw pointer that will be invalidated
                //         at the next timestep. So we must be sure to free the pair here
                //         to avoid unsoundness in the Rust code.
                this.tempManifold.free();
            }
            rawPair.free();
        }
    }

    /**
     * Returns `true` if `collider1` and `collider2` intersect and at least one of them is a sensor.
     * @param collider1 − The first collider involved in the intersection.
     * @param collider2 − The second collider involved in the intersection.
     */
    public intersectionPair(
        collider1: ColliderHandle,
        collider2: ColliderHandle,
    ): boolean {
        return this.raw.intersection_pair(collider1, collider2);
    }
}

export class TempContactManifold {
    raw: RawContactManifold;

    public free() {
        if (!!this.raw) {
            this.raw.free();
        }
        this.raw = undefined;
    }

    constructor(raw: RawContactManifold) {
        this.raw = raw;
    }

    public normal(): Vector {
        return VectorOps.fromRaw(this.raw.normal());
    }

    public localNormal1(): Vector {
        return VectorOps.fromRaw(this.raw.local_n1());
    }

    public localNormal2(): Vector {
        return VectorOps.fromRaw(this.raw.local_n2());
    }

    public subshape1(): number {
        return this.raw.subshape1();
    }

    public subshape2(): number {
        return this.raw.subshape2();
    }

    public numContacts(): number {
        return this.raw.num_contacts();
    }

    public localContactPoint1(i: number): Vector | null {
        return VectorOps.fromRaw(this.raw.contact_local_p1(i));
    }

    public localContactPoint2(i: number): Vector | null {
        return VectorOps.fromRaw(this.raw.contact_local_p2(i));
    }

    public contactDist(i: number): number {
        return this.raw.contact_dist(i);
    }

    public contactFid1(i: number): number {
        return this.raw.contact_fid1(i);
    }

    public contactFid2(i: number): number {
        return this.raw.contact_fid2(i);
    }

    public contactImpulse(i: number): number {
        return this.raw.contact_impulse(i);
    }

    // #if DIM2
    public contactTangentImpulse(i: number): number {
        return this.raw.contact_tangent_impulse(i);
    }
    // #endif

    // #if DIM3
    public contactTangentImpulseX(i: number): number {
        return this.raw.contact_tangent_impulse_x(i);
    }

    public contactTangentImpulseY(i: number): number {
        return this.raw.contact_tangent_impulse_y(i);
    }
    // #endif

    public numSolverContacts(): number {
        return this.raw.num_solver_contacts();
    }

    public solverContactPoint(i: number): Vector {
        return VectorOps.fromRaw(this.raw.solver_contact_point(i));
    }

    public solverContactDist(i: number): number {
        return this.raw.solver_contact_dist(i);
    }

    public solverContactFriction(i: number): number {
        return this.raw.solver_contact_friction(i);
    }

    public solverContactRestitution(i: number): number {
        return this.raw.solver_contact_restitution(i);
    }

    public solverContactTangentVelocity(i: number): Vector {
        return VectorOps.fromRaw(this.raw.solver_contact_tangent_velocity(i));
    }
}
