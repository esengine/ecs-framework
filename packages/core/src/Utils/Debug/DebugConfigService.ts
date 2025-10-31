import { IECSDebugConfig } from '../../Types';
import { Injectable } from '../../Core/DI/Decorators';
import type { IService } from '../../Core/ServiceContainer';

/**
 * 调试配置服务
 *
 * 管理调试系统的配置信息
 */
@Injectable()
export class DebugConfigService implements IService {
    private _config: IECSDebugConfig;

    constructor() {
        this._config = {
            enabled: false,
            websocketUrl: '',
            debugFrameRate: 30,
            autoReconnect: true,
            channels: {
                entities: true,
                systems: true,
                performance: true,
                components: true,
                scenes: true
            }
        };
    }

    public setConfig(config: IECSDebugConfig): void {
        this._config = config;
    }

    public getConfig(): IECSDebugConfig {
        return this._config;
    }

    public isEnabled(): boolean {
        return this._config.enabled;
    }

    dispose(): void {
        // 清理资源
    }
}
