import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticationError } from '../errors/app.error';

// Authenticates the request by resolving req.user via JwtStrategy. Does NOT check permissions —
// authorization stays in service methods (requirePermission calls). The separation is what makes
// self-access carve-outs (an employee may always read or partially edit their own record) possible
// without a route-level all-or-nothing guard.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(err: unknown, user: TUser | false): TUser {
    if (err) throw err;
    if (!user) throw new AuthenticationError('Not authenticated');
    return user;
  }
}
