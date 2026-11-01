import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Design System: zuerst die Tokens mit der Schrift, danach die Bausteine (design-system/README.md, Einbau)
import '../design-system/tokens.css';
import '../design-system/components/bundle.css';
import './ui/app.css';
import { App } from './ui/App.tsx';

const wurzel = document.getElementById('app');
if (!wurzel) throw new Error('Element #app fehlt');
createRoot(wurzel).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
