import type { PanelDescriptor } from '../Types/UITypes';

export interface IPanelRegistry {
    register(panel: PanelDescriptor): void;
    unregister(panelId: string): void;
    getPanel(panelId: string): PanelDescriptor | undefined;
    getPanels(category?: string): PanelDescriptor[];
}
