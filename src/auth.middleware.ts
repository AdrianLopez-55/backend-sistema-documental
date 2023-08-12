import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from the Authorization header

    if (token) {
      try {
        const decodedToken = jwt.verify(token, this.configService.get<string>('JWT_SECRET'));
        req['user'] = decodedToken; // Attach the decoded token payload to the request object
      } catch (error) {
        // Handle invalid token
        // You might want to log the error or send an appropriate response
      }
    }

    next();
  }
}