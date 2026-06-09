import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { Response, Request } from 'express'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  // Paso 1: redirige a Google
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // GoogleAuthGuard maneja la redirección automáticamente
    // este método no necesita hacer nada
  }

  // Paso 2: Google regresa aquí con los datos del usuario
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as {
      email: string
      name: string
      lastName: string
      photo: string
    }

    // Busca o crea el teacher en la DB
    const teacher = await this.authService.findOrCreateTeacher(googleUser)

    // Genera los tokens
    const { accessToken, refreshToken } = await this.authService.generateTokens(
      teacher.id,
      teacher.email,
      teacher.role,
    )

    // Manda el refresh token en cookie httpOnly
    // (no accesible desde JavaScript, más seguro)

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,                // Siempre true en Railway (HTTPS)
      sameSite: 'none',            // Obligatorio para cross-origin
      maxAge: 30 * 24 * 60 * 60 * 1000,
      // NO especifiques 'domain' a menos que frontend y backend compartan el mismo dominio raíz
    })
    // res.cookie('refresh_token', refreshToken, {
    //   httpOnly: true,
    //   secure: this.config.get('NODE_ENV') === 'production',
    //   sameSite: this.config.get('NODE_ENV') === 'production' ? 'none' : 'lax',
    //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días en milisegundos
    // })

    // Redirige al frontend con el access token en la URL
    // el frontend lo captura y lo guarda en memoria
    const frontendUrl = this.config.get<string>('FRONTEND_URL')
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`)
  }

  // Ruta protegida: solo accesible con JWT válido
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request) {
    const teacher = req.user as {
      id: string
      email: string
      name: string
      lastName: string
      photo: string
      role: string
      active: boolean
      createdAt: Date
      refreshToken: string
    }

    // Nunca enviamos el refreshToken al cliente
    const { refreshToken, ...result } = teacher
    return result
  }

  // Cerrar sesión
  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    const teacher = req.user as { id: string }
    await this.authService.logout(teacher.id)

    res.clearCookie('refresh_token')
    res.json({ message: 'Sesión cerrada correctamente' })
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const user = req.user as {
      sub: string
      email: string
      role: string
      refreshToken: string
    }

    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      user.sub,
      user.refreshToken,
    )

    // Actualiza la cookie con el nuevo refresh token
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    res.json({ accessToken })
  }


  @Get('debug-cookies')
  debugCookies(@Req() req: Request) {
    console.log('=== DEBUG COOKIES ===');
    console.log('Headers cookie:', req.headers.cookie);
    console.log('Parsed cookies:', req.cookies);
    return {
      headersCookie: req.headers.cookie || 'none',
      parsedCookies: req.cookies,
      hasRefreshToken: !!req.cookies?.refresh_token,
    };
  }

  @Get('set-test-cookie')
  setTestCookie(@Res() res: Response) {
    res.cookie('test_cookie', 'hello', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 1000
    });
    res.json({ ok: true });
  }
}