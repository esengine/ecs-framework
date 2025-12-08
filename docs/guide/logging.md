# 日志系统

ECS 框架提供了功能强大的分级日志系统，支持多种日志级别、颜色输出、自定义前缀和灵活的配置选项。日志系统可以帮助开发者调试代码和监控应用运行状态。

## 基本概念

日志系统包含以下核心概念：
- **日志级别**：Debug < Info < Warn < Error < Fatal < None
- **日志器**：具名的日志输出器，每个模块可以有自己的日志器
- **日志管理器**：全局管理所有日志器的单例
- **颜色配置**：支持控制台颜色输出

## 日志级别

```typescript
import { LogLevel } from '@esengine/esengine';

// 日志级别从低到高
LogLevel.Debug   // 0 - 调试信息
LogLevel.Info    // 1 - 一般信息
LogLevel.Warn    // 2 - 警告信息
LogLevel.Error   // 3 - 错误信息
LogLevel.Fatal   // 4 - 致命错误
LogLevel.None    // 5 - 不输出任何日志
```

## 基本使用

### 使用默认日志器

```typescript
import { Logger } from '@esengine/esengine';

class GameSystem extends EntitySystem {
  protected process(entities: readonly Entity[]): void {
    // 输出不同级别的日志
    Logger.debug('处理实体数量:', entities.length);
    Logger.info('系统正常运行');
    Logger.warn('检测到性能问题');
    Logger.error('处理过程中发生错误', new Error('示例错误'));
    Logger.fatal('致命错误，系统即将停止');
  }
}
```

### 创建命名日志器

```typescript
import { createLogger } from '@esengine/esengine';

class MovementSystem extends EntitySystem {
  private logger = createLogger('MovementSystem');

  protected process(entities: readonly Entity[]): void {
    this.logger.info(`处理 ${entities.length} 个移动实体`);

    for (const entity of entities) {
      const position = entity.getComponent(Position);
      const velocity = entity.getComponent(Velocity);

      if (position && velocity) {
        position.x += velocity.dx * Time.deltaTime;
        position.y += velocity.dy * Time.deltaTime;

        this.logger.debug(`实体 ${entity.id} 移动到位置 (${position.x}, ${position.y})`);
      }
    }
  }

  protected onAdded(entity: Entity): void {
    this.logger.info(`实体 ${entity.name} 加入移动系统`);
  }

  protected onRemoved(entity: Entity): void {
    this.logger.warn(`实体 ${entity.name} 离开移动系统`);
  }
}
```

### 系统内置日志器

框架的各个系统都有自己的日志器：

```typescript
// 框架内部使用示例
class Scene {
  private static readonly _logger = createLogger('Scene');

  public addSystem(system: EntitySystem): void {
    Scene._logger.info(`添加系统: ${system.systemName}`);
    // 系统添加逻辑
  }

  public removeSystem(system: EntitySystem): void {
    Scene._logger.warn(`移除系统: ${system.systemName}`);
    // 系统移除逻辑
  }
}
```

## 日志配置

### 设置全局日志级别

```typescript
import { setGlobalLogLevel, LogLevel } from '@esengine/esengine';

// 在开发环境显示所有日志
setGlobalLogLevel(LogLevel.Debug);

// 在生产环境只显示警告及以上级别
setGlobalLogLevel(LogLevel.Warn);

// 完全禁用日志输出
setGlobalLogLevel(LogLevel.None);
```

### 创建自定义配置的日志器

```typescript
import { ConsoleLogger, LogLevel } from '@esengine/esengine';

class CustomLoggerExample {
  private debugLogger: ConsoleLogger;
  private productionLogger: ConsoleLogger;

  constructor() {
    // 开发环境日志器
    this.debugLogger = new ConsoleLogger({
      level: LogLevel.Debug,
      enableTimestamp: true,
      enableColors: true,
      prefix: 'DEV'
    });

    // 生产环境日志器
    this.productionLogger = new ConsoleLogger({
      level: LogLevel.Error,
      enableTimestamp: true,
      enableColors: false,
      prefix: 'PROD'
    });
  }

  public logDevelopmentInfo(): void {
    this.debugLogger.debug('这是调试信息');
    this.debugLogger.info('开发环境信息');
  }

  public logProductionError(): void {
    this.productionLogger.error('生产环境错误');
    this.productionLogger.fatal('致命错误');
  }
}
```

