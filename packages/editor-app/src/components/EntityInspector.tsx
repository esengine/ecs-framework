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
  const [remoteEntity, setRemoteEntity] = useState<any | null>(null);
  const [remoteEntityDetails, setRemoteEntityDetails] = useState<any | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handleSelection = (data: { entity: Entity | null }) => {
      setSelectedEntity(data.entity);
      setRemoteEntity(null);
      setRemoteEntityDetails(null);
      setShowAddComponent(false);
    };

    const handleRemoteSelection = (data: { entity: any }) => {
      setRemoteEntity(data.entity);
      setRemoteEntityDetails(null);
      setSelectedEntity(null);
      setShowAddComponent(false);
    };

    const handleEntityDetails = (event: Event) => {
      const customEvent = event as CustomEvent;
      const details = customEvent.detail;
      setRemoteEntityDetails(details);
    };

    const unsubSelect = messageHub.subscribe('entity:selected', handleSelection);
    const unsubRemoteSelect = messageHub.subscribe('remote-entity:selected', handleRemoteSelection);

    window.addEventListener('profiler:entity-details', handleEntityDetails);

    return () => {
      unsubSelect();
      unsubRemoteSelect();
      window.removeEventListener('profiler:entity-details', handleEntityDetails);
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

  const renderRemoteProperty = (key: string, value: any) => {
    if (value === null || value === undefined) {
      return (
        <div key={key} className="property-field">
          <label className="property-label">{key}</label>
          <span className="property-value-text">null</span>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={key} className="property-field">
          <label className="property-label">{key}</label>
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {value.length === 0 ? (
              <span className="property-value-text" style={{ opacity: 0.5 }}>Empty Array</span>
            ) : (
              value.map((item, index) => (
                <span
                  key={index}
                  style={{
                    padding: '2px 6px',
                    background: 'var(--color-bg-inset)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: '3px',
                    fontSize: '10px',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-family-mono)'
                  }}
                >
                  {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                </span>
              ))
            )}
          </div>
        </div>
      );
    }

    const valueType = typeof value;

    if (valueType === 'boolean') {
      return (
        <div key={key} className="property-field property-field-boolean">
          <label className="property-label">{key}</label>
          <div className={`property-toggle ${value ? 'property-toggle-on' : 'property-toggle-off'} property-toggle-readonly`}>
            <span className="property-toggle-thumb" />
          </div>
        </div>
      );
    }

    if (valueType === 'number') {
      return (
        <div key={key} className="property-field">
          <label className="property-label">{key}</label>
          <input
            type="number"
            className="property-input property-input-number"
            value={value}
            disabled
          />
        </div>
      );
    }

    if (valueType === 'string') {
      return (
        <div key={key} className="property-field">
          <label className="property-label">{key}</label>
          <input
            type="text"
            className="property-input property-input-text"
            value={value}
            disabled
          />
        </div>
      );
    }

    if (valueType === 'object' && value.r !== undefined && value.g !== undefined && value.b !== undefined) {
      const r = Math.round(value.r * 255);
      const g = Math.round(value.g * 255);
      const b = Math.round(value.b * 255);
      const a = value.a !== undefined ? value.a : 1;
      const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

      return (
        <div key={key} className="property-field">
          <label className="property-label">{key}</label>
          <div className="property-color-wrapper">
            <div className="property-color-preview" style={{ backgroundColor: hexColor, opacity: a }} />
            <input
              type="text"
              className="property-input property-input-color-text"
              value={`${hexColor.toUpperCase()} (${a.toFixed(2)})`}
              disabled
              style={{ flex: 1 }}
            />
          </div>
        </div>
      );
    }

    if (valueType === 'object' && value.minX !== undefined && value.maxX !== undefined && value.minY !== undefined && value.maxY !== undefined) {
      return (
        <div key={key} className="property-field" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <label className="property-label" style={{ flex: 'none', marginBottom: '4px' }}>{key}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="property-vector-compact">
              <div className="property-vector-axis-compact">
                <span className="property-vector-axis-label property-vector-axis-x">X</span>
                <input
                  type="number"
                  className="property-input property-input-number-compact"
                  value={value.minX}
                  disabled
                  placeholder="Min"
                />
              </div>
              <div className="property-vector-axis-compact">
                <span className="property-vector-axis-label property-vector-axis-x">X</span>
                <input
                  type="number"
                  className="property-input property-input-number-compact"
                  value={value.maxX}
                  disabled
                  placeholder="Max"
                />
              </div>
            </div>
            <div className="property-vector-compact">
              <div className="property-vector-axis-compact">
                <span className="property-vector-axis-label property-vector-axis-y">Y</span>
                <input
                  type="number"
                  className="property-input property-input-number-compact"
                  value={value.minY}
                  disabled
                  placeholder="Min"
                />
              </div>
              <div className="property-vector-axis-compact">
                <span className="property-vector-axis-label property-vector-axis-y">Y</span>
                <input
                  type="number"
                  className="property-input property-input-number-compact"
                  value={value.maxY}
                  disabled
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (valueType === 'object' && value.x !== undefined && value.y !== undefined) {
      if (value.z !== undefined) {
        return (
          <div key={key} className="property-field">
            <label className="property-label">{key}</label>
            <div className="property-vector-compact">
              <div className="property-vector-axis-compact">
                <span className="property-vector-axis-label property-vector-axis-x">X</span>
                <input
                  type="number"
                  className="property-input property-input-number-compact"
                  value={value.x}
                  disabled
                />
              </div>
              <div className="property-vector-axis-compact">
                <span className="property-vector-axis-label property-vector-axis-y">Y</span>
                <input
                  type="number"
                  className="property-input property-input-number-compact"
                  value={value.y}
                  disabled
                />
              </div>
              <div className="property-vector-axis-compact">
                <span className="property-vector-axis-label property-vector-axis-z">Z</span>
                <input
                  type="number"
                  className="property-input property-input-number-compact"
                  value={value.z}
                  disabled
                />
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div key={key} className="property-field">
            <label className="property-label">{key}</label>
            <div className="property-vector-compact">
              <div className="property-vector-axis-compact">
                <span className="property-vector-axis-label property-vector-axis-x">X</span>
                <input
                  type="number"
                  className="property-input property-input-number-compact"
                  value={value.x}
                  disabled
                />
              </div>
              <div className="property-vector-axis-compact">
                <span className="property-vector-axis-label property-vector-axis-y">Y</span>
                <input
                  type="number"
                  className="property-input property-input-number-compact"
                  value={value.y}
                  disabled
                />
              </div>
            </div>
          </div>
        );
      }
    }

    return (
      <div key={key} className="property-field">
        <label className="property-label">{key}</label>
        <span className="property-value-text">{JSON.stringify(value)}</span>
      </div>
    );
  };

  if (!selectedEntity && !remoteEntity) {
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

  // 显示远程实体
  if (remoteEntity) {
    const displayData = remoteEntityDetails || remoteEntity;
    const hasDetailedComponents = remoteEntityDetails && remoteEntityDetails.components && remoteEntityDetails.components.length > 0;

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
              <span>Entity Info (Remote)</span>
            </div>
            <div className="section-content">
              <div className="info-row">
                <span className="info-label">ID:</span>
                <span className="info-value">{displayData.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{displayData.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Enabled:</span>
                <span className="info-value">{displayData.enabled ? 'Yes' : 'No'}</span>
              </div>
              {displayData.scene && (
                <div className="info-row">
                  <span className="info-label">Scene:</span>
                  <span className="info-value">{displayData.scene}</span>
                </div>
              )}
            </div>
          </div>

          <div className="inspector-section">
            <div className="section-header">
              <Settings size={12} className="section-icon" />
              <span>Components ({displayData.componentCount})</span>
            </div>
            <div className="section-content">
              {hasDetailedComponents ? (
                <ul className="component-list">
                  {remoteEntityDetails!.components.map((component: any, index: number) => {
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
                          <span className="component-name">{component.typeName}</span>
                        </div>
                        {isExpanded && (
                          <div className="component-properties animate-slideDown">
                            <div className="property-inspector">
                              {Object.entries(component.properties).map(([key, value]) =>
                                renderRemoteProperty(key, value)
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : displayData.componentTypes && displayData.componentTypes.length > 0 ? (
                <ul className="component-list">
                  {displayData.componentTypes.map((componentType: string, index: number) => (
                    <li key={index} className="component-item">
                      <div className="component-header">
                        <Settings size={14} className="component-icon" />
                        <span className="component-name">{componentType}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state-small">No components</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const components = selectedEntity!.components;

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
              <span className="info-value">{selectedEntity!.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">Entity {selectedEntity!.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Enabled:</span>
              <span className="info-value">{selectedEntity!.enabled ? 'Yes' : 'No'}</span>
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
