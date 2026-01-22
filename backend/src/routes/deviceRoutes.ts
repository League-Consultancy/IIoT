import { Router } from 'express';
import * as deviceController from '../controllers/deviceController.js';
import * as sessionController from '../controllers/sessionController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as exportController from '../controllers/exportController.js';
import { authenticate } from '../middlewares/auth.js';
import { adminOnly } from '../middlewares/roleGuard.js';
import { audit } from '../middlewares/audit.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Device CRUD
router.get('/', deviceController.listDevices);
router.get('/:deviceId', deviceController.getDevice);
router.post(
    '/',
    adminOnly,
    deviceController.createDeviceValidation,
    audit({ action: 'device.create', resourceType: 'device', getResourceId: (req) => req.body.device_id }),
    deviceController.createDevice
);
router.patch(
    '/:deviceId',
    adminOnly,
    deviceController.updateDeviceValidation,
    audit({ action: 'device.update', resourceType: 'device', getResourceId: (req) => req.params.deviceId ?? '' }),
    deviceController.updateDevice
);
router.delete(
    '/:deviceId',
    adminOnly,
    audit({ action: 'device.delete', resourceType: 'device', getResourceId: (req) => req.params.deviceId ?? '' }),
    deviceController.deleteDevice
);

// Device sessions
router.get('/:deviceId/sessions', sessionController.getDeviceSessions);

// Device analytics (per-device only as per spec)
router.get('/:deviceId/analytics/daily', analyticsController.getDailyAnalytics);
router.get('/:deviceId/analytics/weekly', analyticsController.getWeeklyAnalytics);
router.get('/:deviceId/analytics/monthly', analyticsController.getMonthlyAnalytics);
router.get('/:deviceId/analytics/summary', analyticsController.getAnalyticsSummary);
router.get('/:deviceId/analytics/period', analyticsController.getPeriodAnalytics);

// Device session exports
router.post(
    '/:deviceId/sessions/export',
    exportController.createExportValidation,
    audit({ action: 'export.create', resourceType: 'export_job', getResourceId: (req) => req.params.deviceId ?? '' }),
    exportController.createExport
);

export default router;
