# 时间和定时器系统

ECS 框架提供了完整的时间管理和定时器系统，包括时间缩放、帧时间计算和灵活的定时器调度功能。

## Time 类

Time 类是框架的时间管理核心，提供了游戏时间相关的所有功能。

### 基本时间属性

```typescript
import { Time } from '@esengine/ecs-framework';

class GameSystem extends EntitySystem {
  protected process(entities: readonly Entity[]): void {
    // 获取帧时间（秒）
    const deltaTime = Time.deltaTime;

    // 获取未缩放的帧时间
    const unscaledDelta = Time.unscaledDeltaTime;

    // 获取游戏总时间
    const totalTime = Time.totalTime;

    // 获取当前帧数
    const frameCount = Time.frameCount;

    console.log(`第 ${frameCount} 帧，帧时间: ${deltaTime}s，总时间: ${totalTime}s`);
  }
}
```

### 时间缩放

Time 类支持时间缩放功能，可以实现慢动作、快进等效果：

```typescript
class TimeControlSystem extends EntitySystem {
  public enableSlowMotion(): void {
    // 设置为慢动作（50%速度）
    Time.timeScale = 0.5;
    console.log('慢动作模式启用');
  }

  public enableFastForward(): void {
    // 设置为快进（200%速度）
    Time.timeScale = 2.0;
    console.log('快进模式启用');
  }

  public pauseGame(): void {
    // 暂停游戏（时间静止）
    Time.timeScale = 0;
    console.log('游戏暂停');
  }

  public resumeNormalSpeed(): void {
    // 恢复正常速度
    Time.timeScale = 1.0;
    console.log('恢复正常速度');
  }

  protected process(entities: readonly Entity[]): void {
    // deltaTime 会受到 timeScale 影响
    const scaledDelta = Time.deltaTime; // 受时间缩放影响
    const realDelta = Time.unscaledDeltaTime; // 不受时间缩放影响

    for (const entity of entities) {
      const movement = entity.getComponent(Movement);
      if (movement) {
        // 使用缩放时间进行游戏逻辑更新
        movement.update(scaledDelta);
      }

      const ui = entity.getComponent(UIComponent);
      if (ui) {
        // UI 动画使用真实时间，不受游戏时间缩放影响
        ui.update(realDelta);
      }
    }
  }
}
```

### 时间检查工具

```typescript
class CooldownSystem extends EntitySystem {
  private lastAttackTime = 0;
  private lastSpawnTime = 0;

  constructor() {
    super(Matcher.all(Weapon));
  }

  protected process(entities: readonly Entity[]): void {
    // 检查攻击冷却
    if (Time.checkEvery(1.5, this.lastAttackTime)) {
      this.performAttack();
      this.lastAttackTime = Time.totalTime;
    }

    // 检查生成间隔
    if (Time.checkEvery(3.0, this.lastSpawnTime)) {
      this.spawnEnemy();
      this.lastSpawnTime = Time.totalTime;
    }
  }

  private performAttack(): void {
    console.log('执行攻击！');
  }

  private spawnEnemy(): void {
    console.log('生成敌人！');
  }
}
```

## Core.schedule 定时器系统

Core 提供了强大的定时器调度功能，可以创建一次性或重复执行的定时器。

### 基本定时器使用

```typescript
import { Core } from '@esengine/ecs-framework';

class GameScene extends Scene {
  protected initialize(): void {
    // 创建一次性定时器
    this.createOneTimeTimers();

    // 创建重复定时器
    this.createRepeatingTimers();

    // 创建带上下文的定时器
    this.createContextTimers();
  }

  private createOneTimeTimers(): void {
    // 2秒后执行一次
    Core.schedule(2.0, false, null, (timer) => {
      console.log('2秒延迟执行');
    });

    // 5秒后显示提示
    Core.schedule(5.0, false, this, (timer) => {
      const scene = timer.getContext<GameScene>();
      scene.showTip('游戏提示：5秒已过！');
    });
  }

  private createRepeatingTimers(): void {
    // 每秒重复执行
    const heartbeatTimer = Core.schedule(1.0, true, null, (timer) => {
      console.log(`游戏心跳 - 总时间: ${Time.totalTime.toFixed(1)}s`);
    });

    // 可以保存定时器引用用于后续控制
    this.saveTimerReference(heartbeatTimer);
  }

  private createContextTimers(): void {
    const gameData = { score: 0, level: 1 };

    // 每2秒增加分数
    Core.schedule(2.0, true, gameData, (timer) => {
      const data = timer.getContext<typeof gameData>();
      data.score += 10;
      console.log(`分数增加！当前分数: ${data.score}`);
    });
  }

  private saveTimerReference(timer: any): void {
    // 可以稍后停止定时器
    setTimeout(() => {
      timer.stop();
      console.log('定时器已停止');
    }, 10000); // 10秒后停止
  }

  private showTip(message: string): void {
    console.log('提示:', message);
  }
}
```

