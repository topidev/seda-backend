import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { SchoolsModule } from './schools/schools.module';
import { SubjectsModule } from './subjects/subjects.module';
import { GroupsModule } from './groups/groups.module';
import { StudentsModule } from './students/students.module';
import { ClassroomModule } from './classroom/classroom.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Un minuto de gap
        limit: 100 // 100 intentos por el gap de un min
      }
    ]),
    ConfigModule.forRoot({
      isGlobal: true,   // disponible en toda la app sin importarlo
      validate,         // valida las variables al iniciar
    }),
    PrismaModule,
    AuthModule,
    SchoolsModule,
    SubjectsModule,
    GroupsModule,
    StudentsModule,
    ClassroomModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule {}
