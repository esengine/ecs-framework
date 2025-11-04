import { Core } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { BehaviorTreeNodePalette } from '../../../../components/BehaviorTreeNodePalette';
import './BehaviorTreeNodePalettePanel.css';

export const BehaviorTreeNodePalettePanel: React.FC = () => {
    const messageHub = Core.services.resolve(MessageHub);

    return (
        <div className="behavior-tree-node-palette-panel">
            <BehaviorTreeNodePalette
                onNodeSelect={(template) => {
                    messageHub?.publish('behavior-tree:node-palette-selected', { template });
                }}
            />
        </div>
    );
};
