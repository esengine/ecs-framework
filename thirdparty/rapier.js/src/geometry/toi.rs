use crate::math::RawVector;
use crate::utils::{self, FlatHandle};
use rapier::geometry::{ColliderHandle, ShapeCastHit};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct RawShapeCastHit {
    pub(crate) hit: ShapeCastHit,
}

#[wasm_bindgen]
impl RawShapeCastHit {
    pub fn time_of_impact(&self) -> f32 {
        self.hit.time_of_impact
    }

    pub fn witness1(&self) -> RawVector {
        self.hit.witness1.coords.into()
    }

    pub fn witness2(&self) -> RawVector {
        self.hit.witness2.coords.into()
    }

    pub fn normal1(&self) -> RawVector {
        self.hit.normal1.into_inner().into()
    }

    pub fn normal2(&self) -> RawVector {
        self.hit.normal2.into_inner().into()
    }
}

#[wasm_bindgen]
pub struct RawColliderShapeCastHit {
    pub(crate) handle: ColliderHandle,
    pub(crate) hit: ShapeCastHit,
}

#[wasm_bindgen]
impl RawColliderShapeCastHit {
    pub fn colliderHandle(&self) -> FlatHandle {
        utils::flat_handle(self.handle.0)
    }

    pub fn time_of_impact(&self) -> f32 {
        self.hit.time_of_impact
    }

    pub fn witness1(&self) -> RawVector {
        self.hit.witness1.coords.into()
    }

    pub fn witness2(&self) -> RawVector {
        self.hit.witness2.coords.into()
    }

    pub fn normal1(&self) -> RawVector {
        self.hit.normal1.into_inner().into()
    }

    pub fn normal2(&self) -> RawVector {
        self.hit.normal2.into_inner().into()
    }
}
