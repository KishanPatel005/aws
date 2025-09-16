import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        user_type: string;
        name: string;
      };
      device?: 'desktop' | 'mobile' | 'tablet' | 'both';
    }
  }
}

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Device detection middleware
export const detectDevice = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Check if request is from mobile app (you can add custom headers)
  const isMobileApp = req.headers['x-mobile-app'] === 'true';
  
  // Simple and reliable device detection
  if (isMobileApp) {
    req.device = 'mobile';
  } else if (/iPad/i.test(userAgent)) {
    req.device = 'tablet';
  } else if (/Android.*Tablet|Tablet.*Android/i.test(userAgent)) {
    req.device = 'tablet';
  } else if (/iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    req.device = 'mobile';
  } else {
    req.device = 'desktop';
  }
  
  next();
};

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        user_type: true,
        password: false // Don't include password
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.user_type)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Device-based access control middleware
export const requireDevice = (allowedDevices: ('desktop' | 'mobile' | 'tablet' | 'both')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.device) {
      return res.status(400).json({ error: 'Device detection failed' });
    }

    // Treat tablets as desktop for most modules
    const deviceType = req.device === 'tablet' ? 'desktop' : req.device;
    const allowedTypes = allowedDevices.map(d => d === 'tablet' ? 'desktop' : d);

    if (!allowedTypes.includes(deviceType) && !allowedTypes.includes('both')) {
      return res.status(403).json({ 
        error: `Access denied. This feature is only available on: ${allowedDevices.join(', ')}` 
      });
    }

    next();
  };
};

// Combined role and device access control
export const requireAccess = (allowedRoles: string[], allowedDevices: ('desktop' | 'mobile' | 'tablet' | 'both')[]) => {
  return [
    authenticateToken,
    detectDevice,
    requireRole(allowedRoles),
    requireDevice(allowedDevices)
  ];
};

// Permission checker helper
export const hasPermission = (userRole: string, module: string, action: string): boolean => {
  const permissions: Record<string, Record<string, string[]>> = {
    'SYSTEM_ADMIN': {
      'employee_master': ['C', 'R', 'U', 'E', 'D'],
      'expense_salary': ['C', 'R', 'U'],
      'expense_advertisement': ['C', 'R', 'U'],
      'expense_office': ['C', 'R', 'U'],
      'expense_advance': ['C', 'R', 'U'],
      'expense_withdrawal': ['C', 'R', 'U'],
      'builder': ['C', 'R', 'U', 'E', 'D'],
      'project': ['C', 'R', 'U', 'E', 'D'],
      'inventory': ['C', 'R', 'U', 'E', 'D'],
      'booking': ['C', 'R', 'U', 'A', 'D'], // Added 'D' for delete
      'booking_approval': ['A', 'C', 'R', 'U', 'D'], // Added 'D' for delete
      'payment_collection': ['C', 'R', 'U'],
      'brokerage_mapping': ['C', 'R', 'U'],
      'brokerage_distribution': ['C', 'R', 'U'],
      'land_management': ['C', 'R', 'U', 'E', 'D'],
      'land_booking': ['C', 'R', 'U'],
      'resale_property': ['C', 'R', 'U', 'E', 'D'],
      'resale_booking': ['C', 'R', 'U'],
      'dashboard': ['R'],
      'document_search': ['R'],
      'activity_log': ['R'],
      'flash_calculator': ['Use'],
      'send_wishes': ['Configure']
    },
    'MANAGEMENT': {
      'employee_master': ['C', 'R', 'U'],
      'expense_salary': ['C', 'R', 'U'],
      'expense_advertisement': ['C', 'R', 'U'],
      'expense_office': ['C', 'R', 'U'],
      'expense_advance': ['C', 'R', 'U'],
      'expense_withdrawal': ['C', 'R', 'U'],
      'builder': ['C', 'R', 'U', 'E', 'D'],
      'project': ['C', 'R', 'U', 'E', 'D'],
      'inventory': ['C', 'R', 'U', 'E', 'D'],
      'booking': ['C', 'R', 'U', 'D'], // Added 'D' for delete
      'booking_approval': ['A', 'C', 'R', 'U', 'D'], // Added 'D' for delete
      'payment_collection': ['C', 'R', 'U'],
      'brokerage_mapping': ['C', 'R', 'U'],
      'brokerage_distribution': ['C', 'R', 'U'],
      'land_management': ['C', 'R', 'U', 'E', 'D'],
      'land_booking': ['C', 'R', 'U'],
      'resale_property': ['C', 'R', 'U', 'E', 'D'],
      'resale_booking': ['C', 'R', 'U'],
      'dashboard': ['R'],
      'document_search': ['R'],
      'activity_log': ['R'],
      'flash_calculator': ['Use'],
      'send_wishes': ['Configure']
    },
    'MANAGER': {
      'builder': ['C', 'R', 'U', 'E', 'D'],
      'project': ['C', 'R', 'U', 'E', 'D'],
      'inventory': ['C', 'R', 'U', 'E', 'D'],
      'booking': ['C', 'R', 'U', 'D'], // Added 'D' for delete
      'booking_approval': ['R'],
      'payment_collection': ['R'],
      'brokerage_mapping': ['R'],
      'brokerage_distribution': ['R'],
      'land_management': ['R'],
      'land_booking': ['R'],
      'resale_property': ['C', 'R', 'U'],
      'resale_booking': ['C', 'R', 'U'],
      'dashboard': ['R'],
      'document_search': ['R'],
      'activity_log': ['R'],
      'flash_calculator': ['Use']
    },
    'EMPLOYEE': {
      'builder': ['R'],
      'project': ['R'],
      'inventory': ['R'],
      'booking': ['C', 'R'], // Removed 'U' - employees can only create and read bookings
      'booking_approval': ['R'], // Can only view approvals, not approve
      'payment_collection': ['R'],
      'brokerage_mapping': ['R'],
      'brokerage_distribution': ['R'],
      'land_management': ['R'],
      'land_booking': ['R'],
      'resale_property': ['R'],
      'resale_booking': ['C', 'R'], // Removed 'U' - employees can only create and read resale bookings
      'dashboard': ['R'],
      'document_search': ['R'],
      'activity_log': ['R'],
      'flash_calculator': ['Use']
    }
  };

  const userPermissions = permissions[userRole];
  if (!userPermissions || !userPermissions[module]) {
    return false;
  }

  return userPermissions[module].includes(action);
};

