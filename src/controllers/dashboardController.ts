import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get dashboard reports data
export const getDashboardReports = async (req: Request, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Builder-wise reports
    const builderBookings = await prisma.booking.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    const builderPaid = await prisma.paymentCollection.aggregate({
      where: {
        type: 'BOOKING',
        date: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        amount: true
      }
    });

    // Project-wise reports
    const projectBookings = await prisma.booking.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    const projectPaid = await prisma.paymentCollection.aggregate({
      where: {
        type: 'BOOKING',
        date: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        amount: true
      }
    });

    // Property-wise reports (Resale properties)
    const propertyBookings = await prisma.resaleBooking.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    const propertyPaid = await prisma.paymentCollection.aggregate({
      where: {
        type: 'RESALE',
        date: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        amount: true
      }
    });

    // Employee-wise reports
    const employeePaid = await prisma.paymentCollection.aggregate({
      where: {
        type: 'SALARY',
        date: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        amount: true
      }
    });

    // Calculate receivables (bookings - paid)
    const builderReceivable = (builderBookings._sum.amount || 0) - (builderPaid._sum.amount || 0);
    const projectReceivable = (projectBookings._sum.amount || 0) - (projectPaid._sum.amount || 0);
    const propertyReceivable = (propertyBookings._sum.amount || 0) - (propertyPaid._sum.amount || 0);

    // Mock data for advance/upad (this would need actual implementation)
    const employeeAdvance = 85000;

    const reports = [
      // Builder-wise reports
      {
        id: '1',
        title: 'Builder-wise Booking',
        type: 'builder',
        category: 'booking',
        value: builderBookings._sum.amount || 0,
        count: builderBookings._count.id || 0,
        change: 12.5, // This would be calculated based on previous period
        changeType: 'increase',
        period: period
      },
      {
        id: '2',
        title: 'Builder-wise Paid',
        type: 'builder',
        category: 'paid',
        value: builderPaid._sum.amount || 0,
        count: 0,
        change: 8.2,
        changeType: 'increase',
        period: period
      },
      {
        id: '3',
        title: 'Builder-wise Receivable',
        type: 'builder',
        category: 'receivable',
        value: builderReceivable,
        count: 0,
        change: -5.1,
        changeType: builderReceivable > 0 ? 'increase' : 'decrease',
        period: period
      },
      
      // Project-wise reports
      {
        id: '4',
        title: 'Project-wise Booking',
        type: 'project',
        category: 'booking',
        value: projectBookings._sum.amount || 0,
        count: projectBookings._count.id || 0,
        change: 15.3,
        changeType: 'increase',
        period: period
      },
      {
        id: '5',
        title: 'Project-wise Paid',
        type: 'project',
        category: 'paid',
        value: projectPaid._sum.amount || 0,
        count: 0,
        change: 11.7,
        changeType: 'increase',
        period: period
      },
      {
        id: '6',
        title: 'Project-wise Receivable',
        type: 'project',
        category: 'receivable',
        value: projectReceivable,
        count: 0,
        change: -8.9,
        changeType: projectReceivable > 0 ? 'increase' : 'decrease',
        period: period
      },
      
      // Property-wise reports
      {
        id: '7',
        title: 'Property-wise Booking',
        type: 'property',
        category: 'booking',
        value: propertyBookings._sum.amount || 0,
        count: propertyBookings._count.id || 0,
        change: 6.8,
        changeType: 'increase',
        period: period
      },
      {
        id: '8',
        title: 'Property-wise Paid',
        type: 'property',
        category: 'paid',
        value: propertyPaid._sum.amount || 0,
        count: 0,
        change: 9.4,
        changeType: 'increase',
        period: period
      },
      {
        id: '9',
        title: 'Property-wise Receivable',
        type: 'property',
        category: 'receivable',
        value: propertyReceivable,
        count: 0,
        change: -12.3,
        changeType: propertyReceivable > 0 ? 'increase' : 'decrease',
        period: period
      },
      
      // Employee-wise reports
      {
        id: '10',
        title: 'Employee-wise Paid',
        type: 'employee',
        category: 'paid',
        value: employeePaid._sum.amount || 0,
        count: 0,
        change: 7.2,
        changeType: 'increase',
        period: period
      },
      {
        id: '11',
        title: 'Employee-wise Payable',
        type: 'employee',
        category: 'payable',
        value: 120000, // This would need actual calculation
        count: 0,
        change: -3.1,
        changeType: 'decrease',
        period: period
      },
      {
        id: '12',
        title: 'Employee-wise Advance/Upad',
        type: 'employee',
        category: 'advance',
        value: employeeAdvance,
        count: 0,
        change: 4.6,
        changeType: 'increase',
        period: period
      }
    ];

    res.json({
      success: true,
      data: reports,
      period: period,
      dateRange: {
        start: startDate,
        end: now
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Search documents
export const searchDocuments = async (req: Request, res: Response) => {
  try {
    const { q: searchTerm, type, category } = req.query;
    
    // If no search term, return all documents
    if (!searchTerm || searchTerm === '') {
      // Get all projects
      const allProjects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          city: true,
          documents: true,
          createdAt: true
        }
      });

      // Get all lands
      const allLands = await prisma.land.findMany({
        select: {
          id: true,
          name: true,
          village: true,
          taluka: true,
          mapDocs: true,
          villageMapDocs: true,
          sevenTwelveDocs: true,
          fpDocs: true,
          date: true
        }
      });

      // Get all resale properties
      const allResaleProperties = await prisma.resaleProperty.findMany({
        select: {
          id: true,
          propertyName: true,
          building: true,
          documents: true,
          createdAt: true
        }
      });

      // Format documents for response
      const documents = [
        ...allProjects.map(project => ({
          id: `project-${project.id}`,
          name: project.name,
          type: 'project' as const,
          projectName: project.name,
          category: 'Project Document',
          uploadedAt: project.createdAt.toISOString(),
          size: 'Unknown',
          url: `/uploads/projects/${project.id}`,
          documents: project.documents
        })),
        ...allLands.map(land => {
          // Combine all document fields into a single array
          const allDocs = [
            ...(Array.isArray(land.mapDocs) ? land.mapDocs : []),
            ...(Array.isArray(land.villageMapDocs) ? land.villageMapDocs : []),
            ...(Array.isArray(land.sevenTwelveDocs) ? land.sevenTwelveDocs : []),
            ...(Array.isArray(land.fpDocs) ? land.fpDocs : [])
          ];
          
          return {
            id: `land-${land.id}`,
            name: land.name,
            type: 'property' as const,
            propertyName: land.name,
            category: 'Land Document',
            uploadedAt: land.date.toISOString(),
            size: 'Unknown',
            url: `/uploads/land/${land.id}`,
            documents: allDocs
          };
        }),
        ...allResaleProperties.map(property => ({
          id: `resale-${property.id}`,
          name: property.propertyName,
          type: 'property' as const,
          propertyName: property.propertyName,
          category: 'Resale Document',
          uploadedAt: property.createdAt.toISOString(),
          size: 'Unknown',
          url: `/uploads/resale/${property.id}`,
          documents: property.documents
        }))
      ];

      // Filter by type if specified
      const filteredDocuments = type && type !== 'all' 
        ? documents.filter(doc => doc.type === type)
        : documents;

      return res.json({
        success: true,
        data: filteredDocuments,
        total: filteredDocuments.length
      });
    }

    // Search in project documents
    const projectDocuments = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm as string } },
          { city: { contains: searchTerm as string } }
        ]
      },
      select: {
        id: true,
        name: true,
        city: true,
        documents: true,
        createdAt: true
      }
    });

    // Search in land documents
    const landDocuments = await prisma.land.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm as string } },
          { village: { contains: searchTerm as string } },
          { taluka: { contains: searchTerm as string } }
        ]
      },
      select: {
        id: true,
        name: true,
        village: true,
        taluka: true,
        mapDocs: true,
        villageMapDocs: true,
        sevenTwelveDocs: true,
        fpDocs: true,
        date: true
      }
    });

    // Search in resale property documents
    const resaleDocuments = await prisma.resaleProperty.findMany({
      where: {
        OR: [
          { propertyName: { contains: searchTerm as string } },
          { building: { contains: searchTerm as string } }
        ]
      },
      select: {
        id: true,
        propertyName: true,
        building: true,
        documents: true,
        createdAt: true
      }
    });

    // Format documents for response
    const documents = [
      ...projectDocuments.map(project => ({
        id: `project-${project.id}`,
        name: project.name,
        type: 'project' as const,
        projectName: project.name,
        category: 'Project Document',
        uploadedAt: project.createdAt.toISOString(),
        size: 'Unknown',
        url: `/uploads/projects/${project.id}`,
        documents: project.documents
      })),
      ...landDocuments.map(land => {
        // Combine all document fields into a single array
        const allDocs = [
          ...(Array.isArray(land.mapDocs) ? land.mapDocs : []),
          ...(Array.isArray(land.villageMapDocs) ? land.villageMapDocs : []),
          ...(Array.isArray(land.sevenTwelveDocs) ? land.sevenTwelveDocs : []),
          ...(Array.isArray(land.fpDocs) ? land.fpDocs : [])
        ];
        
        return {
          id: `land-${land.id}`,
          name: land.name,
          type: 'property' as const,
          propertyName: land.name,
          category: 'Land Document',
          uploadedAt: land.date.toISOString(),
          size: 'Unknown',
          url: `/uploads/land/${land.id}`,
          documents: allDocs
        };
      }),
      ...resaleDocuments.map(property => ({
        id: `resale-${property.id}`,
        name: property.propertyName,
        type: 'property' as const,
        propertyName: property.propertyName,
        category: 'Resale Document',
        uploadedAt: property.createdAt.toISOString(),
        size: 'Unknown',
        url: `/uploads/resale/${property.id}`,
        documents: property.documents
      }))
    ];

    res.json({
      success: true,
      data: documents,
      total: documents.length
    });

  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search documents',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get detailed breakdown for a specific report
