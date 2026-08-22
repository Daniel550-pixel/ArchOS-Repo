import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { RuntimePulseOverlay } from './components/runtime/RuntimePulseOverlay';
import { ProductionReadinessBar } from './components/runtime/ProductionReadinessBar';
import { UltronCommandCenter } from './components/layout/UltronCommandCenter';
import { aiosRuntime } from './aios/runtime';
import './index.css';
import './styles/ultron-command-center.css';

// Phase 5 AIOS bootstrap: initialize the runtime once at the application boundary.
aiosRuntime.initialize();

window.addEventListener('beforeunload', () => {
  aiosRuntime.shutdown();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <RuntimePulseOverlay />
    <ProductionReadinessBar />
    <UltronCommandCenter />
  </StrictMode>,
);
