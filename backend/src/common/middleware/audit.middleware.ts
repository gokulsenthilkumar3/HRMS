import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (!MUTATION_METHODS.has(req.method)) {
      return next();
    }

    const user = (req as any).user;
    const userId = user?.sub ?? user?.id ?? null;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';

    // Derive resource from URL path segment
    const segments = req.path.split('/').filter(Boolean);
    const resource   = segments[0] ?? 'unknown';
    const resourceId = segments[1] ?? null;
    const action = `${req.method}:${req.path}`;

    // Log asynchronously — do not block request
    this.prisma.auditLog
      .create({
        data: {
          userId,
          action,
          details: JSON.stringify({
            resource,
            resourceId,
            ip,
            userAgent,
            body: this.sanitizeBody(req.body),
          }),
        },
      })
      .catch(() => { /* never throw in middleware */ });

    next();
  }

  private sanitizeBody(body: Record<string, any>): Record<string, any> {
    if (!body || typeof body !== 'object') return {};
    const SENSITIVE = new Set(['password', 'passwordHash', 'token', 'pan', 'aadhar', 'bankAccount', 'ifsc']);
    return Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, SENSITIVE.has(k) ? '[REDACTED]' : v]),
    );
  }
}
