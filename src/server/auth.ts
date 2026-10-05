import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';
import { UserRole } from '../types/index.ts';

const JWT_SECRET = process.env.AUTH_SECRET || 'foodsphere_super_secret_jwt_key_development_change_in_production';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Authentication middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Token is expired or invalid' });
  }

  req.user = decoded;
  next();
}

// Optional Auth (attaches req.user if token provided)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

// Role-based authorization
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}

// Tenant isolation middleware:
// Ensures the authenticated user belongs to the target tenant,
// or is a platform_admin who can optionally act on any tenant.
export function requireTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  // Platform admin can access any tenant if tenantId is provided via header or params
  if (req.user.role === 'platform_admin') {
    const tenantParam = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || req.user.tenantId;
    if (tenantParam) {
      // allow platform admin to act on target tenant
      (req as any).effectiveTenantId = tenantParam;
      return next();
    }
  }

  // Business owner or staff must have an associated tenantId
  if (!req.user.tenantId) {
    return res.status(403).json({ error: 'Forbidden: No business tenant associated with this account' });
  }

  (req as any).effectiveTenantId = req.user.tenantId;
  next();
}
