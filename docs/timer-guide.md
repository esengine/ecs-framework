# 定时器系统使用指南

定时器系统是游戏开发中的重要工具，用于处理延迟执行、重复任务、倒计时等功能。本指南详细介绍如何使用ECS框架的定时器系统。

## 定时器基础概念

### 什么是定时器？

定时器允许你：
- ⏰ **延迟执行** - 在指定时间后执行某个操作
- 🔄 **重复执行** - 定期重复执行某个操作  
- 🛑 **取消执行** - 在执行前取消定时器
-  **精确控制** - 精确控制执行时机

### 定时器的优势

相比直接在游戏循环中计时，定时器系统提供：
- 🧹 **自动管理** - 自动处理定时器的生命周期
-  **游戏时间控制** - 支持游戏暂停、时间缩放
- 💾 **内存优化** - 自动回收完成的定时器
-  **易于使用** - 简单的API调用

## 基础定时器使用

### 1. 简单延迟执行

```typescript
import { Core, Timer } from '@esengine/ecs-framework';

// 3秒后执行一次
Core.schedule(3.0, false, this, (timer) => {
    console.log("3秒钟到了！");
});

// 实际游戏例子：延迟显示提示
class GameTutorial {
    startTutorial() {
        // 2秒后显示第一个提示
        Core.schedule(2.0, false, this, () => {
            this.showTip("欢迎来到游戏世界！");
        });
        
        // 5秒后显示移动提示
        Core.schedule(5.0, false, this, () => {
            this.showTip("使用WASD键移动角色");
        });
        
        // 8秒后显示攻击提示
        Core.schedule(8.0, false, this, () => {
            this.showTip("按空格键攻击敌人");
        });
    }
    
    private showTip(message: string) {
        // 显示提示的逻辑
        console.log(`提示: ${message}`);
    }
}
```

### 2. 重复执行

```typescript
// 每1秒执行一次，持续执行
const repeatTimer = Core.schedule(1.0, true, this, (timer) => {
    console.log("每秒执行一次");
});

// 实际游戏例子：生命值恢复
class HealthRegeneration {
    private regenTimer: ITimer;
    
    startRegeneration(entity: Entity) {
        const health = entity.getComponent(HealthComponent);
        
        // 每2秒恢复5点生命值
        this.regenTimer = Core.schedule(2.0, true, this, () => {
            if (health.currentHealth < health.maxHealth) {
                health.currentHealth += 5;
                health.currentHealth = Math.min(health.currentHealth, health.maxHealth);
                
                console.log(`生命值恢复：${health.currentHealth}/${health.maxHealth}`);
                
                // 满血时停止恢复
                if (health.currentHealth >= health.maxHealth) {
                    this.stopRegeneration();
                }
            }
        });
    }
    
    stopRegeneration() {
        if (this.regenTimer) {
            this.regenTimer.stop();
            this.regenTimer = null;
        }
    }
}
```

### 3. 获取定时器引用进行控制

```typescript
import { ITimer } from '@esengine/ecs-framework';

class BombTimer {
    private bombTimer: ITimer;
    private explosionTime: number = 5.0;
    
    startBomb(position: { x: number; y: number }) {
        console.log("炸弹已放置！5秒后爆炸...");
        
        // 创建定时器并保存引用
        this.bombTimer = Core.schedule(this.explosionTime, false, this, () => {
            this.explode(position);
        });
    }
    
    defuseBomb() {
        if (this.bombTimer && !this.bombTimer.isDone) {
            // 拆除炸弹
            this.bombTimer.stop();
            console.log("炸弹已被拆除！");
        }
    }
    
    getRemainingTime(): number {
        if (this.bombTimer && !this.bombTimer.isDone) {
            return this.explosionTime - this.bombTimer.elapsedTime;
        }
        return 0;
    }
    
    private explode(position: { x: number; y: number }) {
        console.log("💥 炸弹爆炸了！");
        // 爆炸效果逻辑...
    }
}
```

## 高级定时器功能

### 1. 定时器链 - 顺序执行多个任务

