import { ReactElement } from 'react';

export interface PropertyContext {
    readonly name: string;
    readonly path?: string[];
    readonly depth?: number;
    readonly readonly?: boolean;
    readonly decimalPlaces?: number;
    readonly expandByDefault?: boolean;
    readonly parentObject?: any;
    readonly metadata?: Record<string, any>;
}

export interface IPropertyRenderer<T = any> {
    readonly id: string;
    readonly name: string;
    readonly priority?: number;

    canHandle(value: any, context: PropertyContext): value is T;
    render(value: T, context: PropertyContext): ReactElement;
}

export interface IPropertyRendererRegistry {
    register(renderer: IPropertyRenderer): void;
    unregister(rendererId: string): void;
    findRenderer(value: any, context: PropertyContext): IPropertyRenderer | undefined;
    render(value: any, context: PropertyContext): ReactElement | null;
    getAllRenderers(): IPropertyRenderer[];
    hasRenderer(value: any, context: PropertyContext): boolean;
}
