import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Get all projects
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// Get project by ID
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        builder: true
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

// Create new project
export const createProject = async (req: Request, res: Response) => {
  try {
    const { builderId, name, address, area, city, status, possessionDate, date, isEnabled, otherCharges } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Validate required fields
    if (!builderId || !name || !status) {
      return res.status(400).json({
        error: 'Builder ID, name, and status are required'
      });
    }

    // Check if builder exists
    const builder = await prisma.builder.findUnique({
      where: { id: parseInt(builderId) }
    });

    if (!builder) {
      return res.status(400).json({
        error: 'Builder not found'
      });
    }

    // Process uploaded files
    let documentPaths: string[] = [];
    if (files && files.documents && files.documents.length > 0) {
      documentPaths = files.documents.map(file => `/uploads/projects/${file.filename}`);
    }

    // Parse other charges JSON if provided
    let parsedOtherCharges = null;
    if (otherCharges) {
      try {
        parsedOtherCharges = JSON.parse(otherCharges);
      } catch (error) {
        return res.status(400).json({
          error: 'Other charges must be valid JSON'
        });
      }
    }

    const project = await prisma.project.create({
      data: {
        builderId: parseInt(builderId),
        name,
        address: address || null,
        area: area || null,
        city: city || null,
        status,
        possessionDate: possessionDate ? new Date(possessionDate) : null,
        documents: documentPaths.length > 0 ? documentPaths : undefined,
        date: date ? new Date(date) : new Date(),
        isEnabled: isEnabled === 'true' || isEnabled === true,
        otherCharges: parsedOtherCharges
      },
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// Update project
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { builderId, name, address, area, city, status, possessionDate, date, isEnabled, otherCharges, existingDocuments: frontendExistingDocs } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if builder exists if builderId is provided
    if (builderId) {
      const builder = await prisma.builder.findUnique({
        where: { id: parseInt(builderId) }
      });

      if (!builder) {
        return res.status(400).json({
          error: 'Builder not found'
        });
      }
    }

    // Process new uploaded files
    let newDocumentPaths: string[] = [];
    if (files && files.documents && files.documents.length > 0) {
      newDocumentPaths = files.documents.map(file => `/uploads/projects/${file.filename}`);
    }

    // Get existing documents - use frontend provided ones if available, otherwise get from database
    let existingDocuments: string[] = [];
    if (frontendExistingDocs !== undefined) {
      // Frontend explicitly provided existing documents (could be empty array)
      try {
        existingDocuments = typeof frontendExistingDocs === 'string' 
          ? JSON.parse(frontendExistingDocs) 
          : frontendExistingDocs;
      } catch (error) {
        console.error('Error parsing frontend existing documents:', error);
        // Fallback to database documents
        if (existingProject.documents) {
          try {
            existingDocuments = Array.isArray(existingProject.documents) 
              ? existingProject.documents 
              : JSON.parse(existingProject.documents as string);
          } catch (dbError) {
            console.error('Error parsing database documents:', dbError);
          }
        }
      }
    } else if (existingProject.documents) {
      // No frontend documents provided, use database documents
      try {
        existingDocuments = Array.isArray(existingProject.documents) 
          ? existingProject.documents 
          : JSON.parse(existingProject.documents as string);
      } catch (error) {
        console.error('Error parsing existing documents:', error);
      }
    }

    // Combine existing and new documents
    const allDocuments = [...existingDocuments, ...newDocumentPaths];

    // Parse other charges JSON if provided
    let parsedOtherCharges = null;
    if (otherCharges) {
      try {
        parsedOtherCharges = JSON.parse(otherCharges);
      } catch (error) {
        return res.status(400).json({
          error: 'Other charges must be valid JSON'
        });
      }
    }

    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        ...(builderId && { builderId: parseInt(builderId) }),
        ...(name && { name }),
        ...(address !== undefined && { address: address || null }),
        ...(area !== undefined && { area: area || null }),
        ...(city !== undefined && { city: city || null }),
        ...(status && { status }),
        ...(possessionDate !== undefined && { possessionDate: possessionDate ? new Date(possessionDate) : null }),
        ...(allDocuments.length > 0 || frontendExistingDocs !== undefined ? { documents: allDocuments } : {}),
        ...(date && { date: new Date(date) }),
        ...(isEnabled !== undefined && { isEnabled: isEnabled === 'true' || isEnabled === true }),
        ...(otherCharges && { otherCharges: parsedOtherCharges })
      },
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// Delete project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get project to delete document files
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete document files if they exist
    if (project.documents) {
      try {
        const documentPaths = Array.isArray(project.documents) 
          ? project.documents 
          : JSON.parse(project.documents as string);
        documentPaths.forEach((docPath: string) => {
          const fullPath = path.join(process.cwd(), docPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
      } catch (error) {
        console.error('Error deleting document files:', error);
      }
    }

    await prisma.project.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// Remove specific document from project
export const removeDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentPath } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.documents) {
      return res.status(400).json({ error: 'No documents found' });
    }

    // Parse existing documents
    let documents: string[] = [];
    try {
      documents = Array.isArray(project.documents) 
        ? project.documents 
        : JSON.parse(project.documents as string);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid documents format' });
    }

    // Remove the specified document
    const updatedDocuments = documents.filter(doc => doc !== documentPath);

    // Delete the file from filesystem
    const fullPath = path.join(process.cwd(), documentPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        documents: updatedDocuments.length > 0 ? updatedDocuments : undefined
      }
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Error removing document:', error);
    res.status(500).json({ error: 'Failed to remove document' });
  }
};
