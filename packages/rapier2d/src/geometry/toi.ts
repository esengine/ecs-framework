import {Collider} from "./collider";
import {Vector, VectorOps} from "../math";
import {RawShapeCastHit, RawColliderShapeCastHit} from "../raw";
import {ColliderSet} from "./collider_set";

/**
 * The intersection between a ray and a collider.
 */
export class ShapeCastHit {
    /**
     * The time of impact of the two shapes.
     */
    time_of_impact: number;
    /**
     * The local-space contact point on the first shape, at
     * the time of impact.
     */
    witness1: Vector;
    /**
     * The local-space contact point on the second shape, at
     * the time of impact.
     */
    witness2: Vector;
    /**
     * The local-space normal on the first shape, at
     * the time of impact.
     */
    normal1: Vector;
    /**
     * The local-space normal on the second shape, at
     * the time of impact.
     */
    normal2: Vector;

    constructor(
        time_of_impact: number,
        witness1: Vector,
        witness2: Vector,
        normal1: Vector,
        normal2: Vector,
    ) {
        this.time_of_impact = time_of_impact;
        this.witness1 = witness1;
        this.witness2 = witness2;
        this.normal1 = normal1;
        this.normal2 = normal2;
    }

    public static fromRaw(
        colliderSet: ColliderSet,
        raw: RawShapeCastHit,
    ): ShapeCastHit {
        if (!raw) return null;

        const result = new ShapeCastHit(
            raw.time_of_impact(),
            VectorOps.fromRaw(raw.witness1()),
            VectorOps.fromRaw(raw.witness2()),
            VectorOps.fromRaw(raw.normal1()),
            VectorOps.fromRaw(raw.normal2()),
        );
        raw.free();
        return result;
    }
}

/**
 * The intersection between a ray and a collider.
 */
export class ColliderShapeCastHit extends ShapeCastHit {
    /**
     * The handle of the collider hit by the ray.
     */
    collider: Collider;

    constructor(
        collider: Collider,
        time_of_impact: number,
        witness1: Vector,
        witness2: Vector,
        normal1: Vector,
        normal2: Vector,
    ) {
        super(time_of_impact, witness1, witness2, normal1, normal2);
        this.collider = collider;
    }

    public static fromRaw(
        colliderSet: ColliderSet,
        raw: RawColliderShapeCastHit,
    ): ColliderShapeCastHit {
        if (!raw) return null;

        const result = new ColliderShapeCastHit(
            colliderSet.get(raw.colliderHandle()),
            raw.time_of_impact(),
            VectorOps.fromRaw(raw.witness1()),
            VectorOps.fromRaw(raw.witness2()),
            VectorOps.fromRaw(raw.normal1()),
            VectorOps.fromRaw(raw.normal2()),
        );
        raw.free();
        return result;
    }
}
