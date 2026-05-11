import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { JwtPayload } from './strategies/jwt.strategy'
import * as argon2 from 'argon2'
import type { StringValue } from 'ms'

interface GoogleUser {
  email: string
  name: string
  lastName: string
  photo: string
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // Busca o crea el teacher cuando entra con Google
  async findOrCreateTeacher(googleUser: GoogleUser) {
    let teacher = await this.prisma.teacher.findUnique({
      where: { email: googleUser.email },
    })

    if (!teacher) {
      teacher = await this.prisma.teacher.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          lastName: googleUser.lastName,
          photo: googleUser.photo,
        },
      })
    }

    return teacher
  }

  // Genera el access token (dura 15 minutos)
  async generateAccessToken(payload: JwtPayload): Promise<string> {
  return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') as StringValue,
  })
  }

  // Genera el refresh token (dura 30 días)
  async generateRefreshToken(payload: JwtPayload): Promise<string> {
  return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') as StringValue,
  })
  }

  // Genera ambos tokens y devuelve los dos
  async generateTokens(teacherId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: teacherId, email, role }

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ])

    // Guardamos el refresh token hasheado en DB
    // si alguien roba la DB no obtiene el token real
    const hashedRefreshToken = await argon2.hash(refreshToken)

    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { refreshToken: hashedRefreshToken },
    })

    return { accessToken, refreshToken }
  }

  async logout(teacherId: string) {
    // Borra el refresh token de la DB
    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { refreshToken: null },
    })
  }

  async refreshTokens(teacherId: string, refreshToken: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    })

    // Si el maestro no existe, fue desactivado, o no tiene refresh token
    if (!teacher || !teacher.active || !teacher.refreshToken) {
      throw new UnauthorizedException('Acceso denegado')
    }

    // Verifica que el refresh token que mandó coincide con el guardado en DB
    const tokenMatches = await argon2.verify(teacher.refreshToken, refreshToken)

    if (!tokenMatches) {
      throw new UnauthorizedException('Acceso denegado')
    }

    // Todo válido, genera nuevos tokens
    return this.generateTokens(teacher.id, teacher.email, teacher.role)
  }
}