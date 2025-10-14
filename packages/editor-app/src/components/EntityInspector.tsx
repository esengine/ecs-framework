import { useState, useEffect } from 'react';
import { Entity } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import '../styles/EntityInspector.css';

interface EntityInspectorProps {
  entityStore: EntityStoreService;
  messageHub: MessageHub;
}

export function EntityInspector({ entityStore, messageHub }: EntityInspectorProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  useEffect(() => {
    const handleSelection = (data: { entity: Entity | null }) => {
      setSelectedEntity(data.entity);
    };

    const unsubSelect = messageHub.subscribe('entity:selected', handleSelection);

    return () => {
      unsubSelect();
    };
  }, [messageHub]);

  if (!selectedEntity) {
    return (
      <div className="entity-inspector">
        <div className="inspector-header">
          <h3>Inspector</h3>
        </div>
        <div className="inspector-content">
          <div className="empty-state">No entity selected</div>
        </div>
      </div>
    );
  }

  const components = selectedEntity.components;

  return (
    <div className="entity-inspector">
      <div className="inspector-header">
        <h3>Inspector</h3>
      </div>
      <div className="inspector-content">
        <div className="inspector-section">
          <div className="section-header">Entity Info</div>
          <div className="section-content">
            <div className="info-row">
              <span className="info-label">ID:</span>
              <span className="info-value">{selectedEntity.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">Entity {selectedEntity.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Enabled:</span>
              <span className="info-value">{selectedEntity.enabled ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <div className="inspector-section">
          <div className="section-header">Components ({components.length})</div>
          <div className="section-content">
            {components.length === 0 ? (
              <div className="empty-state">No components</div>
            ) : (
              <ul className="component-list">
                {components.map((component, index) => (
                  <li key={index} className="component-item">
                    <span className="component-icon">🔧</span>
                    <span className="component-name">{component.constructor.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
