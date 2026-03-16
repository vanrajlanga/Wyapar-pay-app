import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access an endpoint
 * Usage: @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Convenience decorator for admin-only endpoints
 * Allows ADMIN, SUPER_ADMIN, and MODERATOR roles
 */
export const AdminOnly = () =>
  SetMetadata(ROLES_KEY, [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.MODERATOR,
  ]);

/**
 * Convenience decorator for super admin only endpoints
 */
export const SuperAdminOnly = () =>
  SetMetadata(ROLES_KEY, [UserRole.SUPER_ADMIN]);
