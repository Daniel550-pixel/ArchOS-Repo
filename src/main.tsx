import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { aiosRuntime } from './aios/runtime';
import { executionTrace } from './aios/executionTrace';
import { intelligenceTelemetry } from './aios/intelligenceTelemetry';
import { sessionIntelligence } from './aios/sessionIntelligence';
import { initializeGestureRuntime } from './services/spatial/GestureRuntime';
import './index.css';
import './styles/one-world.css';

aiosRuntime.initialize();
executionTrace.initialize();
intelligenceTelemetry.initialize();
sessionIntelligence.initialize();
initializeGestureRuntime();

window.addEventListener('beforeunload', () => {
  sessionIntelligence.shutdown();
  executionTrace.shutdown();
  intelligenceTelemetry.shutdown();
  aiosRuntime.shutdown();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
