import { useState, useEffect } from 'react';
import { Entity, Core } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, SceneManagerService } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import { Box, Layers, Wifi, Search, Plus, Trash2 } from 'lucide-react';
import { ProfilerService, RemoteEntity } from '../services/ProfilerService';
import { confirm } from '@tauri-apps/plugin-dialog';
import '../styles/SceneHierarchy.css';

interface SceneHierarchyProps {
  entityStore: EntityStoreService;
  messageHub: MessageHub;
}

export function SceneHierarchy({ entityStore, messageHub }: SceneHierarchyProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [remoteEntities, setRemoteEntities] = useState<RemoteEntity[]>([]);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sceneName, setSceneName] = useState<string>('Untitled');
  const [sceneFilePath, setSceneFilePath] = useState<string | null>(null);
  const [isSceneModified, setIsSceneModified] = useState<boolean>(false);
  const { t, locale } = useLocale();

  // Subscribe to scene changes
  useEffect(() => {
    const sceneManager = Core.services.resolve(SceneManagerService);

    const updateSceneInfo = () => {
      if (sceneManager) {
        const state = sceneManager.getSceneState();
        setSceneName(state.sceneName);
        setIsSceneModified(state.isModified);
      }
    };

    updateSceneInfo();

    const unsubLoaded = messageHub.subscribe('scene:loaded', (data: any) => {
      if (data.sceneName) {
        setSceneName(data.sceneName);
        setSceneFilePath(data.path || null);
        setIsSceneModified(data.isModified || false);
      } else {
        updateSceneInfo();
      }
    });
    const unsubNew = messageHub.subscribe('scene:new', () => {
      updateSceneInfo();
    });
    const unsubSaved = messageHub.subscribe('scene:saved', () => {
      updateSceneInfo();
    });
    const unsubModified = messageHub.subscribe('scene:modified', () => {
      updateSceneInfo();
    });

    return () => {
      unsubLoaded();
      unsubNew();
      unsubSaved();
      unsubModified();
    };
  }, [messageHub]);

  // Subscribe to local entity changes
  useEffect(() => {
    const updateEntities = () => {
      setEntities(entityStore.getRootEntities());
    };

    const handleSelection = (data: { entity: Entity | null }) => {
      setSelectedId(data.entity?.id ?? null);
    };

    updateEntities();

    const unsubAdd = messageHub.subscribe('entity:added', updateEntities);
    const unsubRemove = messageHub.subscribe('entity:removed', updateEntities);
    const unsubClear = messageHub.subscribe('entities:cleared', updateEntities);
    const unsubSelect = messageHub.subscribe('entity:selected', handleSelection);

    return () => {
      unsubAdd();
      unsubRemove();
      unsubClear();
      unsubSelect();
    };
  }, [entityStore, messageHub]);

  // Subscribe to remote entity data from ProfilerService
  useEffect(() => {
    const profilerService = (window as any).__PROFILER_SERVICE__ as ProfilerService | undefined;

    if (!profilerService) {
      return;
    }

    const unsubscribe = profilerService.subscribe((data) => {
      const connected = profilerService.isConnected();
      setIsRemoteConnected(connected);

      if (connected && data.entities && data.entities.length > 0) {
        // 只在实体列表发生实质性变化时才更新
        setRemoteEntities(prev => {
          if (prev.length !== data.entities!.length) {
            return data.entities!;
          }

          // 检查实体ID和名称是否变化
          const hasChanged = data.entities!.some((entity, index) => {
            const prevEntity = prev[index];
            return !prevEntity ||
                   prevEntity.id !== entity.id ||
                   prevEntity.name !== entity.name ||
                   prevEntity.componentCount !== entity.componentCount;
          });

          return hasChanged ? data.entities! : prev;
        });
      } else if (!connected) {
        setRemoteEntities([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEntityClick = (entity: Entity) => {
    entityStore.selectEntity(entity);
  };

  const handleRemoteEntityClick = (entity: RemoteEntity) => {
    setSelectedId(entity.id);

    // 请求完整的实体详情（包含组件属性）
    const profilerService = (window as any).__PROFILER_SERVICE__ as ProfilerService | undefined;
    if (profilerService) {
      profilerService.requestEntityDetails(entity.id);
    }

    // 先发布基本信息，详细信息稍后通过 ProfilerService 异步返回
    messageHub.publish('remote-entity:selected', {
      entity: {
        id: entity.id,
        name: entity.name,
        enabled: entity.enabled,
        componentCount: entity.componentCount,
        componentTypes: entity.componentTypes
      }
    });
  };

  const handleSceneNameClick = () => {
    if (sceneFilePath) {
      messageHub.publish('asset:reveal', { path: sceneFilePath });
    }
  };

  const handleCreateEntity = () => {
    const scene = Core.scene;
    if (!scene) return;

    const entityCount = entityStore.getAllEntities().length;
    const entityName = `Entity ${entityCount + 1}`;
    const entity = scene.createEntity(entityName);
    entityStore.addEntity(entity);
    entityStore.selectEntity(entity);
  };

  const handleDeleteEntity = async () => {
    if (!selectedId) return;

    const entity = entityStore.getEntity(selectedId);
    if (!entity) return;

    const confirmed = await confirm(
      locale === 'zh'
        ? `确定要删除实体 "${entity.name}" 吗？此操作无法撤销。`
        : `Are you sure you want to delete entity "${entity.name}"? This action cannot be undone.`,
      {
        title: locale === 'zh' ? '删除实体' : 'Delete Entity',
        kind: 'warning'
      }
    );

    if (confirmed) {
      entity.destroy();
      entityStore.removeEntity(entity);
    }
  };

  // Listen for Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId && !isRemoteConnected) {
        handleDeleteEntity();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, isRemoteConnected]);

  // Filter entities based on search query
  const filterRemoteEntities = (entityList: RemoteEntity[]): RemoteEntity[] => {
    if (!searchQuery.trim()) return entityList;

    const query = searchQuery.toLowerCase();
    return entityList.filter(entity => {
      const name = entity.name;
      const id = entity.id.toString();

      // Search by name or ID
      if (name.toLowerCase().includes(query) || id.includes(query)) {
        return true;
      }

      // Search by component types
      if (Array.isArray(entity.componentTypes)) {
        return entity.componentTypes.some(type =>
          type.toLowerCase().includes(query)
        );
      }

      return false;
    });
  };

  const filterLocalEntities = (entityList: Entity[]): Entity[] => {
    if (!searchQuery.trim()) return entityList;

    const query = searchQuery.toLowerCase();
    return entityList.filter(entity => {
      const id = entity.id.toString();
      return id.includes(query);
    });
  };

  // Determine which entities to display
  const displayEntities = isRemoteConnected
    ? filterRemoteEntities(remoteEntities)
    : filterLocalEntities(entities);
  const showRemoteIndicator = isRemoteConnected && remoteEntities.length > 0;

  return (
    <div className="scene-hierarchy">
      <div className="hierarchy-header">
        <Layers size={16} className="hierarchy-header-icon" />
        <h3>{t('hierarchy.title')}</h3>
        <div
          className="scene-name-container clickable"
          onClick={handleSceneNameClick}
          title={sceneFilePath ? `${sceneName} - 点击跳转到文件` : sceneName}
        >
          <span className="scene-name">
            {sceneName}{isSceneModified ? '*' : ''}
          </span>
        </div>
        {showRemoteIndicator && (
          <div className="remote-indicator" title="Showing remote entities">
            <Wifi size={12} />
          </div>
        )}
      </div>
      <div className="hierarchy-search">
        <Search size={14} />
        <input
          type="text"
          placeholder={t('hierarchy.search') || 'Search entities...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {!isRemoteConnected && (
        <div className="hierarchy-toolbar">
          <button
            className="toolbar-btn"
            onClick={handleCreateEntity}
            title={locale === 'zh' ? '创建实体' : 'Create Entity'}
          >
            <Plus size={14} />
            <span>{locale === 'zh' ? '创建实体' : 'Create Entity'}</span>
          </button>
          <button
            className="toolbar-btn"
            onClick={handleDeleteEntity}
            disabled={!selectedId}
            title={locale === 'zh' ? '删除实体' : 'Delete Entity'}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
      <div className="hierarchy-content scrollable">
        {displayEntities.length === 0 ? (
          <div className="empty-state">
            <Box size={48} strokeWidth={1.5} className="empty-icon" />
            <div className="empty-title">{t('hierarchy.empty')}</div>
            <div className="empty-hint">
              {isRemoteConnected
                ? 'No entities in remote game'
                : 'Create an entity to get started'}
            </div>
          </div>
        ) : isRemoteConnected ? (
          <ul className="entity-list">
            {(displayEntities as RemoteEntity[]).map(entity => (
              <li
                key={entity.id}
                className={`entity-item remote-entity ${selectedId === entity.id ? 'selected' : ''} ${!entity.enabled ? 'disabled' : ''}`}
                title={`${entity.name} - ${entity.componentTypes.join(', ')}`}
                onClick={() => handleRemoteEntityClick(entity)}
              >
                <Box size={14} className="entity-icon" />
                <span className="entity-name">{entity.name}</span>
                {entity.tag !== 0 && (
                  <span className="entity-tag" title={`Tag: ${entity.tag}`}>
                    #{entity.tag}
                  </span>
                )}
                {entity.componentCount > 0 && (
                  <span className="component-count">{entity.componentCount}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="entity-list">
            {entities.map(entity => (
              <li
                key={entity.id}
                className={`entity-item ${selectedId === entity.id ? 'selected' : ''}`}
                onClick={() => handleEntityClick(entity)}
              >
                <Box size={14} className="entity-icon" />
                <span className="entity-name">Entity {entity.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
