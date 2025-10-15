import type { Translations } from '@esengine/editor-core';

export const en: Translations = {
    app: {
        title: 'ECS Framework Editor'
    },
    header: {
        toolbar: {
            openProject: 'Open Project',
            createEntity: 'Create Entity',
            deleteEntity: 'Delete Entity'
        },
        status: {
            initializing: 'Initializing...',
            ready: 'Editor Ready',
            failed: 'Initialization Failed',
            projectOpened: 'Project Opened',
            remoteConnected: 'Remote Game Connected'
        }
    },
    hierarchy: {
        title: 'Scene Hierarchy',
        empty: 'No entities',
        loading: 'Loading...'
    },
    inspector: {
        title: 'Inspector',
        empty: 'No entity selected',
        entityInfo: {
            title: 'Entity Info',
            id: 'ID',
            name: 'Name',
            enabled: 'Enabled',
            yes: 'Yes',
            no: 'No'
        },
        components: {
            title: 'Components',
            empty: 'No components',
            add: 'Add Component',
            remove: 'Remove'
        }
    },
    addComponent: {
        title: 'Add Component',
        search: 'Search components...',
        empty: 'No available components',
        cancel: 'Cancel',
        add: 'Add Component'
    },
    viewport: {
        title: 'Viewport',
        placeholder: 'Scene viewport will appear here'
    },
    console: {
        title: 'Console',
        placeholder: 'Console output will appear here'
    },
    footer: {
        plugins: 'Plugins',
        entities: 'Entities',
        core: 'Core',
        active: 'Active',
        inactive: 'Inactive'
    }
};
