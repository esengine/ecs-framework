import { ReactNode } from 'react';
import { TabPanel, TabItem } from './TabPanel';
import { ResizablePanel } from './ResizablePanel';
import '../styles/DockContainer.css';

export type DockPosition = 'left' | 'right' | 'top' | 'bottom' | 'center';

export interface DockablePanel {
  id: string;
  title: string;
  content: ReactNode;
  position: DockPosition;
  closable?: boolean;
}

interface DockContainerProps {
  panels: DockablePanel[];
  onPanelClose?: (panelId: string) => void;
  onPanelMove?: (panelId: string, newPosition: DockPosition) => void;
}

export function DockContainer({ panels, onPanelClose }: DockContainerProps) {
  const groupedPanels = panels.reduce((acc, panel) => {
    if (!acc[panel.position]) {
      acc[panel.position] = [];
    }
    acc[panel.position].push(panel);
    return acc;
  }, {} as Record<DockPosition, DockablePanel[]>);

  const renderPanelGroup = (position: DockPosition) => {
    const positionPanels = groupedPanels[position];
    if (!positionPanels || positionPanels.length === 0) return null;

    const tabs: TabItem[] = positionPanels.map(panel => ({
      id: panel.id,
      title: panel.title,
      content: panel.content,
      closable: panel.closable
    }));

    return (
      <TabPanel
        tabs={tabs}
        onTabClose={onPanelClose}
      />
    );
  };

  const leftPanel = groupedPanels['left'];
  const rightPanel = groupedPanels['right'];
  const topPanel = groupedPanels['top'];
  const bottomPanel = groupedPanels['bottom'];

  const hasLeft = leftPanel && leftPanel.length > 0;
  const hasRight = rightPanel && rightPanel.length > 0;
  const hasTop = topPanel && topPanel.length > 0;
  const hasBottom = bottomPanel && bottomPanel.length > 0;

  let content = (
    <div className="dock-center">
      {renderPanelGroup('center')}
    </div>
  );

  if (hasTop || hasBottom) {
    content = (
      <ResizablePanel
        direction="vertical"
        defaultSize={200}
        minSize={32}
        maxSize={600}
        leftOrTop={content}
        rightOrBottom={
          <div className="dock-bottom">
            {renderPanelGroup('bottom')}
          </div>
        }
      />
    );
  }

  if (hasTop) {
    content = (
      <ResizablePanel
        direction="vertical"
        defaultSize={200}
        minSize={32}
        maxSize={600}
        leftOrTop={
          <div className="dock-top">
            {renderPanelGroup('top')}
          </div>
        }
        rightOrBottom={content}
      />
    );
  }

  if (hasLeft || hasRight) {
    if (hasLeft && hasRight) {
      content = (
        <ResizablePanel
          direction="horizontal"
          defaultSize={250}
          minSize={150}
          maxSize={400}
          leftOrTop={
            <div className="dock-left">
              {renderPanelGroup('left')}
            </div>
          }
          rightOrBottom={
            <ResizablePanel
              direction="horizontal"
              side="right"
              defaultSize={280}
              minSize={200}
              maxSize={500}
              leftOrTop={content}
              rightOrBottom={
                <div className="dock-right">
                  {renderPanelGroup('right')}
                </div>
              }
            />
          }
        />
      );
    } else if (hasLeft) {
      content = (
        <ResizablePanel
          direction="horizontal"
          defaultSize={250}
          minSize={150}
          maxSize={400}
          leftOrTop={
            <div className="dock-left">
              {renderPanelGroup('left')}
            </div>
          }
          rightOrBottom={content}
        />
      );
    } else {
      content = (
        <ResizablePanel
          direction="horizontal"
          side="right"
          defaultSize={280}
          minSize={200}
          maxSize={500}
          leftOrTop={content}
          rightOrBottom={
            <div className="dock-right">
              {renderPanelGroup('right')}
            </div>
          }
        />
      );
    }
  }

  return <div className="dock-container">{content}</div>;
}