### 定时器控制

```typescript
class TimerControlExample {
  private attackTimer: any;
  private spawnerTimer: any;

  public startCombat(): void {
    // 启动攻击定时器
    this.attackTimer = Core.schedule(0.5, true, this, (timer) => {
      const self = timer.getContext<TimerControlExample>();
      self.performAttack();
    });

    // 启动敌人生成定时器
    this.spawnerTimer = Core.schedule(3.0, true, null, (timer) => {
      this.spawnEnemy();
    });
  }

  public stopCombat(): void {
    // 停止所有战斗相关定时器
    if (this.attackTimer) {
      this.attackTimer.stop();
      console.log('攻击定时器已停止');
    }

    if (this.spawnerTimer) {
      this.spawnerTimer.stop();
      console.log('生成定时器已停止');
    }
  }

  public resetAttackTimer(): void {
    // 重置攻击定时器
    if (this.attackTimer) {
      this.attackTimer.reset();
      console.log('攻击定时器已重置');
    }
  }

  private performAttack(): void {
    console.log('执行攻击');
  }

  private spawnEnemy(): void {
    console.log('生成敌人');
  }
}
```

### 复杂定时器场景

```typescript
class AdvancedTimerUsage {
  private powerUpDuration = 0;
  private powerUpActive = false;

  public activatePowerUp(): void {
    if (this.powerUpActive) {
      console.log('能力提升已激活');
      return;
    }

    this.powerUpActive = true;
    this.powerUpDuration = 10; // 10秒持续时间

    console.log('能力提升激活！');

    // 每秒更新剩余时间
    const countdownTimer = Core.schedule(1.0, true, this, (timer) => {
      const self = timer.getContext<AdvancedTimerUsage>();
      self.powerUpDuration--;

      console.log(`能力提升剩余时间: ${self.powerUpDuration}秒`);

      if (self.powerUpDuration <= 0) {
        self.deactivatePowerUp();
        timer.stop(); // 停止倒计时
      }
    });

    // 能力提升结束定时器（备用）
    Core.schedule(10.0, false, this, (timer) => {
      const self = timer.getContext<AdvancedTimerUsage>();
      if (self.powerUpActive) {
        self.deactivatePowerUp();
      }
    });
  }

  private deactivatePowerUp(): void {
    this.powerUpActive = false;
    this.powerUpDuration = 0;
    console.log('能力提升结束');
  }

  // 创建波次攻击定时器
  public startWaveAttack(): void {
    let waveCount = 0;
    const maxWaves = 5;

    const waveTimer = Core.schedule(2.0, true, { waveCount, maxWaves }, (timer) => {
      const context = timer.getContext<{ waveCount: number, maxWaves: number }>();
      context.waveCount++;

      console.log(`第 ${context.waveCount} 波攻击！`);

      if (context.waveCount >= context.maxWaves) {
        console.log('所有波次攻击完成');
        timer.stop();
      }
    });
  }

  // 创建条件定时器
  public startConditionalTimer(): void {
    Core.schedule(0.1, true, this, (timer) => {
      const self = timer.getContext<AdvancedTimerUsage>();

      // 检查某个条件
      if (self.shouldStopTimer()) {
        console.log('条件满足，停止定时器');
        timer.stop();
        return;
      }

      // 继续执行定时器逻辑
      self.performTimerAction();
    });
  }

  private shouldStopTimer(): boolean {
    // 检查停止条件
    return Time.totalTime > 30; // 30秒后停止
  }

  private performTimerAction(): void {
    console.log('执行定时器动作');
  }
}
```

## 实际应用示例

### 技能冷却系统

```typescript
class SkillCooldownSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(SkillComponent));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const skill = entity.getComponent(SkillComponent);

      // 更新技能冷却
      if (skill.isOnCooldown) {
        skill.cooldownRemaining -= Time.deltaTime;

        if (skill.cooldownRemaining <= 0) {
          skill.cooldownRemaining = 0;
          skill.isOnCooldown = false;
          console.log(`技能 ${skill.name} 冷却完成`);
        }
      }
    }
  }

  public useSkill(entity: Entity, skillName: string): boolean {
    const skill = entity.getComponent(SkillComponent);

    if (skill.isOnCooldown) {
      console.log(`技能 ${skillName} 还在冷却中，剩余 ${skill.cooldownRemaining.toFixed(1)}秒`);
      return false;
    }

    // 执行技能
    this.executeSkill(entity, skill);

    // 开始冷却
    skill.isOnCooldown = true;
    skill.cooldownRemaining = skill.cooldownDuration;

    return true;
  }

  private executeSkill(entity: Entity, skill: SkillComponent): void {
    console.log(`执行技能: ${skill.name}`);
    // 技能效果逻辑
  }
}
```

