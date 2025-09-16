import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all payment collections
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const { type, landBookingId, resaleBookingId } = req.query;
    
    let whereClause: any = {};
    
    if (type) {
      whereClause.type = type;
    }
    
    if (landBookingId) {
      whereClause.landBookingId = parseInt(landBookingId as string);
    }
    
    if (resaleBookingId) {
      whereClause.resaleBookingId = parseInt(resaleBookingId as string);
    }

    const payments = await prisma.paymentCollection.findMany({
      where: whereClause,
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
        },
        landBooking: {
          select: {
            id: true,
            buyerName: true,
            land: {
              select: {
                id: true,
                name: true,
                village: true,
                taluka: true,
                district: true
              }
            }
          }
        },
        resaleBooking: {
          select: {
            id: true,
            buyerName: true,
            property: {
              select: {
                id: true,
                propertyName: true,
                building: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// Get payment by ID
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await prisma.paymentCollection.findUnique({
      where: { id: parseInt(id) },
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
      }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

// Create new payment collection
export const createPayment = async (req: Request, res: Response) => {
  try {
    const { type, date, from, collectedBy, receivedBy, amount, remarks, landBookingId, resaleBookingId } = req.body;

    // Validate required fields
    if (!type || !from || !collectedBy || !receivedBy || !amount) {
      return res.status(400).json({
        error: 'Type, from, collected by, received by, and amount are required'
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'Amount must be a positive number'
      });
    }

    // Validate type
    const validTypes = ['PROJECT', 'LAND', 'RENT', 'RESALE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Type must be one of: PROJECT, LAND, RENT, RESALE'
      });
    }

    // Validate land booking if type is LAND
    if (type === 'LAND' && landBookingId) {
      const landBooking = await prisma.landBooking.findUnique({
        where: { id: parseInt(landBookingId) }
      });

      if (!landBooking) {
        return res.status(400).json({
          error: 'Land booking not found'
        });
      }

      if (landBooking.status !== 'APPROVED') {
        return res.status(400).json({
          error: 'Only approved land bookings can have payments'
        });
      }
    }

    // Validate resale booking if type is RESALE
    if (type === 'RESALE' && resaleBookingId) {
      const resaleBooking = await prisma.resaleBooking.findUnique({
        where: { id: parseInt(resaleBookingId) }
      });

      if (!resaleBooking) {
        return res.status(400).json({
          error: 'Resale booking not found'
        });
      }

      if (resaleBooking.status !== 'APPROVED') {
        return res.status(400).json({
          error: 'Only approved resale bookings can have payments'
        });
      }
    }

    // Check if collected user exists
    const collectedUser = await prisma.user.findUnique({
      where: { id: parseInt(collectedBy) }
    });

    if (!collectedUser) {
      return res.status(400).json({
        error: 'Collected user not found'
      });
    }

    // Check if received user exists
    const receivedUser = await prisma.user.findUnique({
      where: { id: parseInt(receivedBy) }
    });

    if (!receivedUser) {
      return res.status(400).json({
        error: 'Received user not found'
      });
    }

    const payment = await prisma.paymentCollection.create({
      data: {
        type: type.trim(),
        date: date ? new Date(date) : new Date(),
        from: from.trim(),
        collectedBy: parseInt(collectedBy),
        receivedBy: parseInt(receivedBy),
        amount: amountNum,
        remarks: remarks?.trim() || null,
        landBookingId: landBookingId ? parseInt(landBookingId) : null,
        resaleBookingId: resaleBookingId ? parseInt(resaleBookingId) : null
      },
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
      }
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

// Update payment collection
export const updatePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, date, from, collectedBy, receivedBy, amount, remarks } = req.body;

    // Check if payment exists
    const existingPayment = await prisma.paymentCollection.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Validate amount if provided
    let amountNum = existingPayment.amount;
    if (amount !== undefined) {
      amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          error: 'Amount must be a positive number'
        });
      }
    }

    // Validate type if provided
    if (type) {
      const validTypes = ['PROJECT', 'LAND', 'RENT', 'RESALE'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: 'Type must be one of: PROJECT, LAND, RENT, RESALE'
        });
      }
    }

    // Check if collected user exists if provided
    if (collectedBy) {
      const collectedUser = await prisma.user.findUnique({
        where: { id: parseInt(collectedBy) }
      });

      if (!collectedUser) {
        return res.status(400).json({
          error: 'Collected user not found'
        });
      }
    }

    // Check if received user exists if provided
    if (receivedBy) {
      const receivedUser = await prisma.user.findUnique({
        where: { id: parseInt(receivedBy) }
      });

      if (!receivedUser) {
        return res.status(400).json({
          error: 'Received user not found'
        });
      }
    }

    const payment = await prisma.paymentCollection.update({
      where: { id: parseInt(id) },
      data: {
        ...(type && { type: type.trim() }),
        ...(date && { date: new Date(date) }),
        ...(from && { from: from.trim() }),
        ...(collectedBy && { collectedBy: parseInt(collectedBy) }),
        ...(receivedBy && { receivedBy: parseInt(receivedBy) }),
        ...(amount !== undefined && { amount: amountNum }),
        ...(remarks !== undefined && { remarks: remarks?.trim() || null })
      },
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
      }
    });

    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
};

// Delete payment collection
export const deletePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if payment exists
    const payment = await prisma.paymentCollection.findUnique({
      where: { id: parseInt(id) }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await prisma.paymentCollection.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};