```typescript
class CutsceneManager {
    playCutscene() {
        // 第一个镜头：2秒
        Core.schedule(2.0, false, this, () => {
            this.showScene("开场镜头");
            
            // 第二个镜头：3秒后
            Core.schedule(3.0, false, this, () => {
                this.showScene("角色登场");
                
                // 第三个镜头：2秒后
                Core.schedule(2.0, false, this, () => {
                    this.showScene("背景介绍");
                    
                    // 结束：1秒后
                    Core.schedule(1.0, false, this, () => {
                        this.endCutscene();
                    });
                });
            });
        });
    }
    
    private showScene(sceneName: string) {
        console.log(`播放场景: ${sceneName}`);
    }
    
    private endCutscene() {
        console.log("过场动画结束，开始游戏！");
    }
}

// 更优雅的链式写法
class ImprovedCutsceneManager {
    playCutscene() {
        this.scheduleSequence([
            { delay: 2.0, action: () => this.showScene("开场镜头") },
            { delay: 3.0, action: () => this.showScene("角色登场") },
            { delay: 2.0, action: () => this.showScene("背景介绍") },
            { delay: 1.0, action: () => this.endCutscene() }
        ]);
    }
    
    private scheduleSequence(sequence: Array<{delay: number, action: () => void}>) {
        let currentDelay = 0;
        
        sequence.forEach(step => {
            currentDelay += step.delay;
            Core.schedule(currentDelay, false, this, step.action);
        });
    }
}
```

### 2. 条件定时器 - 满足条件时执行

```typescript
class ConditionalTimer {
    waitForCondition(
        condition: () => boolean,
        action: () => void,
        checkInterval: number = 0.1,
        timeout: number = 10.0
    ) {
        let timeElapsed = 0;
        
        const checkTimer = Core.schedule(checkInterval, true, this, () => {
            timeElapsed += checkInterval;
            
            if (condition()) {
                // 条件满足，执行动作并停止检查
                checkTimer.stop();
                action();
            } else if (timeElapsed >= timeout) {
                // 超时，停止检查
                checkTimer.stop();
                console.log("等待条件超时");
            }
        });
    }
}

// 使用例子
class WaitForPlayerExample {
    waitForPlayerToReachGoal() {
        const player = this.getPlayer();
        const goalPosition = { x: 500, y: 300 };
        
        this.waitForCondition(
            // 条件：玩家到达目标位置
            () => {
                const playerPos = player.getComponent(PositionComponent);
                return playerPos.distanceTo(goalPosition) < 50;
            },
            // 动作：触发下一关
            () => {
                console.log("玩家到达目标！开始下一关");
                this.loadNextLevel();
            },
            0.1,  // 每0.1秒检查一次
            30.0  // 30秒后超时
        );
    }
}
```

### 3. 可暂停的定时器

```typescript
class PausableTimer {
    private timers: ITimer[] = [];
    private isPaused: boolean = false;
    
    schedule(delay: number, repeat: boolean, callback: () => void): ITimer {
        const timer = Core.schedule(delay, repeat, this, callback);
        this.timers.push(timer);
        return timer;
    }
    
    pauseAll() {
        this.isPaused = true;
        this.timers.forEach(timer => {
            if (!timer.isDone) {
                timer.stop();
            }
        });
    }
    
    resumeAll() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        // 重新启动所有未完成的定时器
        // 注意：这是简化实现，实际需要保存剩余时间
        this.timers = this.timers.filter(timer => !timer.isDone);
    }
    
    clearAll() {
        this.timers.forEach(timer => timer.stop());
        this.timers = [];
    }
}

// 游戏暂停系统
class GamePauseSystem {
    private gameTimers: PausableTimer = new PausableTimer();
    private isGamePaused: boolean = false;
    
    pauseGame() {
        if (this.isGamePaused) return;
        
        this.isGamePaused = true;
        this.gameTimers.pauseAll();
        
        // 显示暂停菜单
        this.showPauseMenu();
    }
    
    resumeGame() {
        if (!this.isGamePaused) return;
        
        this.isGamePaused = false;
        this.gameTimers.resumeAll();
        
        // 隐藏暂停菜单
        this.hidePauseMenu();
    }
    
    scheduleGameTimer(delay: number, repeat: boolean, callback: () => void) {
        return this.gameTimers.schedule(delay, repeat, callback);
    }
}
```

## 实际游戏应用示例

### 1. Buff/Debuff 系统

