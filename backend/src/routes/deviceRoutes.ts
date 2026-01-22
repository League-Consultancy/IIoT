import { Router } from 'express';
import { IngestionService } from '../services/IngestionService';
// In a real app, middleware would authenticate the DEVICE via Mutual TLS or specialized Device Token
// For this SaaS context, we assume the device sends a signed JWT token provisioning during setup.

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { deviceId, factoryId, tenantId, data } = req.body;

    // Basic validation
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // In a production system, we would validate that req.user.sub === deviceId
    // to prevent spoofing.

    await IngestionService.processBatch({
      deviceId,
      factoryId,
      tenantId, // In real scenario, extracted from Device Token
      readings: data
    });

    return res.status(202).json({ success: true }); // 202 Accepted (Async processing)
  } catch (error) {
    console.error('Ingestion failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;