import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticationError } from '../errors/app.error';

// Mirrors the oauth2_scheme + get_current_employee pairing in shared/auth/dependencies.py.
// This guard only authenticates (resolves req.user via JwtStrategy) — it does NOT check
// permissions. Authorization stays in service methods (require_permission calls), matching the
// Python pattern where routers are thin and business rules live in domain/*/service.py, not in
// route-level guards. That's what makes the self-access carve-outs (an employee may always read
// or partially edit their own record) possible without a route-level all-or-nothing guard.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(err: unknown, user: TUser | false): TUser {
    if (err) throw err;
    if (!user) throw new AuthenticationError('Not authenticated');
    return user;
  }
}