```typescript
class BuffSystem {
    applyBuff(entity: Entity, buffType: string, duration: number) {
        const buff = new BuffComponent(buffType, duration);
        entity.addComponent(buff);
        
        // 应用Buff效果
        this.applyBuffEffect(entity, buffType);
        
        // 设置定时器移除Buff
        Core.schedule(duration, false, this, () => {
            if (!entity.isDestroyed && entity.hasComponent(BuffComponent)) {
                this.removeBuff(entity, buffType);
            }
        });
        
        console.log(`应用了 ${buffType} Buff，持续时间 ${duration} 秒`);
    }
    
    private applyBuffEffect(entity: Entity, buffType: string) {
        const stats = entity.getComponent(StatsComponent);
        
        switch (buffType) {
            case 'speed_boost':
                stats.moveSpeed *= 1.5;
                break;
            case 'damage_boost':
                stats.damage *= 2.0;
                break;
            case 'invincible':
                entity.addComponent(new InvincibleComponent());
                break;
        }
    }
    
    private removeBuff(entity: Entity, buffType: string) {
        const buff = entity.getComponent(BuffComponent);
        if (buff && buff.buffType === buffType) {
            entity.removeComponent(buff);
            this.removeBuffEffect(entity, buffType);
            console.log(`${buffType} Buff 已过期`);
        }
    }
}
```

### 2. 技能冷却系统

```typescript
class SkillSystem {
    private cooldowns: Map<string, number> = new Map();
    
    useSkill(player: Entity, skillName: string): boolean {
        // 检查冷却
        if (this.isOnCooldown(skillName)) {
            const remainingTime = this.getCooldownRemaining(skillName);
            console.log(`技能冷却中，还需 ${remainingTime.toFixed(1)} 秒`);
            return false;
        }
        
        // 执行技能
        this.executeSkill(player, skillName);
        
        // 启动冷却
        const cooldownTime = this.getSkillCooldown(skillName);
        this.startCooldown(skillName, cooldownTime);
        
        return true;
    }
    
    private startCooldown(skillName: string, duration: number) {
        const endTime = Time.totalTime + duration;
        this.cooldowns.set(skillName, endTime);
        
        // 设置定时器清理冷却
        Core.schedule(duration, false, this, () => {
            this.cooldowns.delete(skillName);
            console.log(`技能 ${skillName} 冷却完成！`);
        });
    }
    
    private isOnCooldown(skillName: string): boolean {
        const endTime = this.cooldowns.get(skillName);
        return endTime !== undefined && Time.totalTime < endTime;
    }
    
    private getCooldownRemaining(skillName: string): number {
        const endTime = this.cooldowns.get(skillName);
        return endTime ? Math.max(0, endTime - Time.totalTime) : 0;
    }
    
    private executeSkill(player: Entity, skillName: string) {
        switch (skillName) {
            case 'fireball':
                this.castFireball(player);
                break;
            case 'heal':
                this.castHeal(player);
                break;
            case 'dash':
                this.performDash(player);
                break;
        }
    }
    
    private getSkillCooldown(skillName: string): number {
        const cooldowns = {
            'fireball': 3.0,
            'heal': 10.0,
            'dash': 5.0
        };
        return cooldowns[skillName] || 1.0;
    }
}
```

### 3. 关卡时间限制

