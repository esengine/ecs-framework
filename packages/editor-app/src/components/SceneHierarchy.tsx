import { useState, useEffect } from 'react';
import { Entity } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import '../styles/SceneHierarchy.css';

interface SceneHierarchyProps {
  entityStore: EntityStoreService;
  messageHub: MessageHub;
}

export function SceneHierarchy({ entityStore, messageHub }: SceneHierarchyProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
        <h3>Scene Hierarchy</h3>
      </div>
      <div className="hierarchy-content">
        {entities.length === 0 ? (
          <div className="empty-state">No entities in scene</div>
        ) : (
          <ul className="entity-list">
            {entities.map(entity => (
              <li
                key={entity.id}
                className={`entity-item ${selectedId === entity.id ? 'selected' : ''}`}
                onClick={() => handleEntityClick(entity)}
              >
                <span className="entity-icon">📦</span>
                <span className="entity-name">Entity {entity.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
