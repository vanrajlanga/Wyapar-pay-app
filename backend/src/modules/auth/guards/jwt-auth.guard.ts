import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // Try to populate req.user from JWT if token is present, but don't fail if absent/invalid
      try {
        await super.canActivate(context);
      } catch {
        // No token or invalid token - OK for public routes, req.user stays undefined
      }
      return true;
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}
