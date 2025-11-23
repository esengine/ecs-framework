import React from 'react';
import ReactDOM from 'react-dom/client';
import { setGlobalLogLevel, LogLevel } from '@esengine/ecs-framework';
import App from './App';
import './styles/global.css';
import './styles/index.css';
import './i18n/config';

// Set log level to Warn in production to reduce console noise
setGlobalLogLevel(LogLevel.Warn);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
