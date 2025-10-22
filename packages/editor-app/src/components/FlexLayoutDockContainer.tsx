import { useRef, useCallback, ReactNode, useMemo } from 'react';
import { Layout, Model, TabNode, IJsonModel, Actions, IJsonTabSetNode, IJsonRowNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import '../styles/FlexLayoutDock.css';

export interface FlexDockPanel {
  id: string;
  title: string;
  content: ReactNode;
  closable?: boolean;
}

interface FlexLayoutDockContainerProps {
  panels: FlexDockPanel[];
  onPanelClose?: (panelId: string) => void;
}

export function FlexLayoutDockContainer({ panels, onPanelClose }: FlexLayoutDockContainerProps) {
  const createDefaultLayout = useCallback((): IJsonModel => {
    const leftPanels = panels.filter(p => p.id.includes('hierarchy') || p.id.includes('asset'));
    const rightPanels = panels.filter(p => p.id.includes('inspector'));
    const bottomPanels = panels.filter(p => p.id.includes('console'));
    const centerPanels = panels.filter(p =>
      !leftPanels.includes(p) && !rightPanels.includes(p) && !bottomPanels.includes(p)
    );

    // Build center column children
    const centerColumnChildren: (IJsonTabSetNode | IJsonRowNode)[] = [];
    if (centerPanels.length > 0) {
      centerColumnChildren.push({
        type: 'tabset',
        weight: 70,
        children: centerPanels.map(p => ({
          type: 'tab',
          name: p.title,
          id: p.id,
          component: p.id,
          enableClose: p.closable !== false,
        })),
      });
    }
    if (bottomPanels.length > 0) {
      centerColumnChildren.push({
        type: 'tabset',
        weight: 30,
        children: bottomPanels.map(p => ({
          type: 'tab',
          name: p.title,
          id: p.id,
          component: p.id,
          enableClose: p.closable !== false,
        })),
      });
    }

    // Build main row children
    const mainRowChildren: (IJsonTabSetNode | IJsonRowNode)[] = [];
    if (leftPanels.length > 0) {
      mainRowChildren.push({
        type: 'tabset',
        weight: 20,
        children: leftPanels.map(p => ({
          type: 'tab',
          name: p.title,
          id: p.id,
          component: p.id,
          enableClose: p.closable !== false,
        })),
      });
    }
    if (centerColumnChildren.length > 0) {
      if (centerColumnChildren.length === 1) {
        const centerChild = centerColumnChildren[0];
        if (centerChild && centerChild.type === 'tabset') {
          mainRowChildren.push({
            type: 'tabset',
            weight: 60,
            children: centerChild.children
          } as IJsonTabSetNode);
        } else if (centerChild) {
          mainRowChildren.push({
            type: 'row',
            weight: 60,
            children: centerChild.children
          } as IJsonRowNode);
        }
      } else {
        mainRowChildren.push({
          type: 'row',
          weight: 60,
          children: centerColumnChildren,
        });
      }
    }
    if (rightPanels.length > 0) {
      mainRowChildren.push({
        type: 'tabset',
        weight: 20,
        children: rightPanels.map(p => ({
          type: 'tab',
          name: p.title,
          id: p.id,
          component: p.id,
          enableClose: p.closable !== false,
        })),
      });
    }

    return {
      global: {
        tabEnableClose: true,
        tabEnableRename: false,
        tabSetEnableMaximize: false,
        tabSetEnableDrop: true,
        tabSetEnableDrag: true,
        tabSetEnableDivide: true,
        borderEnableDrop: true,
      },
      borders: [],
      layout: {
        type: 'row',
        weight: 100,
        children: mainRowChildren,
      },
    };
  }, [panels]);

  const model = useMemo(() => Model.fromJson(createDefaultLayout()), [createDefaultLayout]);

  const factory = useCallback((node: TabNode) => {
    const component = node.getComponent();
    const panel = panels.find(p => p.id === component);
    return panel?.content || <div>Panel not found</div>;
  }, [panels]);

  const onAction = useCallback((action: any) => {
    if (action.type === Actions.DELETE_TAB) {
      const tabId = action.data.node;
      if (onPanelClose) {
        onPanelClose(tabId);
      }
    }
    return action;
  }, [onPanelClose]);

  return (
    <div className="flexlayout-dock-container">
      <Layout
        model={model}
        factory={factory}
        onAction={onAction}
      />
    </div>
  );
}
