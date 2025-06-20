import { _decorator, Component, Node, Label, Button, Canvas, UITransform, Widget, Layout, Sprite, Color } from 'cc';
import { BehaviorTreeExample } from './BehaviorTreeExample';

const { ccclass, property } = _decorator;

/**
 * 行为树测试场景
 * 自动创建UI界面用于测试行为树
 */
@ccclass('BehaviorTreeTestScene')
export class BehaviorTreeTestScene extends Component {

    onLoad() {
        this.createTestUI();
    }

    private createTestUI() {
        // 创建Canvas
        const canvasNode = new Node('BehaviorTreeTestCanvas');
        canvasNode.addComponent(Canvas);
        canvasNode.addComponent(UITransform);
        canvasNode.parent = this.node;

        // 创建背景
        const backgroundNode = new Node('Background');
        const backgroundTransform = backgroundNode.addComponent(UITransform);
        backgroundTransform.setContentSize(1920, 1080);
        const backgroundSprite = backgroundNode.addComponent(Sprite);
        backgroundSprite.color = new Color(40, 40, 40, 255);
        backgroundNode.parent = canvasNode;

        // 设置Widget组件使背景充满整个画布
        const backgroundWidget = backgroundNode.addComponent(Widget);
        backgroundWidget.isAlignTop = true;
        backgroundWidget.isAlignBottom = true;
        backgroundWidget.isAlignLeft = true;
        backgroundWidget.isAlignRight = true;

        // 创建主容器
        const mainContainer = new Node('MainContainer');
        const mainTransform = mainContainer.addComponent(UITransform);
        mainTransform.setContentSize(1600, 900);
        mainContainer.parent = canvasNode;

        // 设置主容器居中
        const mainWidget = mainContainer.addComponent(Widget);
        mainWidget.isAlignHorizontalCenter = true;
        mainWidget.isAlignVerticalCenter = true;

        // 设置主容器的Layout
        const mainLayout = mainContainer.addComponent(Layout);
        mainLayout.type = Layout.Type.VERTICAL;
        mainLayout.spacingY = 20;
        mainLayout.paddingTop = 50;
        mainLayout.paddingBottom = 50;
        mainLayout.paddingLeft = 50;
        mainLayout.paddingRight = 50;

        // 创建标题
        const titleNode = this.createText('简化API行为树测试器', 48, Color.WHITE);
        titleNode.parent = mainContainer;

        // 创建状态显示区域
        const statusContainer = new Node('StatusContainer');
        const statusTransform = statusContainer.addComponent(UITransform);
        statusTransform.setContentSize(1500, 80);
        statusContainer.parent = mainContainer;

        const statusLayout = statusContainer.addComponent(Layout);
        statusLayout.type = Layout.Type.HORIZONTAL;
        statusLayout.spacingX = 20;

        // 状态标签
        const statusLabelNode = this.createText('状态: 初始化中...', 24, Color.YELLOW);
        statusLabelNode.parent = statusContainer;

        // 创建控制按钮区域
        const buttonContainer = new Node('ButtonContainer');
        const buttonTransform = buttonContainer.addComponent(UITransform);
        buttonTransform.setContentSize(1500, 80);
        buttonContainer.parent = mainContainer;

        const buttonLayout = buttonContainer.addComponent(Layout);
        buttonLayout.type = Layout.Type.HORIZONTAL;
        buttonLayout.spacingX = 20;

        // 创建控制按钮
        const startButton = this.createButton('开始执行', Color.GREEN);
        const stopButton = this.createButton('停止', Color.RED);
        const pauseButton = this.createButton('暂停', Color.YELLOW);
        const resumeButton = this.createButton('恢复', Color.BLUE);

        startButton.parent = buttonContainer;
        stopButton.parent = buttonContainer;
        pauseButton.parent = buttonContainer;
        resumeButton.parent = buttonContainer;

        // 创建说明区域
        const infoContainer = new Node('InfoContainer');
        const infoTransform = infoContainer.addComponent(UITransform);
        infoTransform.setContentSize(1500, 60);
        infoContainer.parent = mainContainer;

        const infoNode = this.createText('使用新的简化API - 一行代码完成所有初始化！', 18, Color.CYAN);
        infoNode.parent = infoContainer;

        // 创建日志显示区域
        const logContainer = new Node('LogContainer');
        const logTransform = logContainer.addComponent(UITransform);
        logTransform.setContentSize(1500, 600);
        logContainer.parent = mainContainer;

        // 日志背景
        const logBackground = new Node('LogBackground');
        const logBgTransform = logBackground.addComponent(UITransform);
        logBgTransform.setContentSize(1500, 600);
        const logBgSprite = logBackground.addComponent(Sprite);
        logBgSprite.color = new Color(20, 20, 20, 255);
        logBackground.parent = logContainer;

        // 日志文本
        const logLabelNode = this.createText('等待行为树配置加载...', 16, Color.CYAN);
        const logLabel = logLabelNode.getComponent(Label);
        logLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
        logLabel.verticalAlign = Label.VerticalAlign.TOP;
        logLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        const logTransformComp = logLabelNode.getComponent(UITransform);
        logTransformComp.setContentSize(1450, 550);
        logLabelNode.parent = logContainer;

        // 设置日志文本位置
        const logWidget = logLabelNode.addComponent(Widget);
        logWidget.isAlignTop = true;
        logWidget.isAlignLeft = true;
        logWidget.top = 25;
        logWidget.left = 25;

        // 添加BehaviorTreeExample组件
        const behaviorTreeExample = this.node.addComponent(BehaviorTreeExample);
        behaviorTreeExample.statusLabel = statusLabelNode.getComponent(Label);
        behaviorTreeExample.logLabel = logLabel;
        behaviorTreeExample.startButton = startButton.getComponent(Button);
        behaviorTreeExample.stopButton = stopButton.getComponent(Button);
        behaviorTreeExample.pauseButton = pauseButton.getComponent(Button);
        behaviorTreeExample.resumeButton = resumeButton.getComponent(Button);

        // 初始化按钮状态
        stopButton.getComponent(Button).interactable = false;
        pauseButton.getComponent(Button).interactable = false;
        resumeButton.getComponent(Button).interactable = false;
        startButton.getComponent(Button).interactable = false; // 等待行为树配置加载完成

        console.log('行为树测试UI创建完成');
    }

    private createText(text: string, fontSize: number, color: Color): Node {
        const textNode = new Node('Text');
        const textTransform = textNode.addComponent(UITransform);
        
        const label = textNode.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.color = color;
        label.lineHeight = fontSize + 4;
        
        // 根据文本内容调整大小
        const estimatedWidth = Math.max(200, text.length * fontSize * 0.6);
        textTransform.setContentSize(estimatedWidth, fontSize + 10);
        
        return textNode;
    }

    private createButton(text: string, color: Color): Node {
        const buttonNode = new Node('Button');
        const buttonTransform = buttonNode.addComponent(UITransform);
        buttonTransform.setContentSize(180, 60);

        // 按钮背景
        const buttonSprite = buttonNode.addComponent(Sprite);
        buttonSprite.color = color;

        // 按钮组件
        const button = buttonNode.addComponent(Button);
        button.target = buttonNode;

        // 按钮文本
        const labelNode = new Node('Label');
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(170, 50);
        
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 20;
        label.color = Color.WHITE;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        
        labelNode.parent = buttonNode;

        return buttonNode;
    }
} 