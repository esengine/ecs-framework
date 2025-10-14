import { useState, useEffect } from 'react';
import { Core } from '@esengine/ecs-framework';
import { EditorPluginManager, UIRegistry, MessageHub, SerializerRegistry } from '@esengine/editor-core';
import { SceneInspectorPlugin } from './plugins/SceneInspectorPlugin';
import { TauriAPI } from './api/tauri';
import './styles/App.css';

function App() {
  const [core, setCore] = useState<Core | null>(null);
  const [pluginManager, setPluginManager] = useState<EditorPluginManager | null>(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const initializeEditor = async () => {
      try {
        const coreInstance = Core.create({ debug: true });

        const uiRegistry = new UIRegistry();
        const messageHub = new MessageHub();
        const serializerRegistry = new SerializerRegistry();

        Core.services.registerInstance(UIRegistry, uiRegistry);
        Core.services.registerInstance(MessageHub, messageHub);
        Core.services.registerInstance(SerializerRegistry, serializerRegistry);

        const pluginMgr = new EditorPluginManager();
        pluginMgr.initialize(coreInstance, Core.services);

        await pluginMgr.installEditor(new SceneInspectorPlugin());

        const greeting = await TauriAPI.greet('Developer');
        console.log(greeting);

        setCore(coreInstance);
        setPluginManager(pluginMgr);
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

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h1>ECS Framework Editor</h1>
        <span className="status">{status}</span>
      </div>

      <div className="editor-content">
        <div className="sidebar-left">
          <h3>Hierarchy</h3>
          <p>Scene hierarchy will appear here</p>
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
          <h3>Inspector</h3>
          <p>Entity inspector will appear here</p>
        </div>
      </div>

      <div className="editor-footer">
        <span>Plugins: {pluginManager?.getAllEditorPlugins().length ?? 0}</span>
        <span>Core: {core ? 'Active' : 'Inactive'}</span>
      </div>
    </div>
  );
}

export default App;
