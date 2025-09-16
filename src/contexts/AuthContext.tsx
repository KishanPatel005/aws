import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  user_type: 'SYSTEM_ADMIN' | 'MANAGEMENT' | 'MANAGER' | 'EMPLOYEE';
  salary: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Permissions {
  [module: string]: {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canEnableDisable: boolean;
    canApprove: boolean;
    canConfigure: boolean;
    canUse: boolean;
    deviceAccess: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  permissions: Permissions | null;
  device: 'desktop' | 'mobile' | 'tablet';
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  hasPermission: (module: string, action: string) => boolean;
  hasDeviceAccess: (module: string) => boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  user_type: 'SYSTEM_ADMIN' | 'MANAGEMENT' | 'MANAGER' | 'EMPLOYEE';
  salary?: number;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Device detection utility
const detectDevice = (): 'desktop' | 'mobile' | 'tablet' => {
  const userAgent = navigator.userAgent;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  
  // Check for tablets (iPad, Android tablets)
  const isTablet = /iPad|Android/i.test(userAgent) && 
    ((screenWidth >= 768 && screenWidth <= 1024) || 
     (screenHeight >= 768 && screenHeight <= 1024));
  
  // Check for mobile phones
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) && 
    !isTablet && 
    (screenWidth < 768 || screenHeight < 768);
  
  // Check for desktop/laptop (including large tablets)
  const isDesktop = !isMobile && !isTablet && 
    (screenWidth >= 1024 || screenHeight >= 768);
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isDesktop) return 'desktop';
  
  // Fallback: consider anything with screen width >= 1024 as desktop
  return screenWidth >= 1024 ? 'desktop' : 'mobile';
};

// API base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

// Add request interceptor to include token
axios.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [device] = useState<'desktop' | 'mobile' | 'tablet'>(detectDevice());
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = Cookies.get('token');
      if (savedToken) {
        setToken(savedToken);
        try {
          // Get user profile and permissions
          const [profileResponse, permissionsResponse] = await Promise.all([
            axios.get('/auth/profile'),
            axios.get('/auth/permissions')
          ]);
          
          setUser(profileResponse.data);
          setPermissions(permissionsResponse.data.permissions);
        } catch (error) {
          console.error('Auth initialization error:', error);
          Cookies.remove('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/auth/login', { email, password });
      const { user: userData, token: authToken } = response.data;

      // Save token to cookies
      Cookies.set('token', authToken, { expires: 1 }); // 1 day

      // Get permissions
      const permissionsResponse = await axios.get('/auth/permissions');
      
      setUser(userData);
      setPermissions(permissionsResponse.data.permissions);
      setToken(authToken);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/auth/register', userData);
      const { user: newUser, token: authToken } = response.data;

      // Save token to cookies
      Cookies.set('token', authToken, { expires: 1 }); // 1 day

      // Get permissions
      const permissionsResponse = await axios.get('/auth/permissions');
      
      setUser(newUser);
      setPermissions(permissionsResponse.data.permissions);
      setToken(authToken);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    setPermissions(null);
    setToken(null);
    setError(null);
  };

  // Permission checker
  const hasPermission = (module: string, action: string): boolean => {
    if (!permissions || !permissions[module]) {
      return false;
    }

    const modulePermissions = permissions[module];
    
    switch (action) {
      case 'C':
        return modulePermissions.canCreate;
      case 'R':
        return modulePermissions.canRead;
      case 'U':
        return modulePermissions.canUpdate;
      case 'E':
      case 'D':
        return modulePermissions.canEnableDisable;
      case 'A':
        return modulePermissions.canApprove;
      case 'Configure':
        return modulePermissions.canConfigure;
      case 'Use':
        return modulePermissions.canUse;
      default:
        return false;
    }
  };

  // Device access checker
  const hasDeviceAccess = (module: string): boolean => {
    if (!permissions || !permissions[module]) {
      return false;
    }
    
    // For most modules, treat tablets as desktop
    if (device === 'tablet') {
      return permissions[module].deviceAccess;
    }
    
    return permissions[module].deviceAccess;
  };

  const value: AuthContextType = {
    user,
    permissions,
    device,
    token,
    login,
    register,
    logout,
    loading,
    error,
    hasPermission,
    hasDeviceAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
