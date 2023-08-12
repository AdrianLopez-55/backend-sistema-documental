// import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
// import { Observable, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';

// @Injectable()
// export class ErrorFormatInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     return next.handle().pipe(
//       catchError(error => {
//         const formattedError = {
//           status: error.status || 500,
//           error: true,
//           message: error.message || 'Internal Server Error',
//           response: { data: error.response || null },
//         };
//         const errorTitle = context.switchToHttp().getRequest().url;
//         const responseWithFormattedTitle = {
//           ...formattedError,
//           title: errorTitle,
//         };
//         return throwError(responseWithFormattedTitle);
//       }),
//     );
//   }
// }

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadGatewayException,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  errors: T;
  data: [];
}

@Injectable()
export class ErrorsInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
      return next
          .handle()
          .pipe(
              map((response) => ({
                  statusCode: context.switchToHttp().getResponse().statusCode,
                  errors: response.errors,
                  message: response.message,
                  data: []
              })),
          );
  }
}