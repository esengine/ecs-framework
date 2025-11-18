import type { IJsonModel, IJsonTabNode, IJsonBorderNode as FlexBorderNode } from 'flexlayout-react';

export interface IJsonRowNode {
    type: 'row';
    id?: string;
    weight?: number;
    children: IJsonLayoutNode[];
}

export interface IJsonTabsetNode {
    type: 'tabset';
    id?: string;
    weight?: number;
    selected?: number;
    children: IJsonTabNode[];
}

export type IJsonLayoutNode = IJsonRowNode | IJsonTabsetNode | IJsonTabNode;

export type { FlexBorderNode as IJsonBorderNode };

export function isTabsetNode(node: IJsonLayoutNode): node is IJsonTabsetNode {
    return node.type === 'tabset';
}

export function isRowNode(node: IJsonLayoutNode): node is IJsonRowNode {
    return node.type === 'row';
}

export function isTabNode(node: IJsonLayoutNode): node is IJsonTabNode {
    return node.type === 'tab';
}

export function hasChildren(node: IJsonLayoutNode): node is IJsonRowNode | IJsonTabsetNode {
    return node.type === 'row' || node.type === 'tabset';
}
