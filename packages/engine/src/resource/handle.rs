//! Resource handle types.
//! 资源句柄类型。

/// Type alias for resource handle IDs.
/// 资源句柄ID的类型别名。
pub type HandleId = u32;

/// Generic resource handle.
/// 通用资源句柄。
///
/// A lightweight identifier for referencing loaded resources.
/// 用于引用已加载资源的轻量级标识符。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Handle<T> {
    /// Unique identifier.
    /// 唯一标识符。
    id: HandleId,

    /// Phantom data for type safety.
    /// 用于类型安全的幻象数据。
    _marker: std::marker::PhantomData<T>,
}

impl<T> Handle<T> {
    /// Create a new handle with the given ID.
    /// 使用给定ID创建新句柄。
    #[inline]
    pub const fn new(id: HandleId) -> Self {
        Self {
            id,
            _marker: std::marker::PhantomData,
        }
    }

    /// Get the handle ID.
    /// 获取句柄ID。
    #[inline]
    pub const fn id(&self) -> HandleId {
        self.id
    }
}

impl<T> From<HandleId> for Handle<T> {
    #[inline]
    fn from(id: HandleId) -> Self {
        Self::new(id)
    }
}

impl<T> From<Handle<T>> for HandleId {
    #[inline]
    fn from(handle: Handle<T>) -> Self {
        handle.id
    }
}
