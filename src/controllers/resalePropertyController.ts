import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all resale properties with optional search
export const getAllResaleProperties = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    let whereClause: any = {};
    
    if (search) {
      whereClause = {
        OR: [
          { propertyName: { contains: search as string, mode: 'insensitive' } },
          { building: { contains: search as string, mode: 'insensitive' } },
          { ownerName: { contains: search as string, mode: 'insensitive' } },
          { type: { contains: search as string, mode: 'insensitive' } },
          { propertyType: { contains: search as string, mode: 'insensitive' } }
        ]
      };
    }

    const properties = await prisma.resaleProperty.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(properties);
  } catch (error) {
    console.error('Error fetching resale properties:', error);
    res.status(500).json({ error: 'Failed to fetch resale properties' });
  }
};

// Get resale property by ID
export const getResalePropertyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const property = await prisma.resaleProperty.findUnique({
      where: { id: parseInt(id) },
      include: {
        bookings: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Resale property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching resale property:', error);
    res.status(500).json({ error: 'Failed to fetch resale property' });
  }
};

// Create new resale property
export const createResaleProperty = async (req: Request, res: Response) => {
  try {
    const {
      date,
      type,
      building,
      propertyName,
      unitNo,
      propertyType,
      size,
      rate,
      ownerName,
      ownerMobile,
      refName,
      refMobile,
      additionalCharges,
      status
    } = req.body;

    // Validate required fields
    if (!type || !propertyName || !propertyType || !size || !rate || !ownerName || !ownerMobile) {
      return res.status(400).json({
        error: 'Type, Property Name, Property Type, Size, Rate, Owner Name, and Owner Mobile are required'
      });
    }

    // Validate numbers
    const sizeNum = parseFloat(size);
    const rateNum = parseFloat(rate);
    
    if (isNaN(sizeNum) || sizeNum <= 0) {
      return res.status(400).json({ error: 'Size must be a positive number' });
    }
    
    if (isNaN(rateNum) || rateNum <= 0) {
      return res.status(400).json({ error: 'Rate must be a positive number' });
    }

    // Validate type
    const validTypes = ['RENT', 'RESALE', 'PRELEASED'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Type must be one of: RENT, RESALE, PRELEASED' });
    }

    // Calculate amount
    const amount = sizeNum * rateNum;

    // Process file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documents = files?.documents?.map(file => `/uploads/resale/${file.filename}`) || [];

    // Parse additional charges if provided
    let parsedAdditionalCharges = null;
    if (additionalCharges) {
      try {
        parsedAdditionalCharges = typeof additionalCharges === 'string' 
          ? JSON.parse(additionalCharges) 
          : additionalCharges;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid additional charges format' });
      }
    }

    const property = await prisma.resaleProperty.create({
      data: {
        date: date ? new Date(date) : new Date(),
        type: type.trim(),
        building: building?.trim() || null,
        propertyName: propertyName.trim(),
        unitNo: unitNo?.trim() || null,
        propertyType: propertyType.trim(),
        size: sizeNum,
        rate: rateNum,
        amount: amount,
        ownerName: ownerName.trim(),
        ownerMobile: ownerMobile.trim(),
        refName: refName?.trim() || null,
        refMobile: refMobile?.trim() || null,
        additionalCharges: parsedAdditionalCharges,
        documents: documents.length > 0 ? documents : undefined,
        status: status !== undefined ? Boolean(status) : true
      }
    });

    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating resale property:', error);
    res.status(500).json({ error: 'Failed to create resale property' });
  }
};

// Update resale property
export const updateResaleProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      date,
      type,
      building,
      propertyName,
      unitNo,
      propertyType,
      size,
      rate,
      ownerName,
      ownerMobile,
      refName,
      refMobile,
      additionalCharges,
      status
    } = req.body;

    // Check if property exists
    const existingProperty = await prisma.resaleProperty.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProperty) {
      return res.status(404).json({ error: 'Resale property not found' });
    }

    // Validate numbers if provided
    let sizeNum = existingProperty.size;
    let rateNum = existingProperty.rate;
    
    if (size !== undefined) {
      sizeNum = parseFloat(size);
      if (isNaN(sizeNum) || sizeNum <= 0) {
        return res.status(400).json({ error: 'Size must be a positive number' });
      }
    }
    
    if (rate !== undefined) {
      rateNum = parseFloat(rate);
      if (isNaN(rateNum) || rateNum <= 0) {
        return res.status(400).json({ error: 'Rate must be a positive number' });
      }
    }

    // Validate type if provided
    if (type) {
      const validTypes = ['RENT', 'RESALE', 'PRELEASED'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Type must be one of: RENT, RESALE, PRELEASED' });
      }
    }

    // Calculate amount
    const amount = sizeNum * rateNum;

    // Process file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const newDocuments = files?.documents?.map(file => `/uploads/resale/${file.filename}`) || [];

    // Get existing documents
    const existingDocuments = (existingProperty.documents as string[]) || [];

    // Parse additional charges if provided
    let parsedAdditionalCharges = existingProperty.additionalCharges;
    if (additionalCharges !== undefined) {
      try {
        parsedAdditionalCharges = typeof additionalCharges === 'string' 
          ? JSON.parse(additionalCharges) 
          : additionalCharges;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid additional charges format' });
      }
    }

    const property = await prisma.resaleProperty.update({
      where: { id: parseInt(id) },
      data: {
        ...(date && { date: new Date(date) }),
        ...(type && { type: type.trim() }),
        ...(building !== undefined && { building: building?.trim() || null }),
        ...(propertyName && { propertyName: propertyName.trim() }),
        ...(unitNo !== undefined && { unitNo: unitNo?.trim() || null }),
        ...(propertyType && { propertyType: propertyType.trim() }),
        ...(size !== undefined && { size: sizeNum }),
        ...(rate !== undefined && { rate: rateNum }),
        amount: amount,
        ...(ownerName && { ownerName: ownerName.trim() }),
        ...(ownerMobile && { ownerMobile: ownerMobile.trim() }),
        ...(refName !== undefined && { refName: refName?.trim() || null }),
        ...(refMobile !== undefined && { refMobile: refMobile?.trim() || null }),
        ...(additionalCharges !== undefined && { additionalCharges: parsedAdditionalCharges }),
        documents: newDocuments.length > 0 ? [...existingDocuments, ...newDocuments] : existingDocuments,
        ...(status !== undefined && { status: Boolean(status) })
      }
    });

    res.json(property);
  } catch (error) {
    console.error('Error updating resale property:', error);
    res.status(500).json({ error: 'Failed to update resale property' });
  }
};

