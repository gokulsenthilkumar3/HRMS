import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AssetsModule } from './assets/assets.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { HelpdeskModule } from './helpdesk/helpdesk.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { HrModule } from './hr/hr.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ProcurementModule } from './procurement/procurement.module';
import { AiModule } from './ai/ai.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FieldRbacInterceptor } from './auth/field-rbac.interceptor';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    PrismaModule,
    AssetsModule,
    BlockchainModule,
    MaintenanceModule,
    HelpdeskModule,
    AuthModule,
    UsersModule,
    ReportsModule,
    HrModule,
    FacilitiesModule,
    ProcurementModule,
    AnalyticsModule,
    AiModule,
    TelemetryModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: FieldRbacInterceptor,
    }
  ],
})
export class AppModule {}
