import { _decorator, Component, Label, Button } from 'cc';
import { DataBinding, BindingType, BindingMode } from '@esengine/mvvm-ui-framework';
import { TestViewModel } from './TestViewModel';

const { ccclass, property } = _decorator;

@ccclass('TestView')
export class TestView extends Component {
    
    @property(Label)
    testLabel: Label = null!;

    @property(Button)
    testButton: Button = null!;

    private viewModel: TestViewModel;
    private dataBinding: DataBinding;
    private bindingId: string = '';

    onLoad() {
        console.log('TestView onLoad');
        
        // 初始化数据绑定系统
        this.dataBinding = DataBinding.getInstance();
        
        // 创建 ViewModel
        this.viewModel = new TestViewModel();
        console.log('创建 ViewModel:', this.viewModel);
        
        // 手动添加观察者来测试
        this.viewModel.addObserver('testValue', (newValue, oldValue, property) => {
            console.log(`属性 ${property} 变化: ${oldValue} -> ${newValue}`);
            if (this.testLabel) {
                this.testLabel.string = '测试值: ' + newValue;
                console.log('手动更新 Label 文本:', this.testLabel.string);
            }
        });
        
        // 设置数据绑定
        this.setupDataBinding();
        
        // 设置按钮事件
        this.setupButtonEvent();
        
        // 测试初始值
        console.log('初始值:', this.viewModel.testValue);
    }

    private setupDataBinding(): void {
        if (this.testLabel) {
            console.log('设置数据绑定');
            console.log('Label 对象:', this.testLabel);
            console.log('Label 初始文本:', this.testLabel.string);
            
            this.bindingId = this.dataBinding.bind(this.viewModel, this.testLabel, {
                type: BindingType.ONE_WAY,
                mode: BindingMode.FORMAT,
                source: 'testValue',
                target: 'string',
                format: '测试值: {0}'
            });
            console.log('绑定ID:', this.bindingId);
            
            // 手动测试一下绑定是否工作
            this.testLabel.string = '测试值: ' + this.viewModel.testValue;
            console.log('手动设置后的文本:', this.testLabel.string);
        }
    }

    private setupButtonEvent(): void {
        if (this.testButton) {
            this.testButton.node.on(Button.EventType.CLICK, () => {
                console.log('按钮点击');
                this.viewModel.addValue();
            });
        }
    }

    onDestroy() {
        if (this.bindingId) {
            this.dataBinding.unbind(this.bindingId);
        }
        if (this.viewModel) {
            this.viewModel.destroy();
        }
    }
} 