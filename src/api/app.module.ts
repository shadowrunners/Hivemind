import { BotService } from './services/bot.service';

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { GuildController } from './controllers/guild.controller';
import { AuthMiddleware } from './middlewares/auth.middleware';

@Module({
  imports: [],
  controllers: [AppController, GuildController],
  providers: [BotService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('guilds');
  }
}
