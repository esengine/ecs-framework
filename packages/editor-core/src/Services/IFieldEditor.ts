import { ReactElement } from 'react';

export interface FieldEditorContext {
    readonly?: boolean;
    projectPath?: string;
    decimalPlaces?: number;
    metadata?: Record<string, any>;
}

export interface FieldEditorProps<T = any> {
    label: string;
    value: T;
    onChange: (value: T) => void;
    context: FieldEditorContext;
}

export interface IFieldEditor<T = any> {
    readonly type: string;
    readonly name: string;
    readonly priority?: number;

    canHandle(fieldType: string, context?: FieldEditorContext): boolean;
    render(props: FieldEditorProps<T>): ReactElement;
}

export interface IFieldEditorRegistry {
    register(editor: IFieldEditor): void;
    unregister(type: string): void;
    getEditor(type: string, context?: FieldEditorContext): IFieldEditor | undefined;
    getAllEditors(): IFieldEditor[];
}

export interface FieldMetadata {
    type: string;
    options?: {
        fileExtension?: string;
        enumValues?: Array<{ value: string; label: string }>;
        min?: number;
        max?: number;
        step?: number;
        language?: string;
        multiline?: boolean;
        placeholder?: string;
    };
}
