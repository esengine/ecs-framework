import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';

@ECSComponent('AudioSource')
@Serializable({ version: 1, typeId: 'AudioSource' })
export class AudioSourceComponent extends Component {
    @Serialize()
    @Property({ type: 'asset', label: 'Audio Clip', assetType: 'audio' })
    clip: string = '';

    /** 范围 [0, 1] */
    @Serialize()
    @Property({ type: 'number', label: 'Volume', min: 0, max: 1, step: 0.01 })
    volume: number = 1;

    @Serialize()
    @Property({ type: 'number', label: 'Pitch', min: 0.1, max: 3, step: 0.1 })
    pitch: number = 1;

    @Serialize()
    @Property({ type: 'boolean', label: 'Loop' })
    loop: boolean = false;

    @Serialize()
    @Property({ type: 'boolean', label: 'Play On Awake' })
    playOnAwake: boolean = false;

    @Serialize()
    @Property({ type: 'boolean', label: 'Mute' })
    mute: boolean = false;

    /** 0 = 2D, 1 = 3D */
    @Serialize()
    @Property({ type: 'number', label: 'Spatial Blend', min: 0, max: 1, step: 0.1 })
    spatialBlend: number = 0;

    @Serialize()
    @Property({ type: 'number', label: 'Min Distance' })
    minDistance: number = 1;

    @Serialize()
    @Property({ type: 'number', label: 'Max Distance' })
    maxDistance: number = 500;
}
