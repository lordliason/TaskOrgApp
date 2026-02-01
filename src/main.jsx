import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Register service worker for PWA
registerSW({
  onNeedRefresh() {
    // Called when new content is available, could prompt user to refresh
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});

// Listen for messages from the service worker (e.g., notification clicks)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NOTIFICATION_CLICK') {
      console.log('Notification clicked:', event.data);
      // Handle navigation based on notification type
      // The app can use this to navigate to a specific task or view
      window.dispatchEvent(
        new CustomEvent('notification-click', { detail: event.data })
      );
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
