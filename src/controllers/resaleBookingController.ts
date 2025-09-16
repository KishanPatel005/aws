import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Get all resale bookings with optional propertyId filter
export const getAllResaleBookings = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.query;
    
    let whereClause: any = {};
    
    if (propertyId) {
      whereClause.propertyId = parseInt(propertyId as string);
    }

    const bookings = await prisma.resaleBooking.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            propertyName: true,
            building: true,
            type: true,
            propertyType: true,
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
    console.error('Error fetching resale bookings:', error);
    res.status(500).json({ error: 'Failed to fetch resale bookings' });
  }
};

// Get resale booking by ID
export const getResaleBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await prisma.resaleBooking.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: {
          select: {
            id: true,
            propertyName: true,
            building: true,
            type: true,
            propertyType: true,
            size: true,
            rate: true,
            ownerName: true,
            ownerMobile: true
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
      return res.status(404).json({ error: 'Resale booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching resale booking:', error);
    res.status(500).json({ error: 'Failed to fetch resale booking' });
  }
};

// Create new resale booking
export const createResaleBooking = async (req: Request, res: Response) => {
  try {
    const {
      propertyId,
      buyerName,
      buyerMobile,
      referenceName,
      rate,
      amount,
      buyerBrokeragePct,
      sellerBrokeragePct,
      remarks
    } = req.body;

    // Validate required fields
    if (!propertyId || !buyerName || !buyerMobile || !rate || !buyerBrokeragePct || !sellerBrokeragePct) {
      return res.status(400).json({
        error: 'Property ID, Buyer Name, Buyer Mobile, Rate, Buyer Brokerage %, and Seller Brokerage % are required'
      });
    }

    // Validate numbers
    const rateNum = parseFloat(rate);
    const buyerBrokeragePctNum = parseFloat(buyerBrokeragePct);
    const sellerBrokeragePctNum = parseFloat(sellerBrokeragePct);
    
    if (isNaN(rateNum) || rateNum <= 0) {
      return res.status(400).json({ error: 'Rate must be a positive number' });
    }
    
    if (isNaN(buyerBrokeragePctNum) || buyerBrokeragePctNum < 0 || buyerBrokeragePctNum > 100) {
      return res.status(400).json({ error: 'Buyer Brokerage % must be between 0 and 100' });
    }
    
    if (isNaN(sellerBrokeragePctNum) || sellerBrokeragePctNum < 0 || sellerBrokeragePctNum > 100) {
      return res.status(400).json({ error: 'Seller Brokerage % must be between 0 and 100' });
    }

    // Check if property exists
    const property = await prisma.resaleProperty.findUnique({
      where: { id: parseInt(propertyId) }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Calculate amount if not provided
    let amountNum = amount ? parseFloat(amount) : property.size * rateNum;
    
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Calculate brokerage amounts
    const buyerBrokerageAmt = amountNum * (buyerBrokeragePctNum / 100);
    const sellerBrokerageAmt = amountNum * (sellerBrokeragePctNum / 100);

    const booking = await prisma.resaleBooking.create({
      data: {
        propertyId: parseInt(propertyId),
        buyerName: buyerName.trim(),
        buyerMobile: buyerMobile.trim(),
        referenceName: referenceName?.trim() || null,
        rate: rateNum,
        amount: amountNum,
        buyerBrokeragePct: buyerBrokeragePctNum,
        buyerBrokerageAmt: buyerBrokerageAmt,
        sellerBrokeragePct: sellerBrokeragePctNum,
        sellerBrokerageAmt: sellerBrokerageAmt,
        remarks: remarks?.trim() || null,
        status: 'PENDING'
      },
      include: {
        property: {
          select: {
            id: true,
            propertyName: true,
            building: true,
            type: true,
            propertyType: true,
            size: true
          }
        }
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating resale booking:', error);
    res.status(500).json({ error: 'Failed to create resale booking' });
  }
};

// Update resale booking
export const updateResaleBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      buyerName,
      buyerMobile,
      referenceName,
      rate,
      amount,
      buyerBrokeragePct,
      sellerBrokeragePct,
      remarks
    } = req.body;

    // Check if booking exists and is PENDING
    const existingBooking = await prisma.resaleBooking.findUnique({
      where: { id: parseInt(id) },
      include: { property: true }
    });

    if (!existingBooking) {
      return res.status(404).json({ error: 'Resale booking not found' });
    }

    if (existingBooking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bookings can be updated' });
    }

    // Validate numbers if provided
    let rateNum = existingBooking.rate;
    let amountNum = existingBooking.amount;
    let buyerBrokeragePctNum = existingBooking.buyerBrokeragePct;
    let sellerBrokeragePctNum = existingBooking.sellerBrokeragePct;
    
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
    
    if (buyerBrokeragePct !== undefined) {
      buyerBrokeragePctNum = parseFloat(buyerBrokeragePct);
      if (isNaN(buyerBrokeragePctNum) || buyerBrokeragePctNum < 0 || buyerBrokeragePctNum > 100) {
        return res.status(400).json({ error: 'Buyer Brokerage % must be between 0 and 100' });
      }
    }
    
    if (sellerBrokeragePct !== undefined) {
      sellerBrokeragePctNum = parseFloat(sellerBrokeragePct);
      if (isNaN(sellerBrokeragePctNum) || sellerBrokeragePctNum < 0 || sellerBrokeragePctNum > 100) {
        return res.status(400).json({ error: 'Seller Brokerage % must be between 0 and 100' });
      }
    }

    // Calculate brokerage amounts
    const buyerBrokerageAmt = amountNum * (buyerBrokeragePctNum / 100);
    const sellerBrokerageAmt = amountNum * (sellerBrokeragePctNum / 100);

    const booking = await prisma.resaleBooking.update({
      where: { id: parseInt(id) },
      data: {
        ...(buyerName && { buyerName: buyerName.trim() }),
        ...(buyerMobile && { buyerMobile: buyerMobile.trim() }),
        ...(referenceName !== undefined && { referenceName: referenceName?.trim() || null }),
        ...(rate !== undefined && { rate: rateNum }),
        ...(amount !== undefined && { amount: amountNum }),
        ...(buyerBrokeragePct !== undefined && { buyerBrokeragePct: buyerBrokeragePctNum }),
        buyerBrokerageAmt: buyerBrokerageAmt,
        ...(sellerBrokeragePct !== undefined && { sellerBrokeragePct: sellerBrokeragePctNum }),
        sellerBrokerageAmt: sellerBrokerageAmt,
        ...(remarks !== undefined && { remarks: remarks?.trim() || null })
      },
      include: {
        property: {
          select: {
            id: true,
            propertyName: true,
            building: true,
            type: true,
            propertyType: true,
            size: true
          }
        }
      }
    });

    res.json(booking);
  } catch (error) {
    console.error('Error updating resale booking:', error);
    res.status(500).json({ error: 'Failed to update resale booking' });
  }
};

// Approve resale booking and generate PDF
export const approveResaleBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.resaleBooking.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: {
          select: {
            id: true,
            propertyName: true,
            building: true,
            type: true,
            propertyType: true,
            size: true,
            ownerName: true,
            ownerMobile: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Resale booking not found' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bookings can be approved' });
    }

    // Generate PDF
    const pdfPath = await generateBookingPDF(booking);

    const updatedBooking = await prisma.resaleBooking.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        pdfPath: pdfPath
      },
      include: {
        property: {
          select: {
            id: true,
            propertyName: true,
            building: true,
            type: true,
            propertyType: true,
            size: true
          }
        }
      }
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error approving resale booking:', error);
    res.status(500).json({ error: 'Failed to approve resale booking' });
  }
};

