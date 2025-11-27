import type { Translations } from '@esengine/editor-core';

export const zh: Translations = {
    app: {
        title: 'ESEngine 编辑器'
    },
    header: {
        toolbar: {
            openProject: '打开项目',
            createEntity: '创建实体',
            deleteEntity: '删除实体'
        },
        status: {
            initializing: '初始化中...',
            ready: '编辑器就绪',
            failed: '初始化失败',
            projectOpened: '项目已打开',
            remoteConnected: '远程游戏已连接',
            profilerMode: '性能分析模式 - 等待连接...'
        }
    },
    hierarchy: {
        title: '场景层级',
        empty: '无实体',
        loading: '加载中...'
    },
    inspector: {
        title: '检查器',
        empty: '未选择实体',
        entityInfo: {
            title: '实体信息',
            id: 'ID',
            name: '名称',
            enabled: '启用',
            yes: '是',
            no: '否'
        },
        components: {
            title: '组件',
            empty: '无组件',
            add: '添加组件',
            remove: '移除'
        }
    },
    addComponent: {
        title: '添加组件',
        search: '搜索组件...',
        empty: '无可用组件',
        cancel: '取消',
        add: '添加组件'
    },
    viewport: {
        title: '视口',
        placeholder: '场景视口将显示在这里'
    },
    console: {
        title: '控制台',
        placeholder: '控制台输出将显示在这里'
    },
    footer: {
        plugins: '插件',
        entities: '实体',
        core: '核心',
        active: '活跃',
        inactive: '未激活'
    }
};
