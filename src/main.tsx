import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Enhanced service worker registration with better error handling
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered successfully:', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
      });
      
      return registration;
    } catch (error) {
      console.warn('⚠️ Service Worker not supported in this environment', error);
    }
  }
};

// Enhanced network status monitoring
const setupNetworkMonitoring = () => {
  const handleOnline = () => {
    console.log('🌐 Network connection restored');
    // Trigger a token refresh check when coming back online
    const authStore = (window as any).__authStore;
    if (authStore?.authenticated && authStore?.user && !authStore?.isRefreshing) {
      console.log('🔄 Network restored - checking token freshness');
      authStore.refreshTokenWithRetry?.();
    }
  };

  const handleOffline = () => {
    console.log('📴 Network connection lost');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Initial network status check
  if (navigator.onLine) {
    console.log('🌐 App started with network connection');
  } else {
    console.log('📴 App started without network connection');
  }
};
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Initialize enhanced features
window.addEventListener('load', () => {
  registerServiceWorker();
  setupNetworkMonitoring();
});

// Prevent flash of incorrect theme
const script = document.createElement('script');
script.innerHTML = `
  (function() {
    try {
      var theme = localStorage.getItem('theme') || 'system';
      var isDark = theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      document.documentElement.classList.add(isDark ? 'dark' : 'light');
    } catch (e) {
      document.documentElement.classList.add('light');
    }
  })();
`;
document.head.insertBefore(script, document.head.firstChild);
