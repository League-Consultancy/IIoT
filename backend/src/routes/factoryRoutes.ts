import { Router } from 'express';
import * as deviceController from '../controllers/deviceController.js';
import { authenticate } from '../middlewares/auth.js';
import { adminOnly } from '../middlewares/roleGuard.js';
import { audit } from '../middlewares/audit.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/factories
router.get('/', deviceController.listFactories);

// GET /api/v1/factories/:factoryId
router.get('/:factoryId', deviceController.getFactory);

// POST /api/v1/factories (admin only)
router.post(
    '/',
    adminOnly,
    deviceController.createFactoryValidation,
    audit({ action: 'factory.create', resourceType: 'factory', getResourceId: (req) => req.body.name }),
    deviceController.createFactory
);

export default router;
