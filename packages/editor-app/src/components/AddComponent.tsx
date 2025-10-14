import { useState, useEffect } from 'react';
import { Entity } from '@esengine/ecs-framework';
import { ComponentRegistry, ComponentTypeInfo } from '@esengine/editor-core';
import './AddComponent.css';

interface AddComponentProps {
  entity: Entity;
  componentRegistry: ComponentRegistry;
  onAdd: (componentName: string) => void;
  onCancel: () => void;
}

export function AddComponent({ entity, componentRegistry, onAdd, onCancel }: AddComponentProps) {
  const [components, setComponents] = useState<ComponentTypeInfo[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const allComponents = componentRegistry.getAllComponents();
    const existingComponentNames = entity.components.map(c => c.constructor.name);

    const availableComponents = allComponents.filter(
      comp => !existingComponentNames.includes(comp.name)
    );

    setComponents(availableComponents);
  }, [entity, componentRegistry]);

  const filteredComponents = components.filter(comp =>
    comp.name.toLowerCase().includes(filter.toLowerCase()) ||
    comp.category?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAdd = () => {
    if (selectedComponent) {
      onAdd(selectedComponent);
    }
  };

  const groupedComponents = filteredComponents.reduce((groups, comp) => {
    const category = comp.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(comp);
    return groups;
  }, {} as Record<string, ComponentTypeInfo[]>);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="add-component-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Add Component</h3>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>

        <div className="dialog-content">
          <input
            type="text"
            className="component-filter"
            placeholder="Search components..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />

          <div className="component-list">
            {Object.keys(groupedComponents).length === 0 ? (
              <div className="empty-message">No available components</div>
            ) : (
              Object.entries(groupedComponents).map(([category, comps]) => (
                <div key={category} className="component-category">
                  <div className="category-header">{category}</div>
                  {comps.map(comp => (
                    <div
                      key={comp.name}
                      className={`component-option ${selectedComponent === comp.name ? 'selected' : ''}`}
                      onClick={() => setSelectedComponent(comp.name)}
                      onDoubleClick={handleAdd}
                    >
                      <div className="component-name">{comp.name}</div>
                      {comp.description && (
                        <div className="component-description">{comp.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={!selectedComponent}
          >
            Add Component
          </button>
        </div>
      </div>
    </div>
  );
}
