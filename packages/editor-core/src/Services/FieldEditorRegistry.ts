import { IService, createLogger } from '@esengine/esengine';
import { IFieldEditor, IFieldEditorRegistry, FieldEditorContext } from './IFieldEditor';

const logger = createLogger('FieldEditorRegistry');

export class FieldEditorRegistry implements IFieldEditorRegistry, IService {
    private editors: Map<string, IFieldEditor> = new Map();

    register(editor: IFieldEditor): void {
        if (this.editors.has(editor.type)) {
            logger.warn(`Overwriting existing field editor: ${editor.type}`);
        }

        this.editors.set(editor.type, editor);
        logger.debug(`Registered field editor: ${editor.name} (${editor.type})`);
    }

    unregister(type: string): void {
        if (this.editors.delete(type)) {
            logger.debug(`Unregistered field editor: ${type}`);
        }
    }

    getEditor(type: string, context?: FieldEditorContext): IFieldEditor | undefined {
        const editor = this.editors.get(type);
        if (editor) {
            return editor;
        }

        const editors = Array.from(this.editors.values())
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const editor of editors) {
            if (editor.canHandle(type, context)) {
                return editor;
            }
        }

        return undefined;
    }

    getAllEditors(): IFieldEditor[] {
        return Array.from(this.editors.values());
    }

    dispose(): void {
        this.editors.clear();
        logger.debug('FieldEditorRegistry disposed');
    }
}
