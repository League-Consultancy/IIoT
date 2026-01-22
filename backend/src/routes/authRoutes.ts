import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', authController.loginValidation, authController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshValidation, authController.refresh);

// GET /api/v1/auth/me (requires authentication)
router.get('/me', authenticate, authController.me);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, authController.logout);

export default router;
