import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  
  // Se ejecuta cuando NestJS inicia el módulo
  async onModuleInit() {
    await this.$connect()
  }

  // Se ejecuta cuando NestJS apaga el servidor
  async onModuleDestroy() {
    await this.$disconnect()
  }
}