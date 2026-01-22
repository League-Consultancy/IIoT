import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      user?: any;
    }
  }
}

export const tenantContext = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    // CRITICAL: Enforce tenant isolation at the request entry point
    if (!decoded.tenantId) {
      throw new Error('Token missing tenant context');
    }

    req.tenantId = decoded.tenantId;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};