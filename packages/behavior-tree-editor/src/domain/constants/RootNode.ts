import { Node } from '../models/Node';
import { Position } from '../value-objects/Position';
import type { NodeTemplate } from '@esengine/behavior-tree';

export const ROOT_NODE_ID = 'root-node';

export const createRootNodeTemplate = (): NodeTemplate => ({
    type: 'root',
    displayName: '根节点',
    category: '根节点',
    icon: 'TreePine',
    description: '行为树根节点',
    color: '#FFD700',
    maxChildren: 1,
    defaultConfig: {
        nodeType: 'root'
    },
    properties: []
});

export const createRootNode = (): Node => {
    const template = createRootNodeTemplate();
    const position = new Position(400, 100);
    return new Node(ROOT_NODE_ID, template, { nodeType: 'root' }, position, []);
};
