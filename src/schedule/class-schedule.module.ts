import { Module } from '@nestjs/common'
import { ClassScheduleController } from './class-schedule.controller'
import { ClassScheduleService } from './class-schedule.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ClassScheduleController],
  providers: [ClassScheduleService],
})
export class ClassScheduleModule {}