```typescript
class LevelTimer {
    private timeLimit: number;
    private timeRemaining: number;
    private timerActive: boolean = false;
    private updateTimer: ITimer;
    
    startLevel(timeLimitSeconds: number) {
        this.timeLimit = timeLimitSeconds;
        this.timeRemaining = timeLimitSeconds;
        this.timerActive = true;
        
        // 每秒更新倒计时
        this.updateTimer = Core.schedule(1.0, true, this, () => {
            this.updateCountdown();
        });
        
        console.log(`关卡开始！时间限制：${timeLimitSeconds} 秒`);
    }
    
    private updateCountdown() {
        if (!this.timerActive) return;
        
        this.timeRemaining--;
        
        // 更新UI显示
        this.updateTimerUI(this.timeRemaining);
        
        // 时间警告
        if (this.timeRemaining === 30) {
            console.log("⚠️ 警告：还剩30秒！");
            this.playWarningSound();
        } else if (this.timeRemaining === 10) {
            console.log("🚨 紧急：还剩10秒！");
            this.playUrgentSound();
        }
        
        // 时间到
        if (this.timeRemaining <= 0) {
            this.timeUp();
        }
    }
    
    private timeUp() {
        this.timerActive = false;
        this.updateTimer.stop();
        
        console.log("⏰ 时间到！游戏结束");
        
        // 触发游戏结束（需要在实际使用中获取EntityManager实例）
        // 示例：entityManager.eventBus.emit('level:timeout');
        console.log('触发关卡超时事件');
    }
    
    completeLevel() {
        if (this.timerActive) {
            this.timerActive = false;
            this.updateTimer.stop();
            
            const completionTime = this.timeLimit - this.timeRemaining;
            console.log(` 关卡完成！用时：${completionTime} 秒`);
            
            // 根据剩余时间给予奖励
            this.calculateTimeBonus(this.timeRemaining);
        }
    }
    
    private calculateTimeBonus(timeLeft: number) {
        const bonus = Math.floor(timeLeft * 10); // 每秒剩余10分
        if (bonus > 0) {
            console.log(`时间奖励：${bonus} 分`);
            // 触发时间奖励事件（需要在实际使用中获取EntityManager实例）
            // 示例：entityManager.eventBus.emit('score:time_bonus', { bonus });
        }
    }
    
    getTimeRemaining(): number {
        return this.timeRemaining;
    }
    
    getTimeRemainingFormatted(): string {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
```

## 定时器性能优化

### 1. 定时器池化

```typescript
class TimerPool {
    private static instance: TimerPool;
    private timerPool: ITimer[] = [];
    
    static getInstance(): TimerPool {
        if (!this.instance) {
            this.instance = new TimerPool();
        }
        return this.instance;
    }
    
    getTimer(): ITimer {
        return this.timerPool.pop() || this.createTimer();
    }
    
    releaseTimer(timer: ITimer) {
        timer.stop();
        this.timerPool.push(timer);
    }
    
    private createTimer(): ITimer {
        // 创建新定时器的逻辑
        return new Timer();
    }
}
```

### 2. 批量定时器管理

```typescript
class BatchTimerManager {
    private timers: Set<ITimer> = new Set();
    
    scheduleMany(configs: Array<{delay: number, repeat: boolean, callback: () => void}>) {
        return configs.map(config => {
            const timer = Core.schedule(config.delay, config.repeat, this, config.callback);
            this.timers.add(timer);
            return timer;
        });
    }
    
    stopAll() {
        this.timers.forEach(timer => timer.stop());
        this.timers.clear();
    }
    
    cleanup() {
        // 清理已完成的定时器
        this.timers.forEach(timer => {
            if (timer.isDone) {
                this.timers.delete(timer);
            }
        });
    }
}
```

## 常见问题和最佳实践

### Q: 定时器会自动清理吗？

A: 是的，完成的定时器会自动清理。但如果需要提前停止，记得调用 `timer.stop()`。

### Q: 定时器会受到游戏暂停影响吗？

A: 定时器使用游戏时间，如果实现了时间缩放功能，定时器会相应调整。

### Q: 如何实现精确的帧同步定时器？

A: 使用帧计数而不是时间：

```typescript
class FrameTimer {
    private frameCount: number = 0;
    private targetFrame: number;
    
    scheduleFrames(frames: number, callback: () => void) {
        this.targetFrame = this.frameCount + frames;
        
        const checkFrame = () => {
            this.frameCount++;
            if (this.frameCount >= this.targetFrame) {
                callback();
            } else {
                requestAnimationFrame(checkFrame);
            }
        };
        
        requestAnimationFrame(checkFrame);
    }
}
```

### Q: 如何避免定时器内存泄漏？

A: 
1. 及时停止不需要的定时器
2. 在对象销毁时清理所有定时器
3. 使用弱引用避免循环引用

```typescript
class SafeTimerUser {
    private timers: ITimer[] = [];
    
    scheduleTimer(delay: number, callback: () => void) {
        const timer = Core.schedule(delay, false, this, callback);
        this.timers.push(timer);
        return timer;
    }
    
    destroy() {
        // 清理所有定时器
        this.timers.forEach(timer => timer.stop());
        this.timers = [];
    }
}
```

定时器是游戏开发中非常有用的工具，合理使用可以让你的游戏逻辑更加优雅和高效！ 