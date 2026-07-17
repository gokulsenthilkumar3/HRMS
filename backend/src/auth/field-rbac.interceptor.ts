import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class FieldRbacInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtAuthGuard

    return next.handle().pipe(
      map((data) => {
        // If no user or user is ADMIN, return data untouched
        if (!user || user.role === 'ADMIN') {
          return data;
        }

        // For non-admins (e.g. USER), strip sensitive fields
        return this.stripSensitiveFields(data);
      }),
    );
  }

  private stripSensitiveFields(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.stripSensitiveFields(item));
    }

    if (data && typeof data === 'object') {
      const sanitized = { ...data };
      
      // Fields that only ADMIN should see
      const sensitiveFields = ['purchasePrice', 'blockHash', 'previousBlockHash'];
      
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          delete sanitized[field];
        }
      });

      return sanitized;
    }

    return data;
  }
}
