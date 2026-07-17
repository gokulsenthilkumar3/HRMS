import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to the database.');
    } catch (error) {
      console.warn('Failed to connect to the database on startup. Ensure DATABASE_URL is correct.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
