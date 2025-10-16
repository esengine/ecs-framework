import { useState, useEffect } from 'react';
import { Entity } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import { Box, Layers, Wifi } from 'lucide-react';
import { ProfilerService, RemoteEntity } from '../services/ProfilerService';
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
  const { t } = useLocale();

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
      console.warn('[SceneHierarchy] ProfilerService not available');
      return;
    }

    console.log('[SceneHierarchy] Subscribing to ProfilerService');

    const unsubscribe = profilerService.subscribe((data) => {
      const connected = profilerService.isConnected();
      console.log('[SceneHierarchy] Received data, connected:', connected, 'entities:', data.entities?.length || 0);
      setIsRemoteConnected(connected);

      if (connected && data.entities && data.entities.length > 0) {
        console.log('[SceneHierarchy] Setting remote entities:', data.entities);
        setRemoteEntities(data.entities);
      } else {
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

  // Determine which entities to display
  const displayEntities = isRemoteConnected ? remoteEntities : entities;
  const showRemoteIndicator = isRemoteConnected && remoteEntities.length > 0;

  return (
    <div className="scene-hierarchy">
      <div className="hierarchy-header">
        <Layers size={16} className="hierarchy-header-icon" />
        <h3>{t('hierarchy.title')}</h3>
        {showRemoteIndicator && (
          <div className="remote-indicator" title="Showing remote entities">
            <Wifi size={12} />
          </div>
        )}
      </div>
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
            {remoteEntities.map(entity => (
              <li
                key={entity.id}
                className={`entity-item remote-entity ${selectedId === entity.id ? 'selected' : ''} ${!entity.enabled ? 'disabled' : ''}`}
                title={`${entity.name} - ${entity.componentTypes.join(', ')}`}
                onClick={() => handleRemoteEntityClick(entity)}
              >
                <Box size={14} className="entity-icon" />
                <span className="entity-name">{entity.name}</span>
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
