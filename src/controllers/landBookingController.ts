import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all land bookings with optional landId filter
export const getAllLandBookings = async (req: Request, res: Response) => {
  try {
    const { landId } = req.query;
    
    let whereClause: any = {};
    
    if (landId) {
      whereClause.landId = parseInt(landId as string);
    }

    const bookings = await prisma.landBooking.findMany({
      where: whereClause,
      include: {
        land: {
          select: {
            id: true,
            name: true,
            village: true,
            taluka: true,
            district: true,
            mouUnit: true,
            size: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching land bookings:', error);
    res.status(500).json({ error: 'Failed to fetch land bookings' });
  }
};

// Get land booking by ID
export const getLandBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.landBooking.findUnique({
      where: { id: parseInt(id) },
      include: {
        land: {
          select: {
            id: true,
            name: true,
            village: true,
            taluka: true,
            district: true,
            mouUnit: true,
            size: true,
            rate: true
          }
        },
        payments: {
          include: {
            collectedUser: {
              select: {
                id: true,
                name: true,
                user_type: true
              }
            },
            receivedUser: {
              select: {
                id: true,
                name: true,
                user_type: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Land booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching land booking:', error);
    res.status(500).json({ error: 'Failed to fetch land booking' });
  }
};

// Create new land booking
export const createLandBooking = async (req: Request, res: Response) => {
  try {
    const {
      landId,
      buyerName,
      buyerMobile,
      referenceName,
      rate,
      amount,
      brokeragePct,
      remarks
    } = req.body;

    // Validate required fields
    if (!landId || !buyerName || !buyerMobile || !rate || !brokeragePct) {
      return res.status(400).json({
        error: 'Land ID, Buyer Name, Buyer Mobile, Rate, and Brokerage % are required'
      });
    }

    // Validate numbers
    const rateNum = parseFloat(rate);
    const brokeragePctNum = parseFloat(brokeragePct);
    
    if (isNaN(rateNum) || rateNum <= 0) {
      return res.status(400).json({ error: 'Rate must be a positive number' });
    }
    
    if (isNaN(brokeragePctNum) || brokeragePctNum < 0 || brokeragePctNum > 100) {
      return res.status(400).json({ error: 'Brokerage % must be between 0 and 100' });
    }

    // Check if land exists
    const land = await prisma.land.findUnique({
      where: { id: parseInt(landId) }
    });

    if (!land) {
      return res.status(404).json({ error: 'Land not found' });
    }

    // Calculate amount if not provided
    let amountNum = amount ? parseFloat(amount) : land.size * rateNum;
    
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Calculate brokerage amount
    const brokerageAmt = amountNum * (brokeragePctNum / 100);

    const booking = await prisma.landBooking.create({
      data: {
        landId: parseInt(landId),
        buyerName: buyerName.trim(),
        buyerMobile: buyerMobile.trim(),
        referenceName: referenceName?.trim() || null,
        rate: rateNum,
        amount: amountNum,
        brokeragePct: brokeragePctNum,
        brokerageAmt: brokerageAmt,
        remarks: remarks?.trim() || null,
        status: 'PENDING'
      },
      include: {
        land: {
          select: {
            id: true,
            name: true,
            village: true,
            taluka: true,
            district: true,
            mouUnit: true,
            size: true
          }
        }
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating land booking:', error);
    res.status(500).json({ error: 'Failed to create land booking' });
  }
};

// Update land booking
export const updateLandBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      buyerName,
      buyerMobile,
      referenceName,
      rate,
      amount,
      brokeragePct,
      remarks
    } = req.body;

    // Check if booking exists and is PENDING
    const existingBooking = await prisma.landBooking.findUnique({
      where: { id: parseInt(id) },
      include: { land: true }
    });

    if (!existingBooking) {
      return res.status(404).json({ error: 'Land booking not found' });
    }

    if (existingBooking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bookings can be updated' });
    }

    // Validate numbers if provided
    let rateNum = existingBooking.rate;
    let amountNum = existingBooking.amount;
    let brokeragePctNum = existingBooking.brokeragePct;
    
    if (rate !== undefined) {
      rateNum = parseFloat(rate);
      if (isNaN(rateNum) || rateNum <= 0) {
        return res.status(400).json({ error: 'Rate must be a positive number' });
      }
    }
    
    if (amount !== undefined) {
      amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
    }
    
    if (brokeragePct !== undefined) {
      brokeragePctNum = parseFloat(brokeragePct);
      if (isNaN(brokeragePctNum) || brokeragePctNum < 0 || brokeragePctNum > 100) {
        return res.status(400).json({ error: 'Brokerage % must be between 0 and 100' });
      }
    }

    // Calculate brokerage amount
    const brokerageAmt = amountNum * (brokeragePctNum / 100);

    const booking = await prisma.landBooking.update({
      where: { id: parseInt(id) },
      data: {
        ...(buyerName && { buyerName: buyerName.trim() }),
        ...(buyerMobile && { buyerMobile: buyerMobile.trim() }),
        ...(referenceName !== undefined && { referenceName: referenceName?.trim() || null }),
        ...(rate !== undefined && { rate: rateNum }),
        ...(amount !== undefined && { amount: amountNum }),
        ...(brokeragePct !== undefined && { brokeragePct: brokeragePctNum }),
        brokerageAmt: brokerageAmt,
        ...(remarks !== undefined && { remarks: remarks?.trim() || null })
      },
      include: {
        land: {
          select: {
            id: true,
            name: true,
            village: true,
            taluka: true,
            district: true,
            mouUnit: true,
            size: true
          }
        }
      }
    });

    res.json(booking);
  } catch (error) {
    console.error('Error updating land booking:', error);
    res.status(500).json({ error: 'Failed to update land booking' });
  }
};

// Approve land booking
export const approveLandBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.landBooking.findUnique({
      where: { id: parseInt(id) }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Land booking not found' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bookings can be approved' });
    }

    const updatedBooking = await prisma.landBooking.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED'
      },
      include: {
        land: {
          select: {
            id: true,
            name: true,
            village: true,
            taluka: true,
            district: true,
            mouUnit: true,
            size: true
          }
        }
      }
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error approving land booking:', error);
    res.status(500).json({ error: 'Failed to approve land booking' });
  }
};

// Reject land booking
export const rejectLandBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.landBooking.findUnique({
      where: { id: parseInt(id) }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Land booking not found' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bookings can be rejected' });
    }

    const updatedBooking = await prisma.landBooking.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED'
      },
      include: {
        land: {
          select: {
            id: true,
            name: true,
            village: true,
            taluka: true,
            district: true,
            mouUnit: true,
            size: true
          }
        }
      }
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error rejecting land booking:', error);
    res.status(500).json({ error: 'Failed to reject land booking' });
  }
};

// Delete land booking
export const deleteLandBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.landBooking.findUnique({
      where: { id: parseInt(id) }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Land booking not found' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bookings can be deleted' });
    }

    await prisma.landBooking.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Land booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting land booking:', error);
    res.status(500).json({ error: 'Failed to delete land booking' });
  }
};
