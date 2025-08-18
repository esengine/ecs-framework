use std::sync::{Mutex, OnceLock};

/**
 * 时间管理工具类
 * 提供游戏时间相关的功能，包括帧时间、总时间、时间缩放等
 */
pub struct Time {
    /// 上一帧到当前帧的时间间隔（秒）
    delta_time: f64,
    
    /// 未缩放的帧时间间隔（秒）
    unscaled_delta_time: f64,
    
    /// 游戏开始以来的总时间（秒）
    total_time: f64,
    
    /// 未缩放的总时间（秒）
    unscaled_total_time: f64,
    
    /// 时间缩放比例
    time_scale: f64,
    
    /// 当前帧数
    frame_count: u64,
}

impl Time {
    pub fn new() -> Self {
        Self {
            delta_time: 0.0,
            unscaled_delta_time: 0.0,
            total_time: 0.0,
            unscaled_total_time: 0.0,
            time_scale: 1.0,
            frame_count: 0,
        }
    }

    /**
     * 获取全局Time实例
     */
    pub fn instance() -> &'static Mutex<Time> {
        static TIME: OnceLock<Mutex<Time>> = OnceLock::new();
        TIME.get_or_init(|| Mutex::new(Time::new()))
    }

    /**
     * 使用外部引擎提供的deltaTime更新时间信息
     */
    pub fn update(delta_time: f64) {
        let mut time = Self::instance().lock().unwrap();
        time.unscaled_delta_time = delta_time;
        time.delta_time = delta_time * time.time_scale;

        // 更新总时间
        time.unscaled_total_time += time.unscaled_delta_time;
        time.total_time += time.delta_time;

        // 更新帧数
        time.frame_count += 1;
    }

    /**
     * 获取帧时间间隔
     */
    pub fn delta_time() -> f64 {
        Self::instance().lock().unwrap().delta_time
    }

    /**
     * 获取未缩放的帧时间间隔
     */
    pub fn unscaled_delta_time() -> f64 {
        Self::instance().lock().unwrap().unscaled_delta_time
    }

    /**
     * 获取总时间
     */
    pub fn total_time() -> f64 {
        Self::instance().lock().unwrap().total_time
    }

    /**
     * 获取未缩放的总时间
     */
    pub fn unscaled_total_time() -> f64 {
        Self::instance().lock().unwrap().unscaled_total_time
    }

    /**
     * 获取时间缩放比例
     */
    pub fn time_scale() -> f64 {
        Self::instance().lock().unwrap().time_scale
    }

    /**
     * 设置时间缩放比例
     */
    pub fn set_time_scale(scale: f64) {
        Self::instance().lock().unwrap().time_scale = scale;
    }

    /**
     * 获取当前帧数
     */
    pub fn frame_count() -> u64 {
        Self::instance().lock().unwrap().frame_count
    }

    /**
     * 重置时间
     */
    pub fn reset() {
        let mut time = Self::instance().lock().unwrap();
        time.delta_time = 0.0;
        time.unscaled_delta_time = 0.0;
        time.total_time = 0.0;
        time.unscaled_total_time = 0.0;
        time.time_scale = 1.0;
        time.frame_count = 0;
    }
}