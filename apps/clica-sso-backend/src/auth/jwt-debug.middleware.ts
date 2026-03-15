import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class JwtDebugMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    // Só logar se for uma rota protegida e não for repetitiva
    if (authHeader && req.path !== '/' && !req.path.includes('favicon')) {
      console.log('🔍 JWT Debug Middleware:');
      console.log('   - Authorization header present:', !!authHeader);
      console.log('   - Token length:', token?.length || 0);
      console.log('   - Token starts with:', token?.substring(0, 20) + '...');
      console.log('   - Request path:', req.path);
      console.log('   - Request method:', req.method);
    }

    next();
  }
}