## 颜色配置

### 使用预定义颜色

```typescript
import { Colors, setLoggerColors } from '@esengine/esengine';

// 自定义颜色方案
setLoggerColors({
  debug: Colors.BRIGHT_BLACK,
  info: Colors.BLUE,
  warn: Colors.YELLOW,
  error: Colors.RED,
  fatal: Colors.BRIGHT_RED
});
```

### 完整颜色示例

```typescript
import { LoggerManager, Colors, LogLevel } from '@esengine/esengine';

class ColorLoggerDemo {
  private logger = createLogger('ColorDemo');

  constructor() {
    // 设置自定义颜色
    const manager = LoggerManager.getInstance();
    manager.setGlobalColors({
      debug: Colors.CYAN,
      info: Colors.GREEN,
      warn: Colors.YELLOW,
      error: Colors.RED,
      fatal: `${Colors.BOLD}${Colors.BRIGHT_RED}`
    });
  }

  public demonstrateColors(): void {
    this.logger.debug('这是蓝绿色的调试信息');
    this.logger.info('这是绿色的信息');
    this.logger.warn('这是黄色的警告');
    this.logger.error('这是红色的错误');
    this.logger.fatal('这是加粗的亮红色致命错误');
  }

  public resetToDefaults(): void {
    // 重置为默认颜色
    LoggerManager.getInstance().resetColors();
  }
}
```

## 高级功能

### 分层日志器

```typescript
import { LoggerManager } from '@esengine/esengine';

class HierarchicalLoggingExample {
  private systemLogger = createLogger('GameSystems');
  private movementLogger: ILogger;
  private renderLogger: ILogger;

  constructor() {
    const manager = LoggerManager.getInstance();

    // 创建子日志器
    this.movementLogger = manager.createChildLogger('GameSystems', 'Movement');
    this.renderLogger = manager.createChildLogger('GameSystems', 'Render');
  }

  public demonstrateHierarchy(): void {
    this.systemLogger.info('游戏系统启动');

    // 子日志器会显示完整路径：[GameSystems.Movement]
    this.movementLogger.debug('移动系统初始化');

    // 子日志器会显示完整路径：[GameSystems.Render]
    this.renderLogger.info('渲染系统启动');
  }
}
```

### 集成第三方日志库

通过 `setLoggerFactory` 可以将业务代码中的日志器替换为第三方日志库（如 winston、pino、nestjs Logger 等）。

**说明**: 目前框架内部日志仍使用 ConsoleLogger，自定义日志器仅影响业务代码（如 EntitySystem）。

#### 基本用法

```typescript
import { setLoggerFactory } from '@esengine/esengine';

setLoggerFactory((name?: string) => {
  // 返回实现 ILogger 接口的日志器实例
  return yourLogger;
});
```

#### 使用示例

```typescript
// 集成 Winston
setLoggerFactory((name?: string) => winston.createLogger({ /* ... */ }));

// 集成 Pino
setLoggerFactory((name?: string) => pino({ name }));

// 集成 NestJS Logger
setLoggerFactory((name?: string) => new Logger(name));
```

#### EntitySystem 中的使用

EntitySystem 会自动使用类名创建日志器:

```typescript
class PlayerMovementSystem extends EntitySystem {
  // this.logger 自动使用 'PlayerMovementSystem' 作为名称

  protected process(entities: readonly Entity[]): void {
    this.logger.info(`处理 ${entities.length} 个玩家实体`);
  }
}
```

### 自定义输出

