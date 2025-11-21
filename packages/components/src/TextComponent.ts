import { Component, ECSComponent, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 文本对齐方式
 */
export enum TextAlignment {
    Left = 'left',
    Center = 'center',
    Right = 'right'
}

/**
 * 文本组件 - 管理文本渲染
 */
@ECSComponent('Text')
@Serializable({ version: 1, typeId: 'Text' })
export class TextComponent extends Component {
    /** 文本内容 */
    @Serialize() public text: string = '';

    /** 字体 */
    @Serialize() public font: string = 'Arial';

    /** 字体大小 */
    @Serialize() public fontSize: number = 16;

    /** 颜色 */
    @Serialize() public color: string = '#ffffff';

    /** 对齐方式 */
    @Serialize() public alignment: TextAlignment = TextAlignment.Left;

    /** 行高 */
    @Serialize() public lineHeight: number = 1.2;

    /** 是否加粗 */
    @Serialize() public bold: boolean = false;

    /** 是否斜体 */
    @Serialize() public italic: boolean = false;

    constructor(text: string = '') {
        super();
        this.text = text;
    }
}
