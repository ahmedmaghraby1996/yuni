import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // If there's an error (e.g. invalid token) or no user, just return null/undefined
    // This allows the route to proceed without a user
    if (err || !user) {
      return null;
    }
    return user;
  }
}
