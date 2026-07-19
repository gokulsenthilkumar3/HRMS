import { ThrottlerModuleOptions } from '@nestjs/throttler';

// General API: 100 requests per 15 minutes
// Auth routes get a tighter limit applied via @Throttle() decorator
export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: 'general',
    ttl:   15 * 60 * 1000, // 15 minutes in ms
    limit: 1000,
  },
  {
    name: 'auth',
    ttl:   15 * 60 * 1000,
    limit: 100,
  },
];
