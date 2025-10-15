import { useState, useEffect } from 'react';
import { Entity } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import { useLocale } from '../hooks/useLocale';
import { Box, Layers } from 'lucide-react';
import '../styles/SceneHierarchy.css';

interface SceneHierarchyProps {
  entityStore: EntityStoreService;
  messageHub: MessageHub;
}

export function SceneHierarchy({ entityStore, messageHub }: SceneHierarchyProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { t } = useLocale();

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

  const handleEntityClick = (entity: Entity) => {
    entityStore.selectEntity(entity);
  };

  return (
    <div className="scene-hierarchy">
      <div className="hierarchy-header">
        <Layers size={16} className="hierarchy-header-icon" />
        <h3>{t('hierarchy.title')}</h3>
      </div>
      <div className="hierarchy-content scrollable">
        {entities.length === 0 ? (
          <div className="empty-state">
            <Box size={48} strokeWidth={1.5} className="empty-icon" />
            <div className="empty-title">{t('hierarchy.empty')}</div>
            <div className="empty-hint">Create an entity to get started</div>
          </div>
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
