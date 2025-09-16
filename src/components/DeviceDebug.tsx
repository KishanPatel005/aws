import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DeviceDebug: React.FC = () => {
  const { device } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded z-50">
      <div>Device: {device}</div>
      <div>Screen: {window.screen.width}x{window.screen.height}</div>
      <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
    </div>
  );
};

export default DeviceDebug;
