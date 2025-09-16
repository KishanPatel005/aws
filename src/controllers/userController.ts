import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create new user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { user_type, name, email, phone, password, salary } = req.body;

    // Validate required fields
    if (!user_type || !name || !email || !phone || !password) {
      return res.status(400).json({
        error: 'User type, name, email, phone, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Validate user type
    const validUserTypes = ['SYSTEM_ADMIN', 'MANAGEMENT', 'MANAGER', 'EMPLOYEE'];
    if (!validUserTypes.includes(user_type)) {
      return res.status(400).json({
        error: 'Invalid user type. Must be SYSTEM_ADMIN, MANAGEMENT, MANAGER, or EMPLOYEE'
      });
    }

    // Validate salary if provided
    if (salary !== undefined && salary < 0) {
      return res.status(400).json({
        error: 'Salary must be a positive number'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    const user = await prisma.user.create({
      data: {
        user_type,
        name,
        email,
        phone,
        password, // Store as plain text for now
        salary: salary ? parseFloat(salary) : null
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_type, name, email, phone, password, salary } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }

      // Check if email already exists for another user
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: parseInt(id) }
        }
      });

      if (emailExists) {
        return res.status(400).json({
          error: 'User with this email already exists'
        });
      }
    }

    // Validate user type if provided
    if (user_type) {
      const validUserTypes = ['SYSTEM_ADMIN', 'MANAGEMENT', 'MANAGER', 'EMPLOYEE'];
      if (!validUserTypes.includes(user_type)) {
        return res.status(400).json({
          error: 'Invalid user type. Must be SYSTEM_ADMIN, MANAGEMENT, MANAGER, or EMPLOYEE'
        });
      }
    }

    // Validate salary if provided
    if (salary !== undefined && salary < 0) {
      return res.status(400).json({
        error: 'Salary must be a positive number'
      });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(user_type && { user_type }),
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(password && { password }),
        ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null })
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