// Device access checker
export const hasDeviceAccess = (device: string, module: string): boolean => {
  const deviceAccess: Record<string, string[]> = {
    'employee_master': ['desktop'],
    'expense_salary': ['desktop'],
    'expense_advertisement': ['desktop'],
    'expense_office': ['desktop'],
    'expense_advance': ['desktop'],
    'expense_withdrawal': ['desktop'],
    'builder': ['desktop', 'mobile', 'tablet'],
    'project': ['desktop', 'mobile', 'tablet'],
    'inventory': ['desktop', 'mobile', 'tablet'],
    'booking': ['desktop', 'mobile', 'tablet'],
    'booking_approval': ['desktop', 'mobile', 'tablet'],
    'payment_collection': ['desktop', 'mobile', 'tablet'],
    'brokerage_mapping': ['desktop', 'mobile', 'tablet'],
    'brokerage_distribution': ['desktop', 'mobile', 'tablet'],
    'land_management': ['desktop', 'mobile', 'tablet'],
    'land_booking': ['desktop', 'mobile', 'tablet'],
    'resale_property': ['desktop', 'mobile', 'tablet'],
    'resale_booking': ['desktop', 'mobile', 'tablet'],
    'dashboard': ['desktop', 'mobile', 'tablet'],
    'document_search': ['desktop', 'mobile', 'tablet'],
    'activity_log': ['desktop', 'mobile', 'tablet'],
    'flash_calculator': ['desktop', 'mobile', 'tablet'],
    'send_wishes': ['desktop']
  };

  const allowedDevices = deviceAccess[module] || ['desktop'];
  
  // Treat tablets as desktop for most modules
  const deviceType = device === 'tablet' ? 'desktop' : device;
  const allowedTypes = allowedDevices.map(d => d === 'tablet' ? 'desktop' : d);
  
  return allowedTypes.includes(deviceType) || allowedTypes.includes('both');
};

export default {
  authenticateToken,
  detectDevice,
  requireRole,
  requireDevice,
  requireAccess,
  hasPermission,
  hasDeviceAccess
};
