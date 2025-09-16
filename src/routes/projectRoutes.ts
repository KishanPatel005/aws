import { Router } from 'express';
import { getAllProjects, getProjectById, createProject, updateProject, deleteProject, removeDocument } from '../controllers/projectController';
import { uploadProjectMultiple, handleUploadError } from '../middleware/upload';

const router = Router();

router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/', uploadProjectMultiple, handleUploadError, createProject);
router.put('/:id', uploadProjectMultiple, handleUploadError, updateProject);
router.delete('/:id', deleteProject);
router.delete('/:id/document', removeDocument);

export default router;
