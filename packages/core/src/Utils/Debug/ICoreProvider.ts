import { IScene } from '../../ECS/IScene';

/**
 * Core提供者接口
 * 
 * 定义Debug系统需要的Core功能
 */
export interface ICoreProvider {
    /**
     * 获取当前Scene
     */
    getCurrentScene(): IScene | null;
    
    /**
     * 获取性能监控器
     */
    getPerformanceMonitor(): any;
}