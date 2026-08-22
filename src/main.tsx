import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { RuntimePulseOverlay } from './components/runtime/RuntimePulseOverlay';
import { aiosRuntime } from './aios/runtime';
import './index.css';

// Phase 5 AIOS bootstrap: initialize the runtime once at the application boundary.
aiosRuntime.initialize();

window.addEventListener('beforeunload', () => {
  aiosRuntime.shutdown();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <RuntimePulseOverlay />
  </StrictMode>,
);
