import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { aiosRuntime } from './aios/runtime';
import { intelligenceTelemetry } from './aios/intelligenceTelemetry';
import { initializeGestureRuntime } from './services/spatial/GestureRuntime';
import './index.css';
import './styles/one-world.css';

aiosRuntime.initialize();
intelligenceTelemetry.initialize();
initializeGestureRuntime();

window.addEventListener('beforeunload', () => {
  intelligenceTelemetry.shutdown();
  aiosRuntime.shutdown();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
