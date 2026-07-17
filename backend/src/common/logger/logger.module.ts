import { Module, Global } from '@nestjs/common';
import { WinstonLoggerService } from './winston.logger';

@Global()
@Module({
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class LoggerModule {}
