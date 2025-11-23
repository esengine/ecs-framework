import { singleton } from 'tsyringe';
import type { IPanelRegistry, PanelDescriptor } from '../interfaces/IPanelRegistry';

@singleton()
export class PanelRegistry implements IPanelRegistry {
    private panels = new Map<string, PanelDescriptor>();

    register(panel: PanelDescriptor): void {
        if (this.panels.has(panel.id)) {
            console.warn(`Panel ${panel.id} is already registered. Overwriting.`);
        }
        this.panels.set(panel.id, panel);
    }

    unregister(panelId: string): void {
        this.panels.delete(panelId);
    }

    getPanel(panelId: string): PanelDescriptor | undefined {
        return this.panels.get(panelId);
    }

    getPanels(category?: string): PanelDescriptor[] {
        const allPanels = Array.from(this.panels.values());

        if (!category) {
            return allPanels.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }

        return allPanels
            .filter((panel) => panel.category === category)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
}
