import { Router } from 'express';
import * as sessionController from '../controllers/sessionController.js';
import { authenticate } from '../middlewares/auth.js';
import { audit } from '../middlewares/audit.js';

const router = Router();

// POST /api/v1/device/session - Primary ingestion endpoint
router.post(
    '/session',
    authenticate,
    sessionController.sessionIngestionValidation,
    audit({
        action: 'session.ingest',
        resourceType: 'device_session',
        getResourceId: (req) => req.body.device_id,
    }),
    sessionController.ingestSession
);

export default router;