// Toggle resale property status
export const toggleResalePropertyStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const property = await prisma.resaleProperty.findUnique({
      where: { id: parseInt(id) }
    });

    if (!property) {
      return res.status(404).json({ error: 'Resale property not found' });
    }

    const updatedProperty = await prisma.resaleProperty.update({
      where: { id: parseInt(id) },
      data: {
        status: !property.status
      }
    });

    res.json(updatedProperty);
  } catch (error) {
    console.error('Error toggling resale property status:', error);
    res.status(500).json({ error: 'Failed to toggle resale property status' });
  }
};

// Duplicate resale property
export const duplicateResaleProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const originalProperty = await prisma.resaleProperty.findUnique({
      where: { id: parseInt(id) }
    });

    if (!originalProperty) {
      return res.status(404).json({ error: 'Resale property not found' });
    }

    const duplicatedProperty = await prisma.resaleProperty.create({
      data: {
        date: new Date(),
        type: originalProperty.type,
        building: originalProperty.building,
        propertyName: `${originalProperty.propertyName} (Copy)`,
        unitNo: originalProperty.unitNo,
        propertyType: originalProperty.propertyType,
        size: originalProperty.size,
        rate: originalProperty.rate,
        amount: originalProperty.amount,
        ownerName: originalProperty.ownerName,
        ownerMobile: originalProperty.ownerMobile,
        refName: originalProperty.refName,
        refMobile: originalProperty.refMobile,
        additionalCharges: originalProperty.additionalCharges || undefined,
        documents: originalProperty.documents || undefined,
        status: true
      }
    });

    res.status(201).json(duplicatedProperty);
  } catch (error) {
    console.error('Error duplicating resale property:', error);
    res.status(500).json({ error: 'Failed to duplicate resale property' });
  }
};

// Delete resale property
export const deleteResaleProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const property = await prisma.resaleProperty.findUnique({
      where: { id: parseInt(id) }
    });

    if (!property) {
      return res.status(404).json({ error: 'Resale property not found' });
    }

    await prisma.resaleProperty.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Resale property deleted successfully' });
  } catch (error) {
    console.error('Error deleting resale property:', error);
    res.status(500).json({ error: 'Failed to delete resale property' });
  }
};
