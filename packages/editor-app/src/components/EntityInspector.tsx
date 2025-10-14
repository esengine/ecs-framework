import { useState, useEffect } from 'react';
import { Entity, Core } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, ComponentRegistry } from '@esengine/editor-core';
import { AddComponent } from './AddComponent';
import '../styles/EntityInspector.css';

interface EntityInspectorProps {
  entityStore: EntityStoreService;
  messageHub: MessageHub;
}

export function EntityInspector({ entityStore, messageHub }: EntityInspectorProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);

  useEffect(() => {
    const handleSelection = (data: { entity: Entity | null }) => {
      setSelectedEntity(data.entity);
      setShowAddComponent(false);
    };

    const unsubSelect = messageHub.subscribe('entity:selected', handleSelection);

    return () => {
      unsubSelect();
    };
  }, [messageHub]);

  const handleAddComponent = (componentName: string) => {
    if (!selectedEntity) return;

    const componentRegistry = Core.services.resolve(ComponentRegistry);
    if (!componentRegistry) {
      console.error('ComponentRegistry not found');
      return;
    }

    const component = componentRegistry.createInstance(componentName);
    if (component) {
      selectedEntity.addComponent(component);
      messageHub.publish('component:added', { entity: selectedEntity, component });
      setShowAddComponent(false);
    }
  };

  const handleRemoveComponent = (index: number) => {
    if (!selectedEntity) return;
    const component = selectedEntity.components[index];
    if (component) {
      selectedEntity.removeComponent(component);
      messageHub.publish('component:removed', { entity: selectedEntity, component });
    }
  };

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
          <div className="section-header">
            <span>Components ({components.length})</span>
            <button
              className="add-component-btn"
              onClick={() => setShowAddComponent(true)}
              title="Add Component"
            >
              +
            </button>
          </div>
          <div className="section-content">
            {components.length === 0 ? (
              <div className="empty-state">No components</div>
            ) : (
              <ul className="component-list">
                {components.map((component, index) => (
                  <li key={index} className="component-item">
                    <span className="component-icon">🔧</span>
                    <span className="component-name">{component.constructor.name}</span>
                    <button
                      className="remove-component-btn"
                      onClick={() => handleRemoveComponent(index)}
                      title="Remove Component"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {showAddComponent && selectedEntity && (
        <AddComponent
          entity={selectedEntity}
          componentRegistry={Core.services.resolve(ComponentRegistry)}
          onAdd={handleAddComponent}
          onCancel={() => setShowAddComponent(false)}
        />
      )}
    </div>
  );
}
