import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class HealthService implements OnModuleInit {
  private readonly logger = new Logger(HealthService.name);
  private startTime: Date = new Date();
  private uptimeSeconds: number = 0;
  private lastPing: Date = new Date();

  // Al iniciar el módulo, registramos el tiempo de inicio
  onModuleInit() {
    this.logger.log('🩺 Health Service inicializado');
    this.startTime = new Date();
    this.updateUptime();
  }

  // Tarea que se ejecuta CADA 14 MINUTOS (840 segundos)
  @Cron('*/14 * * * *') // Cada 14 minutos
  handleHealthPing() {
    this.lastPing = new Date();
    this.updateUptime();
    
    this.logger.log(`🔄 Health Ping ejecutado a las ${this.lastPing.toLocaleTimeString()}`);
    this.logger.log(`⏱️ Uptime: ${this.getUptimeString()}`);
  }

  // Método para actualizar el uptime
  private updateUptime() {
    const now = new Date();
    this.uptimeSeconds = Math.floor((now.getTime() - this.startTime.getTime()) / 1000);
  }

  // Estado básico de salud
  getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: this.getUptimeString(),
      service: 'seda-backend',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  // Estado detallado (para debugging)
  getDetailedStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: this.getUptimeString(),
      uptimeSeconds: this.uptimeSeconds,
      lastPing: this.lastPing.toISOString(),
      lastPingHuman: this.lastPing.toLocaleString(),
      service: 'seda-backend',
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  // Formatear uptime en "X días, X horas, X minutos"
  private getUptimeString(): string {
    const days = Math.floor(this.uptimeSeconds / 86400);
    const hours = Math.floor((this.uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((this.uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(this.uptimeSeconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}