export const getReportBreakdown = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    let breakdown: any[] = [];

    // Generate breakdown based on report type and category
    switch (reportId) {
      case '1': // Builder-wise Booking
        const builderBookings = await prisma.booking.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: now
            }
          },
          include: {
            project: {
              include: {
                builder: true
              }
            }
          },
          orderBy: {
            amount: 'desc'
          }
        });

        breakdown = builderBookings.map(booking => ({
          id: `booking-${booking.id}`,
          name: booking.project.builder.name,
          amount: booking.amount,
          percentage: 0, // Will be calculated
          count: 1,
          date: booking.createdAt.toISOString(),
          status: booking.status,
          details: {
            projectName: booking.project.name,
            unitNo: booking.unitNo,
            buyerName: booking.buyerName
          }
        }));
        break;

      case '2': // Builder-wise Paid
        const builderPayments = await prisma.paymentCollection.findMany({
          where: {
            type: 'PROJECT',
            date: {
              gte: startDate,
              lte: now
            }
          },
          orderBy: {
            amount: 'desc'
          }
        });

        breakdown = builderPayments.map(payment => ({
          id: `payment-${payment.id}`,
          name: `Project Payment - ${payment.from}`,
          amount: payment.amount,
          percentage: 0,
          count: 1,
          date: payment.date.toISOString(),
          status: 'Paid',
          details: {
            from: payment.from,
            remarks: payment.remarks,
            collectedBy: 'User', // Simplified for now
            receivedBy: 'User' // Simplified for now
          }
        }));
        break;

      case '4': // Project-wise Booking
        const projectBookings = await prisma.booking.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: now
            }
          },
          include: {
            project: true
          },
          orderBy: {
            amount: 'desc'
          }
        });

        breakdown = projectBookings.map(booking => ({
          id: `booking-${booking.id}`,
          name: booking.project.name,
          amount: booking.amount,
          percentage: 0,
          count: 1,
          date: booking.createdAt.toISOString(),
          status: booking.status,
          details: {
            unitNo: booking.unitNo,
            buyerName: booking.buyerName,
            city: booking.project.city
          }
        }));
        break;

      case '7': // Property-wise Booking
        const propertyBookings = await prisma.resaleBooking.findMany({
          where: {
            date: {
              gte: startDate,
              lte: now
            }
          },
          include: {
            property: true
          },
          orderBy: {
            amount: 'desc'
          }
        });

        breakdown = propertyBookings.map(booking => ({
          id: `resale-booking-${booking.id}`,
          name: booking.property.propertyName,
          amount: booking.amount,
          percentage: 0,
          count: 1,
          date: booking.date.toISOString(),
          status: booking.status,
          details: {
            building: booking.property.building,
            propertyType: booking.property.propertyType,
            buyerName: booking.buyerName
          }
        }));
        break;

      case '8': // Property-wise Paid
        const propertyPayments = await prisma.paymentCollection.findMany({
          where: {
            type: 'RESALE',
            date: {
              gte: startDate,
              lte: now
            }
          },
          include: {
            resaleBooking: {
              include: {
                property: true
              }
            }
          },
          orderBy: {
            amount: 'desc'
          }
        });

        breakdown = propertyPayments.map(payment => ({
          id: `property-payment-${payment.id}`,
          name: payment.resaleBooking?.property?.propertyName || 'Unknown Property',
          amount: payment.amount,
          percentage: 0,
          count: 1,
          date: payment.date.toISOString(),
          status: 'Paid',
          details: {
            from: payment.from,
            remarks: payment.remarks,
            propertyType: payment.resaleBooking?.property?.type,
            building: payment.resaleBooking?.property?.building
          }
        }));
        break;

      case '10': // Employee-wise Paid
        const employeePayments = await prisma.paymentCollection.findMany({
          where: {
            type: 'SALARY',
            date: {
              gte: startDate,
              lte: now
            }
          },
          include: {
            collectedUser: true,
            receivedUser: true
          },
          orderBy: {
            amount: 'desc'
          }
        });

        breakdown = employeePayments.map(payment => ({
          id: `employee-payment-${payment.id}`,
          name: payment.receivedUser?.name || 'Unknown Employee',
          amount: payment.amount,
          percentage: 0,
          count: 1,
          date: payment.date.toISOString(),
          status: 'Paid',
          details: {
            from: payment.from,
            remarks: payment.remarks,
            collectedBy: 'User', // Simplified for now
            receivedBy: 'User' // Simplified for now
          }
        }));
        break;

      default:
        // Return empty breakdown for other report types
        breakdown = [];
    }

    // Calculate percentages
    const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);
    breakdown = breakdown.map(item => ({
      ...item,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    }));

    res.json({
      success: true,
      data: breakdown,
      total: breakdown.length,
      reportId,
      period
    });

  } catch (error) {
    console.error('Error fetching report breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report breakdown',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
