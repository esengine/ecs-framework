use crate::geometry::{RawPointProjection, RawRayIntersection, RawShapeCastHit, RawShapeContact};
use crate::math::{RawRotation, RawVector};
#[cfg(feature = "dim3")]
use na::DMatrix;
#[cfg(feature = "dim2")]
use na::DVector;
use na::Unit;
use rapier::geometry::{Shape, SharedShape, TriMeshFlags};
use rapier::math::{Isometry, Point, Real, Vector, DIM};
use rapier::parry::query;
use rapier::parry::query::{Ray, ShapeCastOptions};
use wasm_bindgen::prelude::*;

pub trait SharedShapeUtility {
    fn castShape(
        &self,
        shapePos1: &Isometry<Real>,
        shapeVel1: &Vector<Real>,
        shape2: &dyn Shape,
        shapePos2: &Isometry<Real>,
        shapeVel2: &Vector<Real>,
        target_distance: f32,
        maxToi: f32,
        stop_at_penetration: bool,
    ) -> Option<RawShapeCastHit>;

    fn intersectsShape(
        &self,
        shapePos1: &Isometry<Real>,
        shape2: &dyn Shape,
        shapePos2: &Isometry<Real>,
    ) -> bool;

    fn contactShape(
        &self,
        shapePos1: &Isometry<Real>,
        shape2: &dyn Shape,
        shapePos2: &Isometry<Real>,
        prediction: f32,
    ) -> Option<RawShapeContact>;

    fn containsPoint(&self, shapePos: &Isometry<Real>, point: &Point<Real>) -> bool;

    fn projectPoint(
        &self,
        shapePos: &Isometry<Real>,
        point: &Point<Real>,
        solid: bool,
    ) -> RawPointProjection;

    fn intersectsRay(
        &self,
        shapePos: &Isometry<Real>,
        rayOrig: Point<Real>,
        rayDir: Vector<Real>,
        maxToi: f32,
    ) -> bool;

    fn castRay(
        &self,
        shapePos: &Isometry<Real>,
        rayOrig: Point<Real>,
        rayDir: Vector<Real>,
        maxToi: f32,
        solid: bool,
    ) -> f32;

    fn castRayAndGetNormal(
        &self,
        shapePos: &Isometry<Real>,
        rayOrig: Point<Real>,
        rayDir: Vector<Real>,
        maxToi: f32,
        solid: bool,
    ) -> Option<RawRayIntersection>;
}

// for RawShape & Collider
impl SharedShapeUtility for SharedShape {
    fn castShape(
        &self,
        shapePos1: &Isometry<Real>,
        shapeVel1: &Vector<Real>,
        shape2: &dyn Shape,
        shapePos2: &Isometry<Real>,
        shapeVel2: &Vector<Real>,
        target_distance: f32,
        maxToi: f32,
        stop_at_penetration: bool,
    ) -> Option<RawShapeCastHit> {
        query::cast_shapes(
            shapePos1,
            shapeVel1,
            &*self.0,
            shapePos2,
            &shapeVel2,
            shape2,
            ShapeCastOptions {
                max_time_of_impact: maxToi,
                target_distance,
                stop_at_penetration,
                compute_impact_geometry_on_penetration: true,
            },
        )
        .ok()
        .flatten()
        .map(|hit| RawShapeCastHit { hit })
    }

    fn intersectsShape(
        &self,
        shapePos1: &Isometry<Real>,
        shape2: &dyn Shape,
        shapePos2: &Isometry<Real>,
    ) -> bool {
        query::intersection_test(shapePos1, &*self.0, shapePos2, shape2).unwrap_or(false)
    }

    fn contactShape(
        &self,
        shapePos1: &Isometry<Real>,
        shape2: &dyn Shape,
        shapePos2: &Isometry<Real>,
        prediction: f32,
    ) -> Option<RawShapeContact> {
        query::contact(shapePos1, &*self.0, shapePos2, shape2, prediction)
            .ok()
            .flatten()
            .map(|contact| RawShapeContact { contact })
    }

    fn containsPoint(&self, shapePos: &Isometry<Real>, point: &Point<Real>) -> bool {
        self.as_ref().contains_point(shapePos, point)
    }

    fn projectPoint(
        &self,
        shapePos: &Isometry<Real>,
        point: &Point<Real>,
        solid: bool,
    ) -> RawPointProjection {
        RawPointProjection(self.as_ref().project_point(shapePos, point, solid))
    }

