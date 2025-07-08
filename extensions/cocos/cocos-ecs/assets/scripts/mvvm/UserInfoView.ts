import { _decorator, Component, Node, Label, Button } from 'cc';
import { DataBinding, BindingType, BindingMode } from '@esengine/mvvm-ui-framework';
import { UserInfoViewModel } from './UserInfoViewModel';

const { ccclass, property } = _decorator;

/**
 * 用户信息视图组件
 * 展示如何使用 MVVM 框架进行 Label 数据绑定
 */
@ccclass('UserInfoView')
export class UserInfoView extends Component {
    
    @property(Label)
    userNameLabel: Label = null!;

    @property(Label)
    levelLabel: Label = null!;

    @property(Label)
    scoreLabel: Label = null!;

    @property(Label)
    coinsLabel: Label = null!;

    @property(Label)
    onlineStatusLabel: Label = null!;

    @property(Label)
    displayNameLabel: Label = null!;

    @property(Label)
    totalAssetsLabel: Label = null!;

    @property(Button)
    addScoreButton: Button = null!;

    @property(Button)
    addCoinsButton: Button = null!;

    @property(Button)
    levelUpButton: Button = null!;

    @property(Button)
    toggleOnlineButton: Button = null!;

    @property(Button)
    resetButton: Button = null!;

    private viewModel: UserInfoViewModel;
    private dataBinding: DataBinding;
    private bindingIds: string[] = [];

    onLoad() {
        // 初始化数据绑定系统
        this.dataBinding = DataBinding.getInstance();
        
        // 创建 ViewModel
        this.viewModel = new UserInfoViewModel();
        
        // 设置数据绑定
        this.setupDataBindings();
        
        // 设置按钮事件
        this.setupButtonEvents();
    }

    /**
     * 设置数据绑定
     */
    private setupDataBindings(): void {
        // 用户名绑定
        if (this.userNameLabel) {
            const bindingId = this.dataBinding.bind(this.viewModel, this.userNameLabel, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'userName',
                target: 'string'
            });
            this.bindingIds.push(bindingId);

            
            this.dataBinding.bind(this.viewModel, this.coinsLabel, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'price',
                target: 'string',
                converter: 'currency', // 货币转换器
                converterParams: ['USD', 2], // 美元，2位小数
                format: '价格: {0}'
            });

            this.dataBinding.registerConverter('currency', {
                convert: (value: number) => `${(value * 100).toFixed(1)}%`,
                convertBack: (value: string) => parseFloat(value) / 100
            });
        }

        // 等级绑定（使用格式化）
        if (this.levelLabel) {
            const bindingId = this.dataBinding.bind(this.viewModel, this.levelLabel, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'level',
                target: 'string',
                format: '等级: {0}'
            });
            this.bindingIds.push(bindingId);
        }

        // 分数绑定（使用数字转换器）
        if (this.scoreLabel) {
            const bindingId = this.dataBinding.bind(this.viewModel, this.scoreLabel, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'score',
                target: 'string',
                converter: 'number',
                format: '分数: {0}'
            });
            this.bindingIds.push(bindingId);
        }

        // 金币绑定（使用数字转换器）
        if (this.coinsLabel) {
            const bindingId = this.dataBinding.bind(this.viewModel, this.coinsLabel, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'coins',
                target: 'string',
                converter: 'number',
                format: '金币: {0}'
            });
            this.bindingIds.push(bindingId);
        }

        // 在线状态绑定
        if (this.onlineStatusLabel) {
            const bindingId = this.dataBinding.bind(this.viewModel, this.onlineStatusLabel, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'onlineStatusText',
                target: 'string',
                format: '状态: {0}'
            });
            this.bindingIds.push(bindingId);
        }

        // 显示名称绑定（计算属性）
        if (this.displayNameLabel) {
            const bindingId = this.dataBinding.bind(this.viewModel, this.displayNameLabel, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.REPLACE,
                source: 'displayName',
                target: 'string'
            });
            this.bindingIds.push(bindingId);
        }

        // 总资产绑定（计算属性）
        if (this.totalAssetsLabel) {
            const bindingId = this.dataBinding.bind(this.viewModel, this.totalAssetsLabel, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'totalAssets',
                target: 'string',
                converter: 'number',
                format: '总资产: {0}'
            });
            this.bindingIds.push(bindingId);
        }
    }

    /**
     * 设置按钮事件
     */
    private setupButtonEvents(): void {
        // 增加分数按钮 - 直接调用方法
        if (this.addScoreButton) {
            this.addScoreButton.node.on(Button.EventType.CLICK, () => {
                this.viewModel.executeCommand('addScore');
            });
        }

        // 增加金币按钮 - 使用命令系统，支持 canExecute 检查
        if (this.addCoinsButton) {
            this.addCoinsButton.node.on(Button.EventType.CLICK, () => {
                // 检查命令是否可以执行
                if (this.viewModel.canExecuteCommand('addCoins')) {
                    this.viewModel.executeCommand('addCoins');
                } else {
                    console.log('等级太低，无法获得金币！');
                }
            });
        }

        // 升级按钮 - 使用命令系统，支持 canExecute 检查
        if (this.levelUpButton) {
            this.levelUpButton.node.on(Button.EventType.CLICK, () => {
                // 检查命令是否可以执行
                if (this.viewModel.canExecuteCommand('levelUp')) {
                    this.viewModel.executeCommand('levelUp');
                } else {
                    console.log('分数不足，无法升级！');
                }
            });
        }

        // 切换在线状态按钮 - 直接调用方法
        if (this.toggleOnlineButton) {
            this.toggleOnlineButton.node.on(Button.EventType.CLICK, () => {
                this.viewModel.toggleOnlineStatus();
            });
        }

        // 重置按钮 - 直接调用方法
        if (this.resetButton) {
            this.resetButton.node.on(Button.EventType.CLICK, () => {
                this.viewModel.resetUserData();
            });

        }
    }

    /**
     * 手动更新用户信息（演示用）
     */
    public updateUserInfo(): void {
        // 可以通过代码直接修改 ViewModel 的属性
        // 绑定的 Label 会自动更新
        this.viewModel.userName = '测试用户' + Math.floor(Math.random() * 1000);
        this.viewModel.level = Math.floor(Math.random() * 50) + 1;
        this.viewModel.score = Math.floor(Math.random() * 10000);
        this.viewModel.coins = Math.floor(Math.random() * 1000);
        this.viewModel.isOnline = Math.random() > 0.5;
    }

    /**
     * 获取当前 ViewModel
     */
    public getViewModel(): UserInfoViewModel {
        return this.viewModel;
    }

    onDestroy() {
        // 清理绑定
        for (const bindingId of this.bindingIds) {
            this.dataBinding.unbind(bindingId);
        }
        this.bindingIds = [];

        // 销毁 ViewModel
        if (this.viewModel) {
            this.viewModel.destroy();
        }
    }
} 