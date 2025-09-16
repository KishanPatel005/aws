import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// File filter to allow specific file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'mp4'];
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

// Configure multer for builders
const builderStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/builders');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const builderUpload = multer({
  storage: builderStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for lands
const landStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/land');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const landUpload = multer({
  storage: landStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for resale
const resaleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resale');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const resaleUpload = multer({
  storage: resaleStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Error handling middleware
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: error.message });
  } else if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};

// Export upload helpers
export const uploadSingle = builderUpload.single('logo');
export const uploadMultiple = landUpload.fields([
  { name: 'mapDocs', maxCount: 10 },
  { name: 'villageMapDocs', maxCount: 10 },
  { name: 'sevenTwelveDocs', maxCount: 10 },
  { name: 'fpDocs', maxCount: 10 }
]);
export const uploadResaleMultiple = resaleUpload.fields([
  { name: 'documents', maxCount: 10 }
]);

// Configure multer for projects
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/projects');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const projectUpload = multer({
  storage: projectStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

export const uploadProjectMultiple = projectUpload.fields([
  { name: 'documents', maxCount: 10 }
]);

export default builderUpload;