// Delete resale booking
export const deleteResaleBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.resaleBooking.findUnique({
      where: { id: parseInt(id) }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Resale booking not found' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bookings can be deleted' });
    }

    await prisma.resaleBooking.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Resale booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting resale booking:', error);
    res.status(500).json({ error: 'Failed to delete resale booking' });
  }
};

// Generate PDF for booking
async function generateBookingPDF(booking: any): Promise<string> {
  const doc = new PDFDocument();
  const fileName = `booking-${booking.id}.pdf`;
  const filePath = path.join('uploads', 'resale', fileName);
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // PDF content
  doc.fontSize(20).text('Property Booking Summary', { align: 'center' });
  doc.moveDown(2);

  // Property details
  doc.fontSize(16).text('Property Details', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Property Name: ${booking.property.propertyName}`);
  doc.text(`Building: ${booking.property.building || 'N/A'}`);
  doc.text(`Type: ${booking.property.type}`);
  doc.text(`Property Type: ${booking.property.propertyType}`);
  doc.text(`Size: ${booking.property.size} sq ft`);
  doc.moveDown(1);

  // Buyer details
  doc.fontSize(16).text('Buyer Details', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Buyer Name: ${booking.buyerName}`);
  doc.text(`Buyer Mobile: ${booking.buyerMobile}`);
  if (booking.referenceName) {
    doc.text(`Reference: ${booking.referenceName}`);
  }
  doc.moveDown(1);

  // Owner details
  doc.fontSize(16).text('Owner Details', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Owner Name: ${booking.property.ownerName}`);
  doc.text(`Owner Mobile: ${booking.property.ownerMobile}`);
  doc.moveDown(1);

  // Financial details
  doc.fontSize(16).text('Financial Details', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Rate: ₹${booking.rate.toLocaleString()}`);
  doc.text(`Amount: ₹${booking.amount.toLocaleString()}`);
  doc.moveDown(0.5);
  
  doc.fontSize(14).text('Brokerage Details', { underline: true });
  doc.fontSize(12);
  doc.text(`Buyer Brokerage: ${booking.buyerBrokeragePct}% = ₹${booking.buyerBrokerageAmt.toLocaleString()}`);
  doc.text(`Seller Brokerage: ${booking.sellerBrokeragePct}% = ₹${booking.sellerBrokerageAmt.toLocaleString()}`);
  doc.moveDown(1);

  // Booking details
  doc.fontSize(16).text('Booking Details', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Booking Date: ${new Date(booking.date).toLocaleDateString()}`);
  doc.text(`Status: ${booking.status}`);
  if (booking.remarks) {
    doc.text(`Remarks: ${booking.remarks}`);
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve(`/uploads/resale/${fileName}`);
    });
    stream.on('error', reject);
  });
}
