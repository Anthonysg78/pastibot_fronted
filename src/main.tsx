import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'react-phone-input-2/lib/style.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find the root element. Make sure there is a <div id="root"></div> in your HTML.');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);