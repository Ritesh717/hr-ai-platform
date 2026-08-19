import { AuthorizationError } from '../../common/errors/app.error';
import { hasPermission, requirePermission } from './authorization';
import { PermissionCode } from './constants/permission-code.enum';

// Mirrors the has_permission/require_permission coverage exercised indirectly throughout
// tests/unit/*.py — the authorization primitive every service's permission gates reduce to.
describe('authorization', () => {
  it('hasPermission is true only when the code is in the set', () => {
    const granted = new Set([PermissionCode.EMPLOYEE_READ]);
    expect(hasPermission(granted, PermissionCode.EMPLOYEE_READ)).toBe(true);
    expect(hasPermission(granted, PermissionCode.EMPLOYEE_WRITE)).toBe(false);
  });

  it('requirePermission throws AuthorizationError when missing', () => {
    const granted = new Set<PermissionCode>();
    expect(() => requirePermission(granted, PermissionCode.RBAC_MANAGE)).toThrow(AuthorizationError);
  });

  it('requirePermission does not throw when granted', () => {
    const granted = new Set([PermissionCode.RBAC_MANAGE]);
    expect(() => requirePermission(granted, PermissionCode.RBAC_MANAGE)).not.toThrow();
  });
});
