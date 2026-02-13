/**
 * PNG Civil CAD - Main Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './ui/App.jsx';
import { NotificationProvider } from './ui/components/Notifications.jsx';
import './ui/styles/App.css';

// Register service worker for offline support (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.log('ServiceWorker registration failed:', error);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>
);
