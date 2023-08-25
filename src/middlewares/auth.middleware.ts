import { HttpStatus, HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserSession } from '../utils/discord';

function getToken(req: Request): UserSession {
	const data = req.headers.authorization as string | null;

	if (data === null || !data.startsWith('Bearer '))
		throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);


	return {
		token_type: 'Bearer',
		access_token: data.slice('Bearer'.length).trim(),
	};
}

export interface AuthRequest {
  session: UserSession;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	use(req: any, _: Response, next: NextFunction) {
		(req.session = getToken(req)), next();
	}
}
