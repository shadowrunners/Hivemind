import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GuildController } from './guilds/controllers/guild.controller';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { GuildsModule } from './guilds/guild.module';

@Module({
	imports: [MongooseModule.forRoot(process.env.DATABASE_URL), GuildsModule],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthMiddleware).forRoutes(GuildController);
	}
}