    fn intersectsRay(
        &self,
        shapePos: &Isometry<Real>,
        rayOrig: Point<Real>,
        rayDir: Vector<Real>,
        maxToi: f32,
    ) -> bool {
        self.as_ref()
            .intersects_ray(shapePos, &Ray::new(rayOrig, rayDir), maxToi)
    }

    fn castRay(
        &self,
        shapePos: &Isometry<Real>,
        rayOrig: Point<Real>,
        rayDir: Vector<Real>,
        maxToi: f32,
        solid: bool,
    ) -> f32 {
        self.as_ref()
            .cast_ray(shapePos, &Ray::new(rayOrig, rayDir), maxToi, solid)
            .unwrap_or(-1.0) // Negative value = no hit.
    }

    fn castRayAndGetNormal(
        &self,
        shapePos: &Isometry<Real>,
        rayOrig: Point<Real>,
        rayDir: Vector<Real>,
        maxToi: f32,
        solid: bool,
    ) -> Option<RawRayIntersection> {
        self.as_ref()
            .cast_ray_and_get_normal(shapePos, &Ray::new(rayOrig, rayDir), maxToi, solid)
            .map(|inter| RawRayIntersection(inter))
    }
}

#[wasm_bindgen]
#[cfg(feature = "dim2")]
pub enum RawShapeType {
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

#[wasm_bindgen]
#[cfg(feature = "dim3")]
pub enum RawShapeType {
    Ball = 0,
    Cuboid = 1,
    Capsule = 2,
    Segment = 3,
    Polyline = 4,
    Triangle = 5,
    TriMesh = 6,
    HeightField = 7,
    Compound = 8,
    ConvexPolyhedron = 9,
    Cylinder = 10,
    Cone = 11,
    RoundCuboid = 12,
    RoundTriangle = 13,
    RoundCylinder = 14,
    RoundCone = 15,
    RoundConvexPolyhedron = 16,
    HalfSpace = 17,
    Voxels = 18,
}

#[wasm_bindgen]
pub struct RawShape(pub(crate) SharedShape);

#[wasm_bindgen]
impl RawShape {
    #[cfg(feature = "dim2")]
    pub fn cuboid(hx: f32, hy: f32) -> Self {
        Self(SharedShape::cuboid(hx, hy))
    }

    #[cfg(feature = "dim3")]
    pub fn cuboid(hx: f32, hy: f32, hz: f32) -> Self {
        Self(SharedShape::cuboid(hx, hy, hz))
    }

    #[cfg(feature = "dim2")]
    pub fn roundCuboid(hx: f32, hy: f32, borderRadius: f32) -> Self {
        Self(SharedShape::round_cuboid(hx, hy, borderRadius))
    }

    #[cfg(feature = "dim3")]
    pub fn roundCuboid(hx: f32, hy: f32, hz: f32, borderRadius: f32) -> Self {
        Self(SharedShape::round_cuboid(hx, hy, hz, borderRadius))
    }

    pub fn ball(radius: f32) -> Self {
        Self(SharedShape::ball(radius))
    }

    pub fn halfspace(normal: &RawVector) -> Self {
        Self(SharedShape::halfspace(Unit::new_normalize(normal.0)))
    }

    pub fn capsule(halfHeight: f32, radius: f32) -> Self {
        let p2 = Point::from(Vector::y() * halfHeight);
        let p1 = -p2;
        Self(SharedShape::capsule(p1, p2, radius))
    }

    #[cfg(feature = "dim3")]
    pub fn cylinder(halfHeight: f32, radius: f32) -> Self {
        Self(SharedShape::cylinder(halfHeight, radius))
    }

    #[cfg(feature = "dim3")]
    pub fn roundCylinder(halfHeight: f32, radius: f32, borderRadius: f32) -> Self {
        Self(SharedShape::round_cylinder(
            halfHeight,
            radius,
            borderRadius,
        ))
    }

    #[cfg(feature = "dim3")]
    pub fn cone(halfHeight: f32, radius: f32) -> Self {
        Self(SharedShape::cone(halfHeight, radius))
    }

    #[cfg(feature = "dim3")]
    pub fn roundCone(halfHeight: f32, radius: f32, borderRadius: f32) -> Self {
        Self(SharedShape::round_cone(halfHeight, radius, borderRadius))
    }

    pub fn voxels(voxel_size: &RawVector, grid_coords: Vec<i32>) -> Self {
        let grid_coords: Vec<_> = grid_coords
            .chunks_exact(DIM)
            .map(Point::from_slice)
            .collect();
        Self(SharedShape::voxels(voxel_size.0, &grid_coords))
    }

