//! Touch input handling.
//! 触摸输入处理。

use crate::math::Vec2;
use std::collections::HashMap;

/// Single touch point.
/// 单个触摸点。
#[derive(Debug, Clone, Copy)]
pub struct TouchPoint {
    /// Touch identifier.
    /// 触摸标识符。
    pub id: i32,

    /// Current position.
    /// 当前位置。
    pub position: Vec2,

    /// Starting position.
    /// 起始位置。
    pub start_position: Vec2,

    /// Movement delta since last frame.
    /// 自上一帧以来的移动增量。
    pub delta: Vec2,

    /// Previous position.
    /// 上一位置。
    prev_position: Vec2,
}

impl TouchPoint {
    /// Create a new touch point.
    /// 创建新的触摸点。
    pub fn new(id: i32, x: f32, y: f32) -> Self {
        let pos = Vec2::new(x, y);
        Self {
            id,
            position: pos,
            start_position: pos,
            delta: Vec2::ZERO,
            prev_position: pos,
        }
    }

    /// Update touch position.
    /// 更新触摸位置。
    pub fn update_position(&mut self, x: f32, y: f32) {
        self.prev_position = self.position;
        self.position = Vec2::new(x, y);
        self.delta = self.position - self.prev_position;
    }
}

/// Touch input state.
/// 触摸输入状态。
#[derive(Debug, Default)]
pub struct TouchState {
    /// Active touch points.
    /// 活动的触摸点。
    touches: HashMap<i32, TouchPoint>,

    /// Touch IDs that started this frame.
    /// 本帧开始的触摸ID。
    just_started: Vec<i32>,

    /// Touch IDs that ended this frame.
    /// 本帧结束的触摸ID。
    just_ended: Vec<i32>,
}

impl TouchState {
    /// Create new touch state.
    /// 创建新的触摸状态。
    pub fn new() -> Self {
        Self::default()
    }

    /// Handle touch start event.
    /// 处理触摸开始事件。
    pub fn touch_start(&mut self, id: i32, x: f32, y: f32) {
        let touch = TouchPoint::new(id, x, y);
        self.touches.insert(id, touch);
        self.just_started.push(id);
    }

    /// Handle touch move event.
    /// 处理触摸移动事件。
    pub fn touch_move(&mut self, id: i32, x: f32, y: f32) {
        if let Some(touch) = self.touches.get_mut(&id) {
            touch.update_position(x, y);
        }
    }

    /// Handle touch end event.
    /// 处理触摸结束事件。
    pub fn touch_end(&mut self, id: i32) {
        if self.touches.remove(&id).is_some() {
            self.just_ended.push(id);
        }
    }

    /// Get a touch point by ID.
    /// 按ID获取触摸点。
    #[inline]
    pub fn get_touch(&self, id: i32) -> Option<&TouchPoint> {
        self.touches.get(&id)
    }

    /// Get all active touch points.
    /// 获取所有活动的触摸点。
    #[inline]
    pub fn get_touches(&self) -> impl Iterator<Item = &TouchPoint> {
        self.touches.values()
    }

    /// Get number of active touches.
    /// 获取活动触摸数量。
    #[inline]
    pub fn touch_count(&self) -> usize {
        self.touches.len()
    }

    /// Check if any touch is active.
    /// 检查是否有任何触摸活动。
    #[inline]
    pub fn is_touching(&self) -> bool {
        !self.touches.is_empty()
    }

    /// Get touches that started this frame.
    /// 获取本帧开始的触摸。
    #[inline]
    pub fn just_started(&self) -> &[i32] {
        &self.just_started
    }

    /// Get touches that ended this frame.
    /// 获取本帧结束的触摸。
    #[inline]
    pub fn just_ended(&self) -> &[i32] {
        &self.just_ended
    }

    /// Update state for new frame.
    /// 为新帧更新状态。
    pub fn update(&mut self) {
        self.just_started.clear();
        self.just_ended.clear();

        // Reset deltas | 重置增量
        for touch in self.touches.values_mut() {
            touch.delta = Vec2::ZERO;
        }
    }

    /// Clear all touch state.
    /// 清除所有触摸状态。
    pub fn clear(&mut self) {
        self.touches.clear();
        self.just_started.clear();
        self.just_ended.clear();
    }
}
