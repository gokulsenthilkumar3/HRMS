import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule }   from './prisma/prisma.module';
import { LoggerModule }   from './common/logger/logger.module';
import { AuthModule }     from './auth/auth.module';
import { UsersModule }    from './users/users.module';
import { PayrollModule }  from './payroll/payroll.module';
import { AttendanceModule } from './attendance/attendance.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditMiddleware } from './common/middleware/audit.middleware';
import { throttlerConfig } from './common/guards/throttler.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(throttlerConfig),
    LoggerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PayrollModule,
    AttendanceModule,
    RecruitmentModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
