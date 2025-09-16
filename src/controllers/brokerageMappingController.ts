import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all brokerage mappings
export const getAllBrokerageMappings = async (req: Request, res: Response) => {
  try {
    const mappings = await prisma.brokerageMapping.findMany({
      include: {
        booking: {
          select: {
            id: true,
            unitNo: true,
            buyerName: true,
            brokerageAmt: true,
            project: {
              select: {
                id: true,
                name: true,
                builder: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.json(mappings);
  } catch (error) {
    console.error('Error fetching brokerage mappings:', error);
    res.status(500).json({ error: 'Failed to fetch brokerage mappings' });
  }
};

// Get brokerage mapping by ID
export const getBrokerageMappingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mapping = await prisma.brokerageMapping.findUnique({
      where: { id: parseInt(id) },
      include: {
        booking: {
          select: {
            id: true,
            unitNo: true,
            buyerName: true,
            brokerageAmt: true,
            project: {
              select: {
                id: true,
                name: true,
                builder: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!mapping) {
      return res.status(404).json({ error: 'Brokerage mapping not found' });
    }
    
    res.json(mapping);
  } catch (error) {
    console.error('Error fetching brokerage mapping:', error);
    res.status(500).json({ error: 'Failed to fetch brokerage mapping' });
  }
};

// Create new brokerage mapping
export const createBrokerageMapping = async (req: Request, res: Response) => {
  try {
    const { bookingId, amount, remarks } = req.body;

    // Validate required fields
    if (!bookingId || !amount) {
      return res.status(400).json({
        error: 'Booking ID and amount are required'
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'Amount must be a positive number'
      });
    }

    // Check if booking exists and is approved
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        mappings: true
      }
    });

    if (!booking) {
      return res.status(400).json({
        error: 'Booking not found'
      });
    }

    if (booking.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Only approved bookings can have brokerage mappings'
      });
    }

    // Calculate current due (brokerage amount - already mapped total)
    const alreadyMappedTotal = booking.mappings.reduce((sum, mapping) => sum + mapping.amount, 0);
    const currentDue = booking.brokerageAmt - alreadyMappedTotal;

    // Validate that the amount doesn't exceed current due
    if (amountNum > currentDue) {
      return res.status(400).json({
        error: `Amount cannot exceed current due of ₹${currentDue.toLocaleString()}`
      });
    }

    const mapping = await prisma.brokerageMapping.create({
      data: {
        bookingId: parseInt(bookingId),
        currentDue: currentDue,
        amount: amountNum,
        remarks: remarks?.trim() || null
      },
      include: {
        booking: {
          select: {
            id: true,
            unitNo: true,
            buyerName: true,
            brokerageAmt: true,
            project: {
              select: {
                id: true,
                name: true,
                builder: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.status(201).json(mapping);
  } catch (error) {
    console.error('Error creating brokerage mapping:', error);
    res.status(500).json({ error: 'Failed to create brokerage mapping' });
  }
};

// Update brokerage mapping
export const updateBrokerageMapping = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, remarks } = req.body;

    // Check if mapping exists
    const existingMapping = await prisma.brokerageMapping.findUnique({
      where: { id: parseInt(id) },
      include: {
        booking: {
          include: {
            mappings: true
          }
        }
      }
    });

    if (!existingMapping) {
      return res.status(404).json({ error: 'Brokerage mapping not found' });
    }

    // Validate amount if provided
    let amountNum = existingMapping.amount;
    if (amount !== undefined) {
      amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          error: 'Amount must be a positive number'
        });
      }

      // Calculate current due excluding this mapping
      const otherMappingsTotal = existingMapping.booking.mappings
        .filter(m => m.id !== parseInt(id))
        .reduce((sum, mapping) => sum + mapping.amount, 0);
      const currentDue = existingMapping.booking.brokerageAmt - otherMappingsTotal;

      // Validate that the amount doesn't exceed current due
      if (amountNum > currentDue) {
        return res.status(400).json({
          error: `Amount cannot exceed current due of ₹${currentDue.toLocaleString()}`
        });
      }
    }

    const mapping = await prisma.brokerageMapping.update({
      where: { id: parseInt(id) },
      data: {
        ...(amount !== undefined && { amount: amountNum }),
        ...(remarks !== undefined && { remarks: remarks?.trim() || null })
      },
      include: {
        booking: {
          select: {
            id: true,
            unitNo: true,
            buyerName: true,
            brokerageAmt: true,
            project: {
              select: {
                id: true,
                name: true,
                builder: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json(mapping);
  } catch (error) {
    console.error('Error updating brokerage mapping:', error);
    res.status(500).json({ error: 'Failed to update brokerage mapping' });
  }
};

// Delete brokerage mapping
export const deleteBrokerageMapping = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if mapping exists
    const mapping = await prisma.brokerageMapping.findUnique({
      where: { id: parseInt(id) }
    });

    if (!mapping) {
      return res.status(404).json({ error: 'Brokerage mapping not found' });
    }

    await prisma.brokerageMapping.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Brokerage mapping deleted successfully' });
  } catch (error) {
    console.error('Error deleting brokerage mapping:', error);
    res.status(500).json({ error: 'Failed to delete brokerage mapping' });
  }
};
