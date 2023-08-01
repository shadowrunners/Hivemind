import {
  OnModuleInit,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Client, GatewayIntentBits } from 'discord.js';
import { getUserID, UserSession } from '@/utils/discord';
import initClient from '@/bot/main';
import { GuildDB } from '@/schemas/guild';

type Feature =  'confessions' | 'antiphishing' | 'goodbye' | 'logs' | 'levelling' | 'tickets' | 'verification' | 'welcome';

@Injectable()
export class BotService extends Client implements OnModuleInit {
  constructor() {
    super({ intents: [GatewayIntentBits.Guilds] });
  }

  onModuleInit() {
    return initClient(this);
  }

  async getEnabledFeatures(guild: string): Promise<Feature[]> {
    const features: Feature[] = [];
    const getFeatures = await GuildDB.countDocuments({
      id: guild,
    });

    if (getFeatures !== 0) 
      features.push('confessions', 'antiphishing', 'goodbye', 'logs', 'levelling', 'tickets', 'verification', 'welcome');
    

    return features;
  }

  async checkPermissions(user: UserSession, guildID: string) {
    const guild = this.guilds.cache.get(guildID);
    
    if (guild === null)
      throw new HttpException('Missing Cyberspace', HttpStatus.NOT_FOUND);

    const userID = await getUserID(user.access_token);
    const member = await guild?.members.fetch(userID);

    if (
      !member?.permissions.has('Administrator') &&
      guild?.ownerId !== member?.id
    ) throw new HttpException('Missing permissions', HttpStatus.BAD_REQUEST);
  }
}
