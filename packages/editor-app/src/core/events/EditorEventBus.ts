import { singleton } from 'tsyringe';
import { TypedEventBus } from './TypedEventBus';
import type { EditorEventMap } from './EditorEventMap';

@singleton()
export class EditorEventBus extends TypedEventBus<EditorEventMap> {
}
