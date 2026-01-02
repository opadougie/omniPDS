
import React from 'react';
// Fix: Import createRoot from react-dom/client for React 18+ compatibility
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}