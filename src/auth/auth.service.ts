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

    console.log('Token generado: ', refreshToken.slice(-10))
    console.log('Hash guardado: ', hashedRefreshToken.slice(-10))

    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { refreshToken: hashedRefreshToken },
    })

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId }
    })

    const veryfyNow = await argon2.verify(teacher!.refreshToken!, refreshToken)
    console.log('Verificación inmediata despues de guardar.', veryfyNow)

    return { accessToken, refreshToken }
  }

  async logout(teacherId: string) {
    // Borra el refresh token de la DB
    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { refreshToken: null },
    })
  }
  async refreshAccessToken(teacherId: string, email: string, role: string): Promise<string> {
    const payload: JwtPayload = { sub: teacherId, email, role }
    return this.generateAccessToken(payload)
  }

  async refreshTokens(teacherId: string, refreshToken: string) {
    console.log('RefreshToken recibido (20 chars): ', refreshToken.slice(-25))
    
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    })

    if (!teacher || !teacher.active || !teacher.refreshToken) {
      throw new UnauthorizedException('Acceso denegado')
    }

    console.log('Token BD Hash: ', teacher.refreshToken.slice(-25))
    const tokenMatches = await argon2.verify(teacher.refreshToken, refreshToken)
    console.log('Token matches: ', tokenMatches)

    if (!tokenMatches) {
      throw new UnauthorizedException('Acceso denegado')
    }
    // const accessToken = await this.refreshAccessToken(
    //   teacher.id,
    //   teacher.email,
    //   teacher.role,
    // )

    const payload: JwtPayload = {
      sub: teacher.id,
      email: teacher.email,
      role: teacher.role
    }

    const accessToken = await this.generateAccessToken(payload)

    return { accessToken, refreshToken }

    // return { accessToken, refreshToken }
    // return this.generateTokens(teacher.id, teacher.email, teacher.role)
  }
}