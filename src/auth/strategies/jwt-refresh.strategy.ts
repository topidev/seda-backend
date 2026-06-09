import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { Request } from 'express'

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private config: ConfigService) {
    super({
      // Lee el token de la cookie en lugar del header Authorization
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token ?? null,
      ]),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      ignoreExpiration: false,
      // Pasamos el request completo para poder leer la cookie
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: { sub: string; email: string; role: string }) {
    console.log('=== JWT Refresh Strategy ===');
    console.log('Cookies recibidas:', req.cookies);
    console.log('Refresh token de cookie:', req.cookies?.refresh_token);
    
    const refreshToken = req?.cookies?.refresh_token
    if (!refreshToken) {
      console.log('❌ No refresh token en cookie');
      throw new UnauthorizedException('Refresh token no encontrado')
    }

    // Adjuntamos el refresh token al payload para usarlo en el controller
    console.log('✅ Token encontrado, payload:', payload);
    return { ...payload, refreshToken }
  }
}