```typescript
import { ConsoleLogger, LogLevel } from '@esengine/esengine';

class CustomOutputLogger {
  private fileLogger: ConsoleLogger;
  private networkLogger: ConsoleLogger;

  constructor() {
    // 输出到文件的日志器（模拟）
    this.fileLogger = new ConsoleLogger({
      level: LogLevel.Info,
      output: (level: LogLevel, message: string) => {
        this.writeToFile(LogLevel[level], message);
      }
    });

    // 发送到网络的日志器（模拟）
    this.networkLogger = new ConsoleLogger({
      level: LogLevel.Error,
      output: (level: LogLevel, message: string) => {
        this.sendToServer(LogLevel[level], message);
      }
    });
  }

  private writeToFile(level: string, message: string): void {
    // 模拟文件写入
    console.log(`[FILE] ${level}: ${message}`);
  }

  private sendToServer(level: string, message: string): void {
    // 模拟网络发送
    console.log(`[NETWORK] ${level}: ${message}`);
  }

  public logToFile(message: string): void {
    this.fileLogger.info(message);
  }

  public logCriticalError(error: Error): void {
    this.networkLogger.error('Critical error occurred', error);
  }
}
```

## 实际应用示例

### 游戏系统日志

```typescript
class GameWithLogging {
  private gameLogger = createLogger('Game');
  private performanceLogger = createLogger('Performance');
  private networkLogger = createLogger('Network');

  constructor() {
    // 在开发环境启用详细日志
    if (process.env.NODE_ENV === 'development') {
      setGlobalLogLevel(LogLevel.Debug);
    } else {
      setGlobalLogLevel(LogLevel.Warn);
    }
  }

  public startGame(): void {
    this.gameLogger.info('游戏开始启动');

    try {
      this.initializeSystems();
      this.loadResources();
      this.startGameLoop();

      this.gameLogger.info('游戏启动成功');
    } catch (error) {
      this.gameLogger.fatal('游戏启动失败', error);
      throw error;
    }
  }

  private initializeSystems(): void {
    this.gameLogger.debug('初始化游戏系统');

    const systems = [
      new MovementSystem(),
      new RenderSystem(),
      new PhysicsSystem()
    ];

    for (const system of systems) {
      const startTime = performance.now();

      // 初始化系统
      system.initialize();

      const endTime = performance.now();
      this.performanceLogger.debug(
        `系统 ${system.systemName} 初始化耗时: ${(endTime - startTime).toFixed(2)}ms`
      );
    }
  }

  private loadResources(): void {
    this.gameLogger.info('开始加载资源');

    const resources = ['textures', 'sounds', 'data'];
    for (const resource of resources) {
      try {
        this.loadResource(resource);
        this.gameLogger.debug(`资源 ${resource} 加载成功`);
      } catch (error) {
        this.gameLogger.error(`资源 ${resource} 加载失败`, error);
      }
    }
  }

  private startGameLoop(): void {
    this.gameLogger.info('启动游戏循环');
    this.performanceLogger.debug('开始性能监控');
  }

  private loadResource(name: string): void {
    // 模拟资源加载
    if (Math.random() < 0.1) {
      throw new Error(`Failed to load ${name}`);
    }
  }

  public handleNetworkEvent(event: string, data: any): void {
    this.networkLogger.info(`网络事件: ${event}`, data);

    if (event === 'connection_lost') {
      this.networkLogger.warn('网络连接丢失，尝试重连');
    } else if (event === 'sync_error') {
      this.networkLogger.error('数据同步错误', data);
    }
  }
}
```

### 错误追踪和调试

