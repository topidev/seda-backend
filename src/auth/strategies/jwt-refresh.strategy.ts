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
        // Ahora leer del body
        // (req: Request) => req?.body?.refreshToken ?? null,
      ]),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      ignoreExpiration: false,
      // Pasamos el request completo para poder leer la cookie
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: { sub: string; email: string; role: string }) {
    
    const refreshToken = req?.cookies?.refresh_token

    console.log('Body recibido:', req.body)
    console.log('RefreshToken encontrado:', !!refreshToken)
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no encontrado')
    }

    // Adjuntamos el refresh token al payload para usarlo en el controller
    return { ...payload, refreshToken }
  }
}