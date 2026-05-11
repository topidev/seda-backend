import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../../prisma/prisma.service'

// Este es el payload que guardamos dentro del JWT
export interface JwtPayload {
  sub: string  // id del teacher (sub es el estándar en JWT)
  email: string
  role: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // extrae el token del header: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET')!,
      ignoreExpiration: false, // rechaza tokens expirados
    })
  }

  // Passport llama a este método después de verificar la firma del token
  // lo que retornamos aquí se guarda en request.user
  async validate(payload: JwtPayload) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: payload.sub },
    })

    if (!teacher || !teacher.active) {
      throw new UnauthorizedException('Token inválido')
    }

    return teacher // disponible como request.user en los controllers
  }
}