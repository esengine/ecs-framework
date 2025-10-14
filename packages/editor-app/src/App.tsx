import { useState, useEffect } from 'react';
import { Core, Scene } from '@esengine/ecs-framework';
import { EditorPluginManager, UIRegistry, MessageHub, SerializerRegistry, EntityStoreService, ComponentRegistry } from '@esengine/editor-core';
import { SceneInspectorPlugin } from './plugins/SceneInspectorPlugin';
import { SceneHierarchy } from './components/SceneHierarchy';
import { EntityInspector } from './components/EntityInspector';
import { TauriAPI } from './api/tauri';
import { TransformComponent } from './example-components/TransformComponent';
import { SpriteComponent } from './example-components/SpriteComponent';
import { RigidBodyComponent } from './example-components/RigidBodyComponent';
import './styles/App.css';

function App() {
  const [initialized, setInitialized] = useState(false);
  const [pluginManager, setPluginManager] = useState<EditorPluginManager | null>(null);
  const [entityStore, setEntityStore] = useState<EntityStoreService | null>(null);
  const [messageHub, setMessageHub] = useState<MessageHub | null>(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const initializeEditor = async () => {
      try {
        const coreInstance = Core.create({ debug: true });

        const editorScene = new Scene();
        Core.setScene(editorScene);

        const uiRegistry = new UIRegistry();
        const messageHub = new MessageHub();
        const serializerRegistry = new SerializerRegistry();
        const entityStore = new EntityStoreService(messageHub);
        const componentRegistry = new ComponentRegistry();

        componentRegistry.register({
          name: 'Transform',
          type: TransformComponent,
          category: 'Transform',
          description: 'Position, rotation and scale'
        });

        componentRegistry.register({
          name: 'Sprite',
          type: SpriteComponent,
          category: 'Rendering',
          description: 'Sprite renderer'
        });

        componentRegistry.register({
          name: 'RigidBody',
          type: RigidBodyComponent,
          category: 'Physics',
          description: 'Physics body'
        });

        Core.services.registerInstance(UIRegistry, uiRegistry);
        Core.services.registerInstance(MessageHub, messageHub);
        Core.services.registerInstance(SerializerRegistry, serializerRegistry);
        Core.services.registerInstance(EntityStoreService, entityStore);
        Core.services.registerInstance(ComponentRegistry, componentRegistry);

        const pluginMgr = new EditorPluginManager();
        pluginMgr.initialize(coreInstance, Core.services);

        await pluginMgr.installEditor(new SceneInspectorPlugin());

        const greeting = await TauriAPI.greet('Developer');
        console.log(greeting);

        setInitialized(true);
        setPluginManager(pluginMgr);
        setEntityStore(entityStore);
        setMessageHub(messageHub);
        setStatus('Editor Ready');
      } catch (error) {
        console.error('Failed to initialize editor:', error);
        setStatus('Initialization Failed');
      }
    };

    initializeEditor();

    return () => {
      Core.destroy();
    };
  }, []);

  const handleCreateEntity = () => {
    if (!initialized || !entityStore) return;
    const scene = Core.scene;
    if (!scene) return;

    const entity = scene.createEntity('Entity');
    entityStore.addEntity(entity);
  };

  const handleDeleteEntity = () => {
    if (!entityStore) return;
    const selected = entityStore.getSelectedEntity();
    if (selected) {
      selected.destroy();
      entityStore.removeEntity(selected);
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h1>ECS Framework Editor</h1>
        <div className="header-toolbar">
          <button onClick={handleCreateEntity} disabled={!initialized} className="toolbar-btn">
            ➕ Create Entity
          </button>
          <button onClick={handleDeleteEntity} disabled={!entityStore?.getSelectedEntity()} className="toolbar-btn">
            🗑️ Delete Entity
          </button>
        </div>
        <span className="status">{status}</span>
      </div>

      <div className="editor-content">
        <div className="sidebar-left">
          {entityStore && messageHub ? (
            <SceneHierarchy entityStore={entityStore} messageHub={messageHub} />
          ) : (
            <div className="loading">Loading...</div>
          )}
        </div>

        <div className="main-content">
          <div className="viewport">
            <h3>Viewport</h3>
            <p>Scene viewport will appear here</p>
          </div>

          <div className="bottom-panel">
            <h4>Console</h4>
            <p>Console output will appear here</p>
          </div>
        </div>

        <div className="sidebar-right">
          {entityStore && messageHub ? (
            <EntityInspector entityStore={entityStore} messageHub={messageHub} />
          ) : (
            <div className="loading">Loading...</div>
          )}
        </div>
      </div>

      <div className="editor-footer">
        <span>Plugins: {pluginManager?.getAllEditorPlugins().length ?? 0}</span>
        <span>Entities: {entityStore?.getAllEntities().length ?? 0}</span>
        <span>Core: {initialized ? 'Active' : 'Inactive'}</span>
      </div>
    </div>
  );
}

export default App;