```typescript
class ErrorTrackingSystem extends EntitySystem {
  private logger = createLogger('ErrorTracker');
  private errorCounts = new Map<string, number>();

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      try {
        this.processEntity(entity);
      } catch (error) {
        this.handleError(entity, error as Error);
      }
    }
  }

  private processEntity(entity: Entity): void {
    // 模拟可能出错的实体处理
    if (Math.random() < 0.01) { // 1% 概率出错
      throw new Error(`Processing error for entity ${entity.id}`);
    }

    this.logger.debug(`成功处理实体 ${entity.id}`);
  }

  private handleError(entity: Entity, error: Error): void {
    const errorKey = error.message;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    this.logger.error(
      `实体 ${entity.id} 处理失败 (第${count + 1}次): ${error.message}`,
      {
        entityId: entity.id,
        entityName: entity.name,
        componentCount: entity.components.length,
        errorStack: error.stack
      }
    );

    // 如果同一类型错误发生太多次，升级为警告
    if (count >= 5) {
      this.logger.warn(`错误 "${errorKey}" 已发生 ${count + 1} 次，可能需要关注`);
    }

    // 如果错误次数过多，升级为致命错误
    if (count >= 20) {
      this.logger.fatal(`错误 "${errorKey}" 发生次数过多，系统可能存在严重问题`);
    }
  }

  public getErrorSummary(): void {
    this.logger.info('=== 错误统计 ===');
    for (const [error, count] of this.errorCounts) {
      this.logger.info(`${error}: ${count} 次`);
    }
  }
}
```

## 最佳实践

### 1. 合理的日志级别选择

```typescript
class LoggingBestPractices {
  private logger = createLogger('BestPractices');

  public demonstrateLogLevels(): void {
    // ✅ Debug - 详细的调试信息
    this.logger.debug('变量值', { x: 10, y: 20 });

    // ✅ Info - 重要的状态变化
    this.logger.info('系统启动完成');

    // ✅ Warn - 异常但不致命的情况
    this.logger.warn('资源未找到，使用默认值');

    // ✅ Error - 错误但程序可以继续
    this.logger.error('保存失败，将重试', new Error('Network timeout'));

    // ✅ Fatal - 致命错误，程序无法继续
    this.logger.fatal('内存不足，程序即将退出');
  }
}
```

### 2. 结构化日志数据

```typescript
class StructuredLogging {
  private logger = createLogger('Structured');

  public logWithStructuredData(): void {
    // ✅ 提供结构化的上下文信息
    this.logger.info('用户操作', {
      userId: 12345,
      action: 'move',
      position: { x: 100, y: 200 },
      timestamp: Date.now()
    });

    // ✅ 包含相关的错误上下文
    this.logger.error('数据库查询失败', {
      query: 'SELECT * FROM users',
      parameters: { id: 123 },
      connectionId: 'conn_456',
      retryCount: 3
    });
  }
}
```

### 3. 避免日志性能问题

```typescript
class PerformanceConsciousLogging {
  private logger = createLogger('Performance');

  public efficientLogging(): void {
    // ✅ 检查日志级别避免不必要的计算
    if (this.logger.debug) {
      const expensiveData = this.calculateExpensiveDebugInfo();
      this.logger.debug('详细调试信息', expensiveData);
    }

    // ❌ 避免：总是计算昂贵的日志数据
    // this.logger.debug('调试信息', this.calculateExpensiveDebugInfo());
  }

  private calculateExpensiveDebugInfo(): any {
    // 模拟昂贵的计算
    return { /* 复杂的调试数据 */ };
  }
}
```

### 4. 日志配置管理

```typescript
class LoggingConfiguration {
  public static setupLogging(): void {
    // 根据环境配置日志级别
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isDevelopment) {
      setGlobalLogLevel(LogLevel.Debug);
      setLoggerColors({
        debug: Colors.CYAN,
        info: Colors.GREEN,
        warn: Colors.YELLOW,
        error: Colors.RED,
        fatal: Colors.BRIGHT_RED
      });
    } else if (isProduction) {
      setGlobalLogLevel(LogLevel.Warn);
      // 生产环境禁用颜色
      LoggerManager.getInstance().resetColors();
    }
  }
}

// 在应用启动时配置日志
LoggingConfiguration.setupLogging();
```

日志系统是调试和监控应用的重要工具，正确使用日志系统能大大提高开发效率和问题排查能力。
