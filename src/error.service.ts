import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class CustomErrorService {
  customResponse(status: number, error: boolean, message: string, data: any) {
    const response = {
      status,
      error,
      message,
      response: { data },
    };
    throw new HttpException(response, status);
  }
}
