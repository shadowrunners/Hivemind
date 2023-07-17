import { HttpStatus, HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserSession } from '@/utils/discord';

function getToken(req: Request): UserSession {
  let data = req.headers.authorization as string | null;

  if (data == null || !data.startsWith('Bearer ')) {
    throw new HttpException('You must login first', HttpStatus.UNAUTHORIZED);
  }

  return {
    token_type: 'Bearer',
    access_token: data.slice('Bearer'.length).trim(),
  };
}

export interface AuthRequest extends Request {
  session: UserSession;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: AuthRequest, _: Response, next: NextFunction) {
    (req.session = getToken(req)), next();
  }
}
