import { HttpStatus, HttpException, Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserSession } from '@/utils/discord';

function getToken(req: FastifyRequest): UserSession {
	const data = req.headers.authorization as string | null;

	if (!data || !data.startsWith('Bearer '))
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
	use(req: FastifyRequest, _: FastifyReply['raw'], next: () => void) {
		req.session = getToken(req);
		next();
	}
}
