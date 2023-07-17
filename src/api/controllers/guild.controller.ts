import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AuthRequest } from '../middlewares/auth.middleware';
import { BotService } from '../services/bot.service';
import { EmbedInterface, GuildDB } from '@/schemas/guild';

@Controller('/guilds/:guild')
export class GuildController {
  constructor(
    private readonly bot: BotService,
  ) {}

  @Get()
  async getGuild(@Param('guild') guild: string): Promise<any> {
    const data = this.bot.guilds.cache.get(guild);
    if (data == null) return 'null';

    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      enabledFeatures: await this.bot.getEnabledFeatures(guild),
    };
  }

  @Get('/features/welcome')
  async getFeature(@Param('guild') guild: string) {
    const data = await GuildDB.findOne({
      id: guild,
    });

    if (data === null) return null;

    return {
      enabled: data?.welcome?.enabled,
      channel: data?.welcome?.channel,
      embed: data?.welcome?.embed,
    };
  }

  @Post('/features/welcome')
  async enableFeature(@Req() req: AuthRequest, @Param('guild') guild: string) {
    await this.bot.checkPermissions(req.session, guild);

    await GuildDB.findOneAndUpdate(
      { 
        id: guild 
      },
      {
        $setOnInsert: {
          'welcome.enabled': true,
        }
      }
    )

    return 'Success';
  }

  @Patch('/features/welcome')
  async updateFeature(
    @Req() req: AuthRequest,
    @Param('guild') guild: string,
    @Body() body: WelcomeResponse,
  ) {
    await this.bot.checkPermissions(req.session, guild);

    console.log(body);

    const updated = await GuildDB.findOneAndUpdate(
      { 
        id: guild 
      },
      { 
        $set: {
          'welcome.channel': body.channel,
          'welcome.embed': body.embed,
        }, 
      },
     );

    return updated;
  }

  @Delete('/features/welcome')
  async disableFeature(@Param('guild') guild: string, @Req() req: AuthRequest) {
    await this.bot.checkPermissions(req.session, guild);

    await GuildDB.updateOne(
      { id: guild }, 
      { welcome: { enabled: false } 
    });

    return 'Success';
  }

  @Get('/features/antiphishing')
  async getAPFeature(@Param('guild') guild: string) {
    const data = await GuildDB.findOne({
      id: guild,
    });

    if (data == null) return null;

    return {
      enabled: data?.antiphishing?.enabled,
    };
  }

  @Post('/features/antiphishing')
  async enableAPFeature(@Req() req: AuthRequest, @Param('guild') guild: string) {
    await this.bot.checkPermissions(req.session, guild);

    await GuildDB.findOneAndUpdate(
      { 
        id: guild 
      },
      {
        $setOnInsert: {
          'antiphishing.enabled': true,
        }
      }
    )

    return 'Success';
  }

  @Delete('/features/antiphishing')
  async disableAPFeature(@Param('guild') guild: string, @Req() req: AuthRequest) {
    await this.bot.checkPermissions(req.session, guild);

    await GuildDB.findOneAndUpdate(
      { id: guild }, 
      { antiphishing: { enabled: false } 
    });

    return 'Success';
  }

  @Get('/channels')
  async getChannels(@Param('guild') guild: string) {
    const channels = await this.bot.guilds.cache.get(guild)?.channels.fetch();
    if (channels == null) return null;

    return [...channels.values()];
  }

  @Get('/roles')
  async getRoles(@Param('guild') guild: string) {
    const roles = await this.bot.guilds.cache.get(guild)?.roles.fetch();
    if (roles == null) return null;

    return [...roles.values()];
  }
}

interface WelcomeResponse {
  channel: string;
  embed: EmbedInterface;
}