import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all bookings
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
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
        },
        inventory: {
          select: {
            id: true,
            unitType: true,
            mou: true,
            size: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Get booking by ID
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
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
        },
        inventory: {
          select: {
            id: true,
            unitType: true,
            mou: true,
            size: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      }
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

// Create new booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { 
      projectId, 
      inventoryId, 
      unitNo, 
      buyerName, 
      buyerMobile, 
      referenceName, 
      rate, 
      brokeragePct, 
      bookedBy, 
      remarks 
    } = req.body;

    // Validate required fields
    if (!projectId || !inventoryId || !unitNo || !buyerName || !buyerMobile || !rate || !brokeragePct || !bookedBy) {
      return res.status(400).json({
        error: 'Project ID, inventory ID, unit number, buyer name, buyer mobile, rate, brokerage percentage, and booked by are required'
      });
    }

    // Validate numeric values
    const rateNum = parseFloat(rate);
    const brokeragePctNum = parseFloat(brokeragePct);

    if (rateNum <= 0) {
      return res.status(400).json({
        error: 'Rate must be greater than 0'
      });
    }

    if (brokeragePctNum < 0 || brokeragePctNum > 100) {
      return res.status(400).json({
        error: 'Brokerage percentage must be between 0 and 100'
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

    // Check if inventory exists and get size
    const inventory = await prisma.inventory.findUnique({
      where: { id: parseInt(inventoryId) }
    });

    if (!inventory) {
      return res.status(400).json({
        error: 'Inventory item not found'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(bookedBy) }
    });

    if (!user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }

    // Calculate amount and brokerage
    const amount = inventory.size * rateNum;
    const brokerageAmt = amount * brokeragePctNum / 100;

    const booking = await prisma.booking.create({
      data: {
        projectId: parseInt(projectId),
        inventoryId: parseInt(inventoryId),
        unitNo: unitNo.trim(),
        buyerName: buyerName.trim(),
        buyerMobile: buyerMobile.trim(),
        referenceName: referenceName?.trim() || null,
        rate: rateNum,
        amount: amount,
        brokeragePct: brokeragePctNum,
        brokerageAmt: brokerageAmt,
        bookedBy: parseInt(bookedBy),
        remarks: remarks?.trim() || null,
        status: 'PENDING'
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
        },
        inventory: {
          select: {
            id: true,
            unitType: true,
            mou: true,
            size: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      }
    });

    // Log notification (for now)
    console.log(`New booking created: ${booking.id} - ${buyerName} - Unit ${unitNo} - Amount: ₹${amount.toLocaleString()}`);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// Update booking
export const updateBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      projectId, 
      inventoryId, 
      unitNo, 
      buyerName, 
      buyerMobile, 
      referenceName, 
      rate, 
      brokeragePct, 
      bookedBy, 
      remarks, 
      status 
    } = req.body;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Validate numeric values if provided
    let rateNum = existingBooking.rate;
    let brokeragePctNum = existingBooking.brokeragePct;

    if (rate !== undefined) {
      rateNum = parseFloat(rate);
      if (rateNum <= 0) {
        return res.status(400).json({
          error: 'Rate must be greater than 0'
        });
      }
    }

    if (brokeragePct !== undefined) {
      brokeragePctNum = parseFloat(brokeragePct);
      if (brokeragePctNum < 0 || brokeragePctNum > 100) {
        return res.status(400).json({
          error: 'Brokerage percentage must be between 0 and 100'
        });
      }
    }

    // Get inventory for size calculation
    let inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId ? parseInt(inventoryId) : existingBooking.inventoryId }
    });

    if (!inventory) {
      return res.status(400).json({
        error: 'Inventory item not found'
      });
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

    // Check if user exists if bookedBy is provided
    if (bookedBy) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(bookedBy) }
      });

      if (!user) {
        return res.status(400).json({
          error: 'User not found'
        });
      }
    }

    // Calculate amount and brokerage
    const amount = inventory.size * rateNum;
    const brokerageAmt = amount * brokeragePctNum / 100;

    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: {
        ...(projectId && { projectId: parseInt(projectId) }),
        ...(inventoryId && { inventoryId: parseInt(inventoryId) }),
        ...(unitNo && { unitNo: unitNo.trim() }),
        ...(buyerName && { buyerName: buyerName.trim() }),
        ...(buyerMobile && { buyerMobile: buyerMobile.trim() }),
        ...(referenceName !== undefined && { referenceName: referenceName?.trim() || null }),
        ...(rate !== undefined && { rate: rateNum }),
        amount: amount, // Always update amount
        ...(brokeragePct !== undefined && { brokeragePct: brokeragePctNum }),
        brokerageAmt: brokerageAmt, // Always update brokerage amount
        ...(bookedBy && { bookedBy: parseInt(bookedBy) }),
        ...(remarks !== undefined && { remarks: remarks?.trim() || null }),
        ...(status && { status })
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
        },
        inventory: {
          select: {
            id: true,
            unitType: true,
            mou: true,
            size: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            user_type: true
          }
        }
      }
    });

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

// Delete booking
export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await prisma.booking.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

// Approve booking with brokerage distribution
export const approveBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { distributions, remarks } = req.body;

    // Check if booking exists and is PENDING
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        distributions: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Booking is not pending approval' });
    }

    // Validate distributions
    if (!distributions || !Array.isArray(distributions) || distributions.length === 0) {
      return res.status(400).json({ error: 'Distributions are required' });
    }

    // Validate total percentage equals 100
    const totalPercentage = distributions.reduce((sum: number, dist: any) => sum + parseFloat(dist.sharePct), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) { // Allow small floating point differences
      return res.status(400).json({ 
        error: `Total percentage must equal 100%. Current total: ${totalPercentage}%` 
      });
    }

    // Validate each distribution
    for (const dist of distributions) {
      if (!dist.sharePct || dist.sharePct <= 0 || dist.sharePct > 100) {
        return res.status(400).json({ 
          error: 'Each share percentage must be between 0 and 100' 
        });
      }

      // If userId is provided, validate user exists
      if (dist.userId) {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(dist.userId) }
        });
        if (!user) {
          return res.status(400).json({ 
            error: `User with ID ${dist.userId} not found` 
          });
        }
      }
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing distributions
      await tx.bookingDistribution.deleteMany({
        where: { bookingId: parseInt(id) }
      });

      // Create new distributions
      const distributionData = distributions.map((dist: any) => ({
        bookingId: parseInt(id),
        userId: dist.userId ? parseInt(dist.userId) : null,
        sharePct: parseFloat(dist.sharePct),
        shareAmt: booking.brokerageAmt * (parseFloat(dist.sharePct) / 100),
        remarks: dist.remarks || null
      }));

      await tx.bookingDistribution.createMany({
        data: distributionData
      });

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: parseInt(id) },
        data: { 
          status: 'APPROVED',
          remarks: remarks || booking.remarks
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
          },
          inventory: {
            select: {
              id: true,
              unitType: true,
              mou: true,
              size: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              user_type: true
            }
          },
          distributions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  user_type: true
                }
              }
            }
          }
        }
      });

      return updatedBooking;
    });

    // Log approval notification
    console.log(`Booking ${id} approved with brokerage distribution:`, distributions);

    res.json(result);
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
};

// Get booking distributions
export const getBookingDistributions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        distributions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                user_type: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking.distributions);
  } catch (error) {
    console.error('Error fetching booking distributions:', error);
    res.status(500).json({ error: 'Failed to fetch booking distributions' });
  }
};
