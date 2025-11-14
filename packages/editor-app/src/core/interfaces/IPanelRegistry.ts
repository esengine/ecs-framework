import type { ComponentType, ReactNode } from 'react';

export interface PanelDescriptor {
    id: string;
    title: string;
    icon?: ReactNode;
    component: ComponentType<unknown>;
    category?: string;
    order?: number;
}

export interface IPanelRegistry {
    register(panel: PanelDescriptor): void;
    unregister(panelId: string): void;
    getPanel(panelId: string): PanelDescriptor | undefined;
    getPanels(category?: string): PanelDescriptor[];
}
