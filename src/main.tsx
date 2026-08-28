import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { executionTrace } from './aios/executionTrace';
import { intelligenceTelemetry } from './aios/intelligenceTelemetry';
import { sessionIntelligence } from './aios/sessionIntelligence';
import { aiosRuntime } from './aios/runtime';
import { initializeGestureRuntime } from './services/spatial/GestureRuntime';
import './index.css';
import './styles/one-world.css';
import './styles/archos-design-system.css';

// Initialize observers before the runtime so no early AIOS event can escape tracing.
executionTrace.initialize();
intelligenceTelemetry.initialize();
sessionIntelligence.initialize();
aiosRuntime.initialize();
initializeGestureRuntime();

window.addEventListener('beforeunload', () => {
  sessionIntelligence.shutdown();
  intelligenceTelemetry.shutdown();
  executionTrace.shutdown();
  aiosRuntime.shutdown();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
