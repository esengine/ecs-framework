import {Collider, ColliderHandle} from "./collider";
import {Vector, VectorOps} from "../math";
import {
    RawFeatureType,
    RawPointColliderProjection,
    RawPointProjection,
} from "../raw";
import {FeatureType} from "./feature";
import {ColliderSet} from "./collider_set";

/**
 * The projection of a point on a collider.
 */
export class PointProjection {
    /**
     * The projection of the point on the collider.
     */
    point: Vector;
    /**
     * Is the point inside of the collider?
     */
    isInside: boolean;

    constructor(point: Vector, isInside: boolean) {
        this.point = point;
        this.isInside = isInside;
    }

    public static fromRaw(raw: RawPointProjection): PointProjection {
        if (!raw) return null;

        const result = new PointProjection(
            VectorOps.fromRaw(raw.point()),
            raw.isInside(),
        );
        raw.free();
        return result;
    }
}

/**
 * The projection of a point on a collider (includes the collider handle).
 */
export class PointColliderProjection {
    /**
     * The collider hit by the ray.
     */
    collider: Collider;
    /**
     * The projection of the point on the collider.
     */
    point: Vector;
    /**
     * Is the point inside of the collider?
     */
    isInside: boolean;

    /**
     * The type of the geometric feature the point was projected on.
     */
    featureType = FeatureType.Unknown;

    /**
     * The id of the geometric feature the point was projected on.
     */
    featureId: number | undefined = undefined;

    constructor(
        collider: Collider,
        point: Vector,
        isInside: boolean,
        featureType?: FeatureType,
        featureId?: number,
    ) {
        this.collider = collider;
        this.point = point;
        this.isInside = isInside;
        if (featureId !== undefined) this.featureId = featureId;
        if (featureType !== undefined) this.featureType = featureType;
    }

    public static fromRaw(
        colliderSet: ColliderSet,
        raw: RawPointColliderProjection,
    ): PointColliderProjection {
        if (!raw) return null;

        const result = new PointColliderProjection(
            colliderSet.get(raw.colliderHandle()),
            VectorOps.fromRaw(raw.point()),
            raw.isInside(),
            raw.featureType() as number as FeatureType,
            raw.featureId(),
        );
        raw.free();
        return result;
    }
}
