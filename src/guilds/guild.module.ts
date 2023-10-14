import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GuildController } from './controllers/guild.controller';
import { GuildSchema } from './schemas/guild.schema';
import { BotService } from '@/services/bot.service';
import { GuildsService } from './services/guild.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Guilds', schema: GuildSchema }])],
	controllers: [GuildController],
	providers: [BotService, GuildsService],
})
export class GuildsModule {}
