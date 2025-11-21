//! Error types for the engine.
//! 引擎的错误类型定义。

use thiserror::Error;

/// Engine error types.
/// 引擎错误类型。
#[derive(Error, Debug)]
pub enum EngineError {
    /// Canvas element not found.
    /// 未找到Canvas元素。
    #[error("Canvas element not found: {0} | 未找到Canvas元素: {0}")]
    CanvasNotFound(String),

    /// WebGL context creation failed.
    /// WebGL上下文创建失败。
    #[error("WebGL2 context creation failed | WebGL2上下文创建失败")]
    ContextCreationFailed,

    /// Shader compilation failed.
    /// Shader编译失败。
    #[error("Shader compilation failed: {0} | Shader编译失败: {0}")]
    ShaderCompileFailed(String),

    /// Shader program linking failed.
    /// Shader程序链接失败。
    #[error("Shader program linking failed: {0} | Shader程序链接失败: {0}")]
    ProgramLinkFailed(String),

    /// Texture loading failed.
    /// 纹理加载失败。
    #[error("Texture loading failed: {0} | 纹理加载失败: {0}")]
    TextureLoadFailed(String),

    /// Texture not found.
    /// 未找到纹理。
    #[error("Texture not found: {0} | 未找到纹理: {0}")]
    TextureNotFound(u32),

    /// Invalid batch data.
    /// 无效的批处理数据。
    #[error("Invalid batch data: {0} | 无效的批处理数据: {0}")]
    InvalidBatchData(String),

    /// Buffer creation failed.
    /// 缓冲区创建失败。
    #[error("Buffer creation failed | 缓冲区创建失败")]
    BufferCreationFailed,

    /// WebGL operation failed.
    /// WebGL操作失败。
    #[error("WebGL operation failed: {0} | WebGL操作失败: {0}")]
    WebGLError(String),
}

/// Result type alias for engine operations.
/// 引擎操作的Result类型别名。
pub type Result<T> = std::result::Result<T, EngineError>;
