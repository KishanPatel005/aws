import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleBasedComponentProps {
  children: React.ReactNode;
  module: string;
  action: string;
  fallback?: React.ReactNode;
  requireDeviceAccess?: boolean;
}

const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({ 
  children, 
  module, 
  action, 
  fallback = null,
  requireDeviceAccess = true
}) => {
  const { hasPermission, hasDeviceAccess, device } = useAuth();

  // Check permission
  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  // Check device access if required
  if (requireDeviceAccess && !hasDeviceAccess(module)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedComponent;
