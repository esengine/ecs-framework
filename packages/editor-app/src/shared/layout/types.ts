import type { ReactNode } from 'react';

export interface FlexDockPanel {
    id: string;
    title: string;
    content: ReactNode;
    closable?: boolean;
}
