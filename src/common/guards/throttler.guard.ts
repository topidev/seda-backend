import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import type { ExecutionContext } from '@nestjs/common'

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Lee la IP real detrás del proxy de Render
    const forwarded = req.headers['x-forwarded-for']
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : req.ip

    return ip
  }
}