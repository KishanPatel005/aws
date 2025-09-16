import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Get all builders
export const getAllBuilders = async (req: Request, res: Response) => {
  try {
    const builders = await prisma.builder.findMany({
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            city: true,
            status: true,
            isEnabled: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(builders);
  } catch (error) {
    console.error('Error fetching builders:', error);
    res.status(500).json({ error: 'Failed to fetch builders' });
  }
};

// Get builder by ID
export const getBuilderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const builder = await prisma.builder.findUnique({
      where: { id: parseInt(id) },
      include: {
        projects: true
      }
    });
    
    if (!builder) {
      return res.status(404).json({ error: 'Builder not found' });
    }
    
    res.json(builder);
  } catch (error) {
    console.error('Error fetching builder:', error);
    res.status(500).json({ error: 'Failed to fetch builder' });
  }
};

// Create new builder
export const createBuilder = async (req: Request, res: Response) => {
  try {
    const { name, address, pocs, date, status } = req.body;
    const logoPath = req.file ? `/uploads/builders/${req.file.filename}` : null;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    // Parse POCs JSON if provided
    let parsedPocs = null;
    if (pocs) {
      try {
        parsedPocs = JSON.parse(pocs);
        // Validate POCs structure
        if (Array.isArray(parsedPocs) && parsedPocs.length > 3) {
          return res.status(400).json({
            error: 'Maximum 3 POCs allowed'
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: 'POCs must be valid JSON'
        });
      }
    }

    const builder = await prisma.builder.create({
      data: {
        name,
        address: address || null,
        pocs: parsedPocs,
        logo: logoPath,
        date: date ? new Date(date) : new Date(),
        status: status === 'true' || status === true
      }
    });

    res.status(201).json(builder);
  } catch (error) {
    console.error('Error creating builder:', error);
    res.status(500).json({ error: 'Failed to create builder' });
  }
};

// Update builder
export const updateBuilder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, pocs, date, status } = req.body;
    const logoPath = req.file ? `/uploads/builders/${req.file.filename}` : undefined;

    // Check if builder exists
    const existingBuilder = await prisma.builder.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingBuilder) {
      return res.status(404).json({ error: 'Builder not found' });
    }

    // Parse POCs JSON if provided
    let parsedPocs;
    if (pocs) {
      try {
        parsedPocs = JSON.parse(pocs);
        // Validate POCs structure
        if (Array.isArray(parsedPocs) && parsedPocs.length > 3) {
          return res.status(400).json({
            error: 'Maximum 3 POCs allowed'
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: 'POCs must be valid JSON'
        });
      }
    }

    // Delete old logo if new one is uploaded
    if (logoPath && existingBuilder.logo) {
      const oldLogoPath = path.join(process.cwd(), existingBuilder.logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    const builder = await prisma.builder.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address: address || null }),
        ...(pocs && { pocs: parsedPocs }),
        ...(logoPath && { logo: logoPath }),
        ...(date && { date: new Date(date) }),
        ...(status !== undefined && { status: status === 'true' || status === true })
      }
    });

    res.json(builder);
  } catch (error) {
    console.error('Error updating builder:', error);
    res.status(500).json({ error: 'Failed to update builder' });
  }
};

// Delete builder
export const deleteBuilder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get builder to delete logo file
    const builder = await prisma.builder.findUnique({
      where: { id: parseInt(id) }
    });

    if (!builder) {
      return res.status(404).json({ error: 'Builder not found' });
    }

    // Delete logo file if exists
    if (builder.logo) {
      const logoPath = path.join(process.cwd(), builder.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    await prisma.builder.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Builder deleted successfully' });
  } catch (error) {
    console.error('Error deleting builder:', error);
    res.status(500).json({ error: 'Failed to delete builder' });
  }
};
