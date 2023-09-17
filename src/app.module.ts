import { BotService } from './services/bot.service';
import { PrismaService } from './services/prisma.service';

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GuildController } from './controllers/guild.controller';
import { AuthMiddleware } from './middlewares/auth.middleware';

@Module({
	controllers: [GuildController],
	providers: [BotService, PrismaService],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(GuildController);
	}
}
