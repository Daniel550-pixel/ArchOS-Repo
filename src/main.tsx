import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { RuntimePulseOverlay } from './components/runtime/RuntimePulseOverlay';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <RuntimePulseOverlay />
  </StrictMode>,
);
