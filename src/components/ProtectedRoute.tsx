import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: {
    module: string;
    action: string;
  };
  requiredDevice?: ('desktop' | 'mobile' | 'tablet' | 'both')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  requiredDevice 
}) => {
  const { user, hasPermission, hasDeviceAccess, device, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check device access if required
  if (requiredDevice) {
    // Treat tablets as desktop for most modules
    const deviceType = device === 'tablet' ? 'desktop' : device;
    const allowedTypes = requiredDevice.map(d => d === 'tablet' ? 'desktop' : d);
    
    if (!allowedTypes.includes(deviceType) && !allowedTypes.includes('both')) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Device Not Supported</h1>
            <p className="text-gray-600 mb-4">
              This feature is only available on: {requiredDevice.join(', ')}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              You are currently accessing from: {device}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Check module device access
  if (requiredPermission && !hasDeviceAccess(requiredPermission.module)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Device Access Denied</h1>
          <p className="text-gray-600 mb-4">
            This module is not available on your current device.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            You are currently accessing from: {device}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
