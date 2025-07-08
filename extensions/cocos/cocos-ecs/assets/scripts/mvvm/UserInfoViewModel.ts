import { ViewModel, observable, computed, command, viewModel } from '@esengine/mvvm-ui-framework';

/**
 * 用户信息视图模型
 * 展示如何使用 MVVM 框架进行数据绑定
 */
@viewModel
export class UserInfoViewModel extends ViewModel {
    
    public get name(): string {
        return 'UserInfoViewModel';
    }

    /**
     * 用户名 - 使用 @observable 装饰器自动处理数据绑定
     */
    @observable
    userName: string = '未知用户';

    /**
     * 用户等级
     */
    level: number = 1;

    /**
     * 用户分数
     */
    @observable
    score: number = 0;

    /**
     * 用户金币
     */
    @observable
    coins: number = 100;

    /**
     * 是否在线
     */
    @observable
    isOnline: boolean = false;

    /**
     * 计算属性：用户显示名称（格式化）
     */
    @computed(['userName', 'level'])
    get displayName(): string {
        return `${this.userName} (Lv.${this.level})`;
    }

    /**
     * 计算属性：在线状态文本
     */
    @computed(['isOnline'])
    get onlineStatusText(): string {
        return this.isOnline ? '在线' : '离线';
    }

    /**
     * 计算属性：总资产（分数 + 金币）
     */
    @computed(['score', 'coins'])
    get totalAssets(): number {
        return this.score + this.coins;
    }

    /**
     * 增加分数 - 使用 @command 装饰器，可以通过 executeCommand('addScore') 调用
     */
    @command()
    public addScore(amount: number = 10): void {
        this.score += amount;
    }

    

    /**
     * 增加金币 - 带有 canExecute 逻辑的命令
     */
    @command('canAddCoins')
    public addCoins(amount: number = 5): void {
        this.coins += amount;
    }

    /**
     * 检查是否可以增加金币（例如：等级必须大于 1）
     */
    public canAddCoins(): boolean {
        return this.level > 1;
    }

    /**
     * 升级 - 带有复杂 canExecute 逻辑的命令
     */
    @command('canLevelUp')
    public levelUp(): void {
        this.level += 1;
        this.score += this.level * 100; // 升级奖励
    }

    /**
     * 检查是否可以升级（例如：需要足够的分数）
     */
    public canLevelUp(): boolean {
        return this.score >= this.level * 100;
    }

    /**
     * 切换在线状态
     */
    @command()
    public toggleOnlineStatus(): void {
        this.isOnline = !this.isOnline;
    }

    /**
     * 重置用户数据
     */
    public resetUserData(): void {
        this.batchUpdate({
            userName: '新用户',
            level: 1,
            score: 0,
            coins: 100,
            isOnline: false
        });
    }
} 