import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                ({ timestamp, level, message, context, stack }) =>
                  `${timestamp} [${context ?? 'App'}] ${level}: ${stack ?? message}`,
              ),
            ),
      ),
      transports: [
        new winston.transports.Console(),
        ...(process.env.NODE_ENV === 'production'
          ? [
              new winston.transports.File({ filename: 'logs/error.log',    level: 'error' }),
              new winston.transports.File({ filename: 'logs/combined.log' }),
            ]
          : []),
      ],
    });
  }

  log(message: string, context?: string)   { this.logger.info(message,  { context }); }
  error(message: string, trace?: string, context?: string) { this.logger.error(message, { context, stack: trace }); }
  warn(message: string, context?: string)  { this.logger.warn(message,  { context }); }
  debug(message: string, context?: string) { this.logger.debug(message, { context }); }
  verbose(message: string, context?: string) { this.logger.verbose(message, { context }); }
}
