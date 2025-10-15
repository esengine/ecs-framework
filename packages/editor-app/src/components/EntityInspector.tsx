import { useState, useEffect } from 'react';
import { Entity, Core } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub, ComponentRegistry } from '@esengine/editor-core';
import { AddComponent } from './AddComponent';
import { PropertyInspector } from './PropertyInspector';
import { FileSearch, Plus, ChevronDown, ChevronRight, X, Settings } from 'lucide-react';
import '../styles/EntityInspector.css';

interface EntityInspectorProps {
  entityStore: EntityStoreService;
  messageHub: MessageHub;
}

export function EntityInspector({ entityStore: _entityStore, messageHub }: EntityInspectorProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set());

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

    console.log('Attempting to create component:', componentName);
    const component = componentRegistry.createInstance(componentName);
    console.log('Created component:', component);

    if (component) {
      selectedEntity.addComponent(component);
      messageHub.publish('component:added', { entity: selectedEntity, component });
      setShowAddComponent(false);
    } else {
      console.error('Failed to create component instance for:', componentName);
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

  const toggleComponentExpanded = (index: number) => {
    setExpandedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handlePropertyChange = (component: any, propertyName: string, value: any) => {
    if (!selectedEntity) return;
    messageHub.publish('component:property:changed', {
      entity: selectedEntity,
      component,
      propertyName,
      value
    });
  };

  if (!selectedEntity) {
    return (
      <div className="entity-inspector">
        <div className="inspector-header">
          <FileSearch size={16} className="inspector-header-icon" />
          <h3>Inspector</h3>
        </div>
        <div className="inspector-content">
          <div className="empty-state">
            <FileSearch size={48} strokeWidth={1.5} className="empty-icon" />
            <div className="empty-title">No entity selected</div>
            <div className="empty-hint">Select an entity from the hierarchy</div>
          </div>
        </div>
      </div>
    );
  }

  const components = selectedEntity.components;

  return (
    <div className="entity-inspector">
      <div className="inspector-header">
        <FileSearch size={16} className="inspector-header-icon" />
        <h3>Inspector</h3>
      </div>
      <div className="inspector-content scrollable">
        <div className="inspector-section">
          <div className="section-header">
            <Settings size={12} className="section-icon" />
            <span>Entity Info</span>
          </div>
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
            <Settings size={12} className="section-icon" />
            <span>Components ({components.length})</span>
            <button
              className="add-component-btn"
              onClick={() => setShowAddComponent(true)}
              title="Add Component"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="section-content">
            {components.length === 0 ? (
              <div className="empty-state-small">No components</div>
            ) : (
              <ul className="component-list">
                {components.map((component, index) => {
                  const isExpanded = expandedComponents.has(index);
                  return (
                    <li key={index} className={`component-item ${isExpanded ? 'expanded' : ''}`}>
                      <div className="component-header" onClick={() => toggleComponentExpanded(index)}>
                        <button
                          className="component-expand-btn"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <Settings size={14} className="component-icon" />
                        <span className="component-name">{component.constructor.name}</span>
                        <button
                          className="remove-component-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveComponent(index);
                          }}
                          title="Remove Component"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="component-properties animate-slideDown">
                          <PropertyInspector
                            component={component}
                            onChange={(propertyName, value) => handlePropertyChange(component, propertyName, value)}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
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
