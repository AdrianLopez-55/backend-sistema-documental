// import {
// 	Injectable,
// 	NestInterceptor,
// 	ExecutionContext,
// 	CallHandler,
// 	HttpStatus,
//   } from '@nestjs/common';
//   import { Observable } from 'rxjs';
//   import { map } from 'rxjs/operators';
//   import { Response } from 'express';

//   @Injectable()
// export class ErrorInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const ctx = context.switchToHttp();
//     const response = ctx.getResponse<Response>();

//     return next.handle().pipe(
//       map((data) => {
//         if (data instanceof Error) {
//           // Si el resultado es una instancia de Error, entonces es un error controlado
//           const error = data as Error;

//           response.status(HttpStatus.UNAUTHORIZED).json({
//             status: HttpStatus.UNAUTHORIZED,
//             error: true,
//             message: error.message,
//             response: 'el formato de la respuesta',
//           });
//         }

//         return data;
//       }),
//     );
//   }
// }

// import { HttpException, HttpStatus } from '@nestjs/common';

// export class ErrorManager extends Error {
// 	constructor({ type, message }:{ type: keyof typeof HttpStatus, message: string }) {
// 		super(`${type} :: ${message}`)
// 	}

// 	public static createSignatureError( message: string ) {
// 		const name = message.split(' :: ')[0]
// 		if( name ) {
// 			throw new HttpException(message, HttpStatus[name])
// 		} else {
// 			throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR)
// 		}
// 	}
// }