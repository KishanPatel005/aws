import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all inventory items
export const getAllInventory = async (req: Request, res: Response) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            city: true,
            builder: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

// Get inventory item by ID
export const getInventoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inventory = await prisma.inventory.findUnique({
      where: { id: parseInt(id) },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            city: true,
            builder: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        }
      }
    });
    
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
};

// Create new inventory item
export const createInventory = async (req: Request, res: Response) => {
  try {
    const { projectId, unitType, mou, size, rate, remarks, status } = req.body;

    // Validate required fields
    if (!projectId || !unitType || !mou || !size || !rate) {
      return res.status(400).json({
        error: 'Project ID, unit type, MOU, size, and rate are required'
      });
    }

    // Validate numeric values
    const sizeNum = parseFloat(size);
    const rateNum = parseFloat(rate);

    if (sizeNum <= 0) {
      return res.status(400).json({
        error: 'Size must be greater than 0'
      });
    }

    if (rateNum <= 0) {
      return res.status(400).json({
        error: 'Rate must be greater than 0'
      });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      return res.status(400).json({
        error: 'Project not found'
      });
    }

    // Calculate amount
    const amount = sizeNum * rateNum;

    const inventory = await prisma.inventory.create({
      data: {
        projectId: parseInt(projectId),
        unitType: unitType.trim(),
        mou: mou.trim(),
        size: sizeNum,
        rate: rateNum,
        amount: amount,
        remarks: remarks?.trim() || null,
        status: status === 'true' || status === true
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            city: true,
            builder: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(inventory);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
};

// Update inventory item
export const updateInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { projectId, unitType, mou, size, rate, remarks, status } = req.body;

    // Check if inventory item exists
    const existingInventory = await prisma.inventory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingInventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Validate numeric values if provided
    let sizeNum = existingInventory.size;
    let rateNum = existingInventory.rate;

    if (size !== undefined) {
      sizeNum = parseFloat(size);
      if (sizeNum <= 0) {
        return res.status(400).json({
          error: 'Size must be greater than 0'
        });
      }
    }

    if (rate !== undefined) {
      rateNum = parseFloat(rate);
      if (rateNum <= 0) {
        return res.status(400).json({
          error: 'Rate must be greater than 0'
        });
      }
    }

    // Check if project exists if projectId is provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) }
      });

      if (!project) {
        return res.status(400).json({
          error: 'Project not found'
        });
      }
    }

    // Calculate amount
    const amount = sizeNum * rateNum;

    const inventory = await prisma.inventory.update({
      where: { id: parseInt(id) },
      data: {
        ...(projectId && { projectId: parseInt(projectId) }),
        ...(unitType && { unitType: unitType.trim() }),
        ...(mou && { mou: mou.trim() }),
        ...(size !== undefined && { size: sizeNum }),
        ...(rate !== undefined && { rate: rateNum }),
        amount: amount, // Always update amount
        ...(remarks !== undefined && { remarks: remarks?.trim() || null }),
        ...(status !== undefined && { status: status === 'true' || status === true })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            city: true,
            builder: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            }
          }
        }
      }
    });

    res.json(inventory);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
};

// Delete inventory item
export const deleteInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if inventory item exists
    const inventory = await prisma.inventory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    await prisma.inventory.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};