    pub fn voxelsFromPoints(voxel_size: &RawVector, points: Vec<f32>) -> Self {
        let points: Vec<_> = points.chunks_exact(DIM).map(Point::from_slice).collect();
        Self(SharedShape::voxels_from_points(voxel_size.0, &points))
    }

    pub fn polyline(vertices: Vec<f32>, indices: Vec<u32>) -> Self {
        let vertices = vertices.chunks(DIM).map(|v| Point::from_slice(v)).collect();
        let indices: Vec<_> = indices.chunks(2).map(|v| [v[0], v[1]]).collect();
        if indices.is_empty() {
            Self(SharedShape::polyline(vertices, None))
        } else {
            Self(SharedShape::polyline(vertices, Some(indices)))
        }
    }

    pub fn trimesh(vertices: Vec<f32>, indices: Vec<u32>, flags: u32) -> Option<RawShape> {
        let flags = TriMeshFlags::from_bits(flags as u16).unwrap_or_default();
        let vertices = vertices.chunks(DIM).map(|v| Point::from_slice(v)).collect();
        let indices = indices.chunks(3).map(|v| [v[0], v[1], v[2]]).collect();
        SharedShape::trimesh_with_flags(vertices, indices, flags)
            .ok()
            .map(Self)
    }

    #[cfg(feature = "dim2")]
    pub fn heightfield(heights: Vec<f32>, scale: &RawVector) -> Self {
        let heights = DVector::from_vec(heights);
        Self(SharedShape::heightfield(heights, scale.0))
    }

    #[cfg(feature = "dim3")]
    pub fn heightfield(
        nrows: u32,
        ncols: u32,
        heights: Vec<f32>,
        scale: &RawVector,
        flags: u32,
    ) -> Self {
        let flags =
            rapier::parry::shape::HeightFieldFlags::from_bits(flags as u8).unwrap_or_default();
        let heights = DMatrix::from_vec(nrows as usize + 1, ncols as usize + 1, heights);
        Self(SharedShape::heightfield_with_flags(heights, scale.0, flags))
    }

    pub fn segment(p1: &RawVector, p2: &RawVector) -> Self {
        Self(SharedShape::segment(p1.0.into(), p2.0.into()))
    }

    pub fn triangle(p1: &RawVector, p2: &RawVector, p3: &RawVector) -> Self {
        Self(SharedShape::triangle(p1.0.into(), p2.0.into(), p3.0.into()))
    }

    pub fn roundTriangle(
        p1: &RawVector,
        p2: &RawVector,
        p3: &RawVector,
        borderRadius: f32,
    ) -> Self {
        Self(SharedShape::round_triangle(
            p1.0.into(),
            p2.0.into(),
            p3.0.into(),
            borderRadius,
        ))
    }

    pub fn convexHull(points: Vec<f32>) -> Option<RawShape> {
        let points: Vec<_> = points.chunks(DIM).map(|v| Point::from_slice(v)).collect();
        SharedShape::convex_hull(&points).map(|s| Self(s))
    }

    pub fn roundConvexHull(points: Vec<f32>, borderRadius: f32) -> Option<RawShape> {
        let points: Vec<_> = points.chunks(DIM).map(|v| Point::from_slice(v)).collect();
        SharedShape::round_convex_hull(&points, borderRadius).map(|s| Self(s))
    }

    #[cfg(feature = "dim2")]
    pub fn convexPolyline(vertices: Vec<f32>) -> Option<RawShape> {
        let vertices = vertices.chunks(DIM).map(|v| Point::from_slice(v)).collect();
        SharedShape::convex_polyline(vertices).map(|s| Self(s))
    }

    #[cfg(feature = "dim2")]
    pub fn roundConvexPolyline(vertices: Vec<f32>, borderRadius: f32) -> Option<RawShape> {
        let vertices = vertices.chunks(DIM).map(|v| Point::from_slice(v)).collect();
        SharedShape::round_convex_polyline(vertices, borderRadius).map(|s| Self(s))
    }

    #[cfg(feature = "dim3")]
    pub fn convexMesh(vertices: Vec<f32>, indices: Vec<u32>) -> Option<RawShape> {
        let vertices = vertices.chunks(DIM).map(|v| Point::from_slice(v)).collect();
        let indices: Vec<_> = indices.chunks(3).map(|v| [v[0], v[1], v[2]]).collect();
        SharedShape::convex_mesh(vertices, &indices).map(|s| Self(s))
    }

