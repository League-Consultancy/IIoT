import { Router } from 'express';
import * as exportController from '../controllers/exportController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/exports - List user's exports
router.get('/', exportController.listExports);

// GET /api/v1/exports/:exportId - Get export status
router.get('/:exportId', exportController.getExportStatus);

// GET /api/v1/exports/:exportId/download - Download export file
router.get('/:exportId/download', exportController.downloadExport);

export default router;
