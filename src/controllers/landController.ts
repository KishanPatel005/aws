import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all lands with optional search
export const getAllLands = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    let whereClause: any = {};
    
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { fpNo: { contains: search as string, mode: 'insensitive' } },
          { ownerName: { contains: search as string, mode: 'insensitive' } },
          { village: { contains: search as string, mode: 'insensitive' } },
          { taluka: { contains: search as string, mode: 'insensitive' } },
          { district: { contains: search as string, mode: 'insensitive' } }
        ]
      };
    }

    const lands = await prisma.land.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(lands);
  } catch (error) {
    console.error('Error fetching lands:', error);
    res.status(500).json({ error: 'Failed to fetch lands' });
  }
};

// Get land by ID
export const getLandById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const land = await prisma.land.findUnique({
      where: { id: parseInt(id) },
      include: {
        bookings: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });
    
    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }
    
    res.json(land);
  } catch (error) {
    console.error('Error fetching land:', error);
    res.status(500).json({ error: 'Failed to fetch land' });
  }
};

// Create new land
export const createLand = async (req: Request, res: Response) => {
  try {
    const {
      name,
      date,
      address,
      village,
      taluka,
      district,
      googleLink,
      mouUnit,
      size,
      rate,
      ownerName,
      ownerMobile,
      refName,
      refMobile,
      fpNo,
      status
    } = req.body;

    // Validate required fields
    if (!name || !mouUnit || !size || !rate || !ownerName || !ownerMobile) {
      return res.status(400).json({
        error: 'Name, MOU Unit, Size, Rate, Owner Name, and Owner Mobile are required'
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

    // Validate MOU unit
    const validMouUnits = ['Vigha', 'Vaar'];
    if (!validMouUnits.includes(mouUnit)) {
      return res.status(400).json({ error: 'MOU Unit must be either Vigha or Vaar' });
    }

    // Calculate amount
    const amount = sizeNum * rateNum;

    // Process file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const mapDocs = files?.mapDocs?.map(file => `/uploads/land/${file.filename}`) || [];
    const villageMapDocs = files?.villageMapDocs?.map(file => `/uploads/land/${file.filename}`) || [];
    const sevenTwelveDocs = files?.sevenTwelveDocs?.map(file => `/uploads/land/${file.filename}`) || [];
    const fpDocs = files?.fpDocs?.map(file => `/uploads/land/${file.filename}`) || [];

    const land = await prisma.land.create({
      data: {
        name: name.trim(),
        date: date ? new Date(date) : new Date(),
        address: address?.trim() || null,
        village: village?.trim() || null,
        taluka: taluka?.trim() || null,
        district: district?.trim() || null,
        googleLink: googleLink?.trim() || null,
        mouUnit: mouUnit.trim(),
        size: sizeNum,
        rate: rateNum,
        amount: amount,
        ownerName: ownerName.trim(),
        ownerMobile: ownerMobile.trim(),
        refName: refName?.trim() || null,
        refMobile: refMobile?.trim() || null,
        fpNo: fpNo?.trim() || null,
        status: status !== undefined ? Boolean(status) : true,
        mapDocs: mapDocs.length > 0 ? mapDocs : undefined,
        villageMapDocs: villageMapDocs.length > 0 ? villageMapDocs : undefined,  
        sevenTwelveDocs: sevenTwelveDocs.length > 0 ? sevenTwelveDocs : undefined,
        fpDocs: fpDocs.length > 0 ? fpDocs : undefined
      }
    });

    res.status(201).json(land);
  } catch (error) {
    console.error('Error creating land:', error);
    res.status(500).json({ error: 'Failed to create land' });
  }
};

// Update land
export const updateLand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      date,
      address,
      village,
      taluka,
      district,
      googleLink,
      mouUnit,
      size,
      rate,
      ownerName,
      ownerMobile,
      refName,
      refMobile,
      fpNo,
      status
    } = req.body;

    // Check if land exists
    const existingLand = await prisma.land.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLand) {
      return res.status(404).json({ error: 'Land not found' });
    }

    // Validate numbers if provided
    let sizeNum = existingLand.size;
    let rateNum = existingLand.rate;
    
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

    // Validate MOU unit if provided
    if (mouUnit) {
      const validMouUnits = ['Vigha', 'Vaar'];
      if (!validMouUnits.includes(mouUnit)) {
        return res.status(400).json({ error: 'MOU Unit must be either Vigha or Vaar' });
      }
    }

    // Calculate amount
    const amount = sizeNum * rateNum;

    // Process file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const mapDocs = files?.mapDocs?.map(file => `/uploads/land/${file.filename}`) || [];
    const villageMapDocs = files?.villageMapDocs?.map(file => `/uploads/land/${file.filename}`) || [];
    const sevenTwelveDocs = files?.sevenTwelveDocs?.map(file => `/uploads/land/${file.filename}`) || [];
    const fpDocs = files?.fpDocs?.map(file => `/uploads/land/${file.filename}`) || [];

    // Get existing document arrays
    const existingMapDocs = (existingLand.mapDocs as string[]) || [];
    const existingVillageMapDocs = (existingLand.villageMapDocs as string[]) || [];
    const existingSevenTwelveDocs = (existingLand.sevenTwelveDocs as string[]) || [];
    const existingFpDocs = (existingLand.fpDocs as string[]) || [];

    const land = await prisma.land.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(date && { date: new Date(date) }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(village !== undefined && { village: village?.trim() || null }),
        ...(taluka !== undefined && { taluka: taluka?.trim() || null }),
        ...(district !== undefined && { district: district?.trim() || null }),
        ...(googleLink !== undefined && { googleLink: googleLink?.trim() || null }),
        ...(mouUnit && { mouUnit: mouUnit.trim() }),
        ...(size !== undefined && { size: sizeNum }),
        ...(rate !== undefined && { rate: rateNum }),
        amount: amount,
        ...(ownerName && { ownerName: ownerName.trim() }),
        ...(ownerMobile && { ownerMobile: ownerMobile.trim() }),
        ...(refName !== undefined && { refName: refName?.trim() || null }),
        ...(refMobile !== undefined && { refMobile: refMobile?.trim() || null }),
        ...(fpNo !== undefined && { fpNo: fpNo?.trim() || null }),
        ...(status !== undefined && { status: Boolean(status) }),
        mapDocs: mapDocs.length > 0 ? [...existingMapDocs, ...mapDocs] : existingMapDocs,
        villageMapDocs: villageMapDocs.length > 0 ? [...existingVillageMapDocs, ...villageMapDocs] : existingVillageMapDocs,
        sevenTwelveDocs: sevenTwelveDocs.length > 0 ? [...existingSevenTwelveDocs, ...sevenTwelveDocs] : existingSevenTwelveDocs,
        fpDocs: fpDocs.length > 0 ? [...existingFpDocs, ...fpDocs] : existingFpDocs
      }
    });

    res.json(land);
  } catch (error) {
    console.error('Error updating land:', error);
    res.status(500).json({ error: 'Failed to update land' });
  }
};

// Toggle land status
export const toggleLandStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const land = await prisma.land.findUnique({
      where: { id: parseInt(id) }
    });

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    const updatedLand = await prisma.land.update({
      where: { id: parseInt(id) },
      data: {
        status: !land.status
      }
    });

    res.json(updatedLand);
  } catch (error) {
    console.error('Error toggling land status:', error);
    res.status(500).json({ error: 'Failed to toggle land status' });
  }
};

// Delete land
export const deleteLand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const land = await prisma.land.findUnique({
      where: { id: parseInt(id) }
    });

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    await prisma.land.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Land deleted successfully' });
  } catch (error) {
    console.error('Error deleting land:', error);
    res.status(500).json({ error: 'Failed to delete land' });
  }
};
