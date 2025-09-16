import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, user_type, salary } = req.body;

    // Validate required fields
    if (!name || !email || !password || !user_type) {
      return res.status(400).json({ 
        error: 'Name, email, password, and user type are required' 
      });
    }

    // Validate user type
    const validUserTypes = ['SYSTEM_ADMIN', 'MANAGEMENT', 'MANAGER', 'EMPLOYEE'];
    if (!validUserTypes.includes(user_type)) {
      return res.status(400).json({ 
        error: 'Invalid user type. Must be one of: ' + validUserTypes.join(', ') 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        user_type,
        salary: salary ? parseFloat(salary) : null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        user_type: true,
        salary: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        user_type: user.user_type 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        user_type: user.user_type 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        user_type: true,
        salary: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, phone, salary } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (salary !== undefined) updateData.salary = parseFloat(salary);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        user_type: true,
        salary: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Get user permissions
export const getPermissions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { hasPermission, hasDeviceAccess } = require('../middleware/auth');
    const device = req.device || 'desktop';

    const modules = [
      'employee_master',
      'expense_salary',
      'expense_advertisement', 
      'expense_office',
      'expense_advance',
      'expense_withdrawal',
      'builder',
      'project',
      'inventory',
      'booking',
      'booking_approval',
      'payment_collection',
      'brokerage_mapping',
      'brokerage_distribution',
      'land_management',
      'land_booking',
      'resale_property',
      'resale_booking',
      'dashboard',
      'document_search',
      'activity_log',
      'flash_calculator',
      'send_wishes'
    ];

    const permissions: Record<string, any> = {};

    modules.forEach(module => {
      const modulePermissions = {
        canCreate: hasPermission(req.user!.user_type, module, 'C'),
        canRead: hasPermission(req.user!.user_type, module, 'R'),
        canUpdate: hasPermission(req.user!.user_type, module, 'U'),
        canEnableDisable: hasPermission(req.user!.user_type, module, 'E') || hasPermission(req.user!.user_type, module, 'D'),
        canApprove: hasPermission(req.user!.user_type, module, 'A'),
        canConfigure: hasPermission(req.user!.user_type, module, 'Configure'),
        canUse: hasPermission(req.user!.user_type, module, 'Use'),
        deviceAccess: hasDeviceAccess(device, module)
      };

      permissions[module] = modulePermissions;
    });

    res.json({
      user: req.user,
      device,
      permissions
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to get permissions' });
  }
};

// Logout (client-side token removal, but we can log it)
export const logout = async (req: Request, res: Response) => {
  try {
    // In a more sophisticated system, you might want to blacklist the token
    // For now, we'll just return success since JWT is stateless
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};
