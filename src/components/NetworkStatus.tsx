import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const { refreshTokenWithRetry, authenticated } = useAuth();

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network connection restored');
      setIsOnline(true);
      setShowStatus(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
      
      // Trigger token refresh if authenticated
      if (authenticated) {
        refreshTokenWithRetry?.();
      }
    };

    const handleOffline = () => {
      console.log('📴 Network connection lost');
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show initial status if offline
    if (!navigator.onLine) {
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [authenticated, refreshTokenWithRetry]);

  if (!showStatus) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">No internet connection</span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;