    #[cfg(feature = "dim3")]
    pub fn roundConvexMesh(
        vertices: Vec<f32>,
        indices: Vec<u32>,
        borderRadius: f32,
    ) -> Option<RawShape> {
        let vertices = vertices.chunks(DIM).map(|v| Point::from_slice(v)).collect();
        let indices: Vec<_> = indices.chunks(3).map(|v| [v[0], v[1], v[2]]).collect();
        SharedShape::round_convex_mesh(vertices, &indices, borderRadius).map(|s| Self(s))
    }

    pub fn castShape(
        &self,
        shapePos1: &RawVector,
        shapeRot1: &RawRotation,
        shapeVel1: &RawVector,
        shape2: &RawShape,
        shapePos2: &RawVector,
        shapeRot2: &RawRotation,
        shapeVel2: &RawVector,
        target_distance: f32,
        maxToi: f32,
        stop_at_penetration: bool,
    ) -> Option<RawShapeCastHit> {
        let pos1 = Isometry::from_parts(shapePos1.0.into(), shapeRot1.0);
        let pos2 = Isometry::from_parts(shapePos2.0.into(), shapeRot2.0);

        self.0.castShape(
            &pos1,
            &shapeVel1.0,
            &*shape2.0,
            &pos2,
            &shapeVel2.0,
            target_distance,
            maxToi,
            stop_at_penetration,
        )
    }

    pub fn intersectsShape(
        &self,
        shapePos1: &RawVector,
        shapeRot1: &RawRotation,
        shape2: &RawShape,
        shapePos2: &RawVector,
        shapeRot2: &RawRotation,
    ) -> bool {
        let pos1 = Isometry::from_parts(shapePos1.0.into(), shapeRot1.0);
        let pos2 = Isometry::from_parts(shapePos2.0.into(), shapeRot2.0);

        self.0.intersectsShape(&pos1, &*shape2.0, &pos2)
    }

    pub fn contactShape(
        &self,
        shapePos1: &RawVector,
        shapeRot1: &RawRotation,
        shape2: &RawShape,
        shapePos2: &RawVector,
        shapeRot2: &RawRotation,
        prediction: f32,
    ) -> Option<RawShapeContact> {
        let pos1 = Isometry::from_parts(shapePos1.0.into(), shapeRot1.0);
        let pos2 = Isometry::from_parts(shapePos2.0.into(), shapeRot2.0);

        self.0.contactShape(&pos1, &*shape2.0, &pos2, prediction)
    }

    pub fn containsPoint(
        &self,
        shapePos: &RawVector,
        shapeRot: &RawRotation,
        point: &RawVector,
    ) -> bool {
        let pos = Isometry::from_parts(shapePos.0.into(), shapeRot.0);

        self.0.containsPoint(&pos, &point.0.into())
    }

    pub fn projectPoint(
        &self,
        shapePos: &RawVector,
        shapeRot: &RawRotation,
        point: &RawVector,
        solid: bool,
    ) -> RawPointProjection {
        let pos = Isometry::from_parts(shapePos.0.into(), shapeRot.0);

        self.0.projectPoint(&pos, &point.0.into(), solid)
    }

    pub fn intersectsRay(
        &self,
        shapePos: &RawVector,
        shapeRot: &RawRotation,
        rayOrig: &RawVector,
        rayDir: &RawVector,
        maxToi: f32,
    ) -> bool {
        let pos = Isometry::from_parts(shapePos.0.into(), shapeRot.0);

        self.0
            .intersectsRay(&pos, rayOrig.0.into(), rayDir.0.into(), maxToi)
    }

    pub fn castRay(
        &self,
        shapePos: &RawVector,
        shapeRot: &RawRotation,
        rayOrig: &RawVector,
        rayDir: &RawVector,
        maxToi: f32,
        solid: bool,
    ) -> f32 {
        let pos = Isometry::from_parts(shapePos.0.into(), shapeRot.0);

        self.0
            .castRay(&pos, rayOrig.0.into(), rayDir.0.into(), maxToi, solid)
    }

    pub fn castRayAndGetNormal(
        &self,
        shapePos: &RawVector,
        shapeRot: &RawRotation,
        rayOrig: &RawVector,
        rayDir: &RawVector,
        maxToi: f32,
        solid: bool,
    ) -> Option<RawRayIntersection> {
        let pos = Isometry::from_parts(shapePos.0.into(), shapeRot.0);

        self.0
            .castRayAndGetNormal(&pos, rayOrig.0.into(), rayDir.0.into(), maxToi, solid)
    }
}
