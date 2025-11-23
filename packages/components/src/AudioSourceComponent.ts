import { Component, ECSComponent, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 音频源组件 - 管理音频播放
 */
@ECSComponent('AudioSource')
@Serializable({ version: 1, typeId: 'AudioSource' })
export class AudioSourceComponent extends Component {
    /** 音频资源路径 */
    @Serialize() public clip: string = '';

    /** 音量 (0-1) */
    @Serialize() public volume: number = 1;

    /** 音调 */
    @Serialize() public pitch: number = 1;

    /** 是否循环 */
    @Serialize() public loop: boolean = false;

    /** 是否启动时播放 */
    @Serialize() public playOnAwake: boolean = false;

    /** 是否静音 */
    @Serialize() public mute: boolean = false;

    /** 空间混合 (0=2D, 1=3D) */
    @Serialize() public spatialBlend: number = 0;

    /** 最小距离（3D音效） */
    @Serialize() public minDistance: number = 1;

    /** 最大距离（3D音效） */
    @Serialize() public maxDistance: number = 500;

    constructor() {
        super();
    }
}
