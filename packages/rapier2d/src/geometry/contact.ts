import {Vector, VectorOps} from "../math";
import {RawShapeContact} from "../raw";

/**
 * The contact info between two shapes.
 */
export class ShapeContact {
    /**
     * Distance between the two contact points.
     * If this is negative, this contact represents a penetration.
     */
    distance: number;

    /**
     * Position of the contact on the first shape.
     */
    point1: Vector;

    /**
     * Position of the contact on the second shape.
     */
    point2: Vector;

    /**
     * Contact normal, pointing towards the exterior of the first shape.
     */
    normal1: Vector;

    /**
     * Contact normal, pointing towards the exterior of the second shape.
     * If these contact data are expressed in world-space, this normal is equal to -normal1.
     */
    normal2: Vector;

    constructor(
        dist: number,
        point1: Vector,
        point2: Vector,
        normal1: Vector,
        normal2: Vector,
    ) {
        this.distance = dist;
        this.point1 = point1;
        this.point2 = point2;
        this.normal1 = normal1;
        this.normal2 = normal2;
    }

    public static fromRaw(raw: RawShapeContact): ShapeContact {
        if (!raw) return null;

        const result = new ShapeContact(
            raw.distance(),
            VectorOps.fromRaw(raw.point1()),
            VectorOps.fromRaw(raw.point2()),
            VectorOps.fromRaw(raw.normal1()),
            VectorOps.fromRaw(raw.normal2()),
        );
        raw.free();
        return result;
    }
}
