import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../users/entities/user.entity.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SUA_CHAVE_SECRETA_MUITO_SEGURA', 
    });
  }

  async validate(payload: { sub: number; email: string; role?: UserRole }) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role || UserRole.USER,
    };
  }
}