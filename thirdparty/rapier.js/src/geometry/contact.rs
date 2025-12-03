use crate::math::RawVector;
use rapier::parry::query;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct RawShapeContact {
    pub(crate) contact: query::Contact,
}

#[wasm_bindgen]
impl RawShapeContact {
    pub fn distance(&self) -> f32 {
        self.contact.dist
    }

    pub fn point1(&self) -> RawVector {
        self.contact.point1.coords.into()
    }

    pub fn point2(&self) -> RawVector {
        self.contact.point2.coords.into()
    }

    pub fn normal1(&self) -> RawVector {
        self.contact.normal1.into_inner().into()
    }

    pub fn normal2(&self) -> RawVector {
        self.contact.normal2.into_inner().into()
    }
}
