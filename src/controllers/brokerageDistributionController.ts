import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all brokerage distributions
export const getAllBrokerageDistributions = async (req: Request, res: Response) => {
  try {
    const distributions = await prisma.brokerageDistribution.findMany({
      include: {
        booking: {
          select: {
            id: true,
            unitNo: true,
            buyerName: true,
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
        },
        giver: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        },
        receiver: {
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
    });
    res.json(distributions);
  } catch (error) {
    console.error('Error fetching brokerage distributions:', error);
    res.status(500).json({ error: 'Failed to fetch brokerage distributions' });
  }
};

// Get brokerage distribution by ID
export const getBrokerageDistributionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const distribution = await prisma.brokerageDistribution.findUnique({
      where: { id: parseInt(id) },
      include: {
        booking: {
          select: {
            id: true,
            unitNo: true,
            buyerName: true,
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
        },
        giver: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      }
    });
    
    if (!distribution) {
      return res.status(404).json({ error: 'Brokerage distribution not found' });
    }
    
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching brokerage distribution:', error);
    res.status(500).json({ error: 'Failed to fetch brokerage distribution' });
  }
};

// Create new brokerage distribution
export const createBrokerageDistribution = async (req: Request, res: Response) => {
  try {
    const { bookingId, givenBy, recipient, amount, remarks } = req.body;

    // Validate required fields
    if (!bookingId || !givenBy || !recipient || !amount) {
      return res.status(400).json({
        error: 'Booking ID, given by, recipient, and amount are required'
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
      where: { id: parseInt(bookingId) }
    });

    if (!booking) {
      return res.status(400).json({
        error: 'Booking not found'
      });
    }

    if (booking.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Only approved bookings can have brokerage distributions'
      });
    }

    // Check if giver exists
    const giver = await prisma.user.findUnique({
      where: { id: parseInt(givenBy) }
    });

    if (!giver) {
      return res.status(400).json({
        error: 'Giver user not found'
      });
    }

    // Check if recipient exists
    const recipientUser = await prisma.user.findUnique({
      where: { id: parseInt(recipient) }
    });

    if (!recipientUser) {
      return res.status(400).json({
        error: 'Recipient user not found'
      });
    }

    // Check if giver is management (optional validation)
    const isManagement = ['SYSTEM_ADMIN', 'MANAGEMENT'].includes(giver.user_type);
    if (!isManagement) {
      return res.status(400).json({
        error: 'Only management users can distribute brokerage'
      });
    }

    const distribution = await prisma.brokerageDistribution.create({
      data: {
        bookingId: parseInt(bookingId),
        givenBy: parseInt(givenBy),
        recipient: parseInt(recipient),
        amount: amountNum,
        remarks: remarks?.trim() || null
      },
      include: {
        booking: {
          select: {
            id: true,
            unitNo: true,
            buyerName: true,
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
        },
        giver: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      }
    });

    res.status(201).json(distribution);
  } catch (error) {
    console.error('Error creating brokerage distribution:', error);
    res.status(500).json({ error: 'Failed to create brokerage distribution' });
  }
};

// Update brokerage distribution
export const updateBrokerageDistribution = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { givenBy, recipient, amount, remarks } = req.body;

    // Check if distribution exists
    const existingDistribution = await prisma.brokerageDistribution.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingDistribution) {
      return res.status(404).json({ error: 'Brokerage distribution not found' });
    }

    // Validate amount if provided
    let amountNum = existingDistribution.amount;
    if (amount !== undefined) {
      amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({
          error: 'Amount must be a positive number'
        });
      }
    }

    // Check if giver exists if provided
    if (givenBy) {
      const giver = await prisma.user.findUnique({
        where: { id: parseInt(givenBy) }
      });

      if (!giver) {
        return res.status(400).json({
          error: 'Giver user not found'
        });
      }

      // Check if giver is management
      const isManagement = ['SYSTEM_ADMIN', 'MANAGEMENT'].includes(giver.user_type);
      if (!isManagement) {
        return res.status(400).json({
          error: 'Only management users can distribute brokerage'
        });
      }
    }

    // Check if recipient exists if provided
    if (recipient) {
      const recipientUser = await prisma.user.findUnique({
        where: { id: parseInt(recipient) }
      });

      if (!recipientUser) {
        return res.status(400).json({
          error: 'Recipient user not found'
        });
      }
    }

    const distribution = await prisma.brokerageDistribution.update({
      where: { id: parseInt(id) },
      data: {
        ...(givenBy && { givenBy: parseInt(givenBy) }),
        ...(recipient && { recipient: parseInt(recipient) }),
        ...(amount !== undefined && { amount: amountNum }),
        ...(remarks !== undefined && { remarks: remarks?.trim() || null })
      },
      include: {
        booking: {
          select: {
            id: true,
            unitNo: true,
            buyerName: true,
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
        },
        giver: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      }
    });

    res.json(distribution);
  } catch (error) {
    console.error('Error updating brokerage distribution:', error);
    res.status(500).json({ error: 'Failed to update brokerage distribution' });
  }
};

// Delete brokerage distribution
export const deleteBrokerageDistribution = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if distribution exists
    const distribution = await prisma.brokerageDistribution.findUnique({
      where: { id: parseInt(id) }
    });

    if (!distribution) {
      return res.status(404).json({ error: 'Brokerage distribution not found' });
    }

    await prisma.brokerageDistribution.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Brokerage distribution deleted successfully' });
  } catch (error) {
    console.error('Error deleting brokerage distribution:', error);
    res.status(500).json({ error: 'Failed to delete brokerage distribution' });
  }
};
