import { Module } from '@nestjs/common';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerModule } from '../common/logger/logger.module';
@Module({ imports:[PrismaModule,LoggerModule], controllers:[RecruitmentController], providers:[RecruitmentService] })
export class RecruitmentModule {}
