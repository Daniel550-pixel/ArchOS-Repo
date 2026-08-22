import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { aiosRuntime } from './aios/runtime';
import './index.css';
import './styles/ultron-command-center.css';
import './styles/ultron-os.css';

// AIOS runtime is initialized once at the application boundary.
aiosRuntime.initialize();

window.addEventListener('beforeunload', () => {
  aiosRuntime.shutdown();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