### 游戏状态定时器

```typescript
class GameStateManager {
  private gamePhase = 'preparation';
  private phaseTimer: any;

  public startGame(): void {
    this.startPreparationPhase();
  }

  private startPreparationPhase(): void {
    this.gamePhase = 'preparation';
    console.log('准备阶段开始 - 10秒准备时间');

    this.phaseTimer = Core.schedule(10.0, false, this, (timer) => {
      const self = timer.getContext<GameStateManager>();
      self.startCombatPhase();
    });
  }

  private startCombatPhase(): void {
    this.gamePhase = 'combat';
    console.log('战斗阶段开始 - 60秒战斗时间');

    this.phaseTimer = Core.schedule(60.0, false, this, (timer) => {
      const self = timer.getContext<GameStateManager>();
      self.startResultPhase();
    });

    // 每10秒刷新一波敌人
    Core.schedule(10.0, true, null, (timer) => {
      if (this.gamePhase === 'combat') {
        this.spawnEnemyWave();
      } else {
        timer.stop(); // 战斗阶段结束时停止刷新
      }
    });
  }

  private startResultPhase(): void {
    this.gamePhase = 'result';
    console.log('结算阶段开始 - 5秒结算时间');

    this.phaseTimer = Core.schedule(5.0, false, this, (timer) => {
      const self = timer.getContext<GameStateManager>();
      self.endGame();
    });
  }

  private endGame(): void {
    console.log('游戏结束');
    this.gamePhase = 'ended';
  }

  private spawnEnemyWave(): void {
    console.log('刷新敌人波次');
  }

  public getCurrentPhase(): string {
    return this.gamePhase;
  }
}
```

## 最佳实践

### 1. 合理使用时间类型

```typescript
class MovementSystem extends EntitySystem {
  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const movement = entity.getComponent(Movement);

      // ✅ 游戏逻辑使用缩放时间
      movement.position.x += movement.velocity.x * Time.deltaTime;

      // ✅ UI动画使用真实时间（不受游戏暂停影响）
      const ui = entity.getComponent(UIAnimation);
      if (ui) {
        ui.update(Time.unscaledDeltaTime);
      }
    }
  }
}
```

### 2. 定时器管理

```typescript
class TimerManager {
  private timers: any[] = [];

  public createManagedTimer(duration: number, repeats: boolean, callback: () => void): any {
    const timer = Core.schedule(duration, repeats, null, callback);
    this.timers.push(timer);
    return timer;
  }

  public stopAllTimers(): void {
    for (const timer of this.timers) {
      timer.stop();
    }
    this.timers = [];
  }

  public cleanupCompletedTimers(): void {
    this.timers = this.timers.filter(timer => !timer.isDone);
  }
}
```

### 3. 避免过多的定时器

```typescript
// ❌ 避免：为每个实体创建定时器
class BadExample extends EntitySystem {
  protected onAdded(entity: Entity): void {
    Core.schedule(1.0, true, entity, (timer) => {
      // 每个实体一个定时器，性能差
    });
  }
}

// ✅ 推荐：在系统中统一管理时间
class GoodExample extends EntitySystem {
  private lastUpdateTime = 0;

  protected process(entities: readonly Entity[]): void {
    // 每秒执行一次逻辑
    if (Time.checkEvery(1.0, this.lastUpdateTime)) {
      this.processAllEntities(entities);
      this.lastUpdateTime = Time.totalTime;
    }
  }

  private processAllEntities(entities: readonly Entity[]): void {
    // 批量处理所有实体
  }
}
```

### 4. 定时器上下文使用

```typescript
interface TimerContext {
  entityId: number;
  duration: number;
  onComplete: () => void;
}

class ContextualTimerExample {
  public createEntityTimer(entityId: number, duration: number, onComplete: () => void): void {
    const context: TimerContext = {
      entityId,
      duration,
      onComplete
    };

    Core.schedule(duration, false, context, (timer) => {
      const ctx = timer.getContext<TimerContext>();
      console.log(`实体 ${ctx.entityId} 的定时器完成`);
      ctx.onComplete();
    });
  }
}
```

时间和定时器系统是游戏开发中的重要工具，正确使用这些功能能让你的游戏逻辑更加精确和可控。