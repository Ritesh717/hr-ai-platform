import { AuthorizationError } from '../../common/errors/app.error';
import { PermissionCode } from './constants/permission-code.enum';

// Mirrors domain/rbac/authorization.py's has_permission/require_permission — the entire
// authorization primitive. Every "permission gate" in a service method is a one-line call to
// requirePermission() at the top of the method; controllers never check permissions themselves.
export function hasPermission(actorPermissions: ReadonlySet<PermissionCode>, permission: PermissionCode): boolean {
  return actorPermissions.has(permission);
}

export function requirePermission(actorPermissions: ReadonlySet<PermissionCode>, permission: PermissionCode): void {
  if (!hasPermission(actorPermissions, permission)) {
    throw new AuthorizationError(`Missing required permission '${permission}'`);
  }
}
