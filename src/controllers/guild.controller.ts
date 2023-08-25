/* eslint-disable no-mixed-spaces-and-tabs */
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Req,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { AuthRequest } from '../middlewares/auth.middleware';
import { BotService } from '../services/bot.service';
import { EmbedInterface, GuildDB } from '../schemas/guild';
import { SecureStorage } from '../utils/secureStorage';
import { sanitize } from 'isomorphic-dompurify';

@Controller('/guilds/:guild')
export class GuildController {
	private guild: string;

	constructor(
    private readonly bot: BotService,
		// eslint-disable-next-line no-inline-comments
	) { /** Woo wee, this ain't empty ! */ }

  @Get()
	async getGuild(@Param('guild') guild: string): Promise<unknown> {
		this.guild = sanitize(guild);

		try {
			const data = await this.bot.api.guilds.get(guild);

			const enabledFeatures = await this.bot.getEnabledFeatures(this.guild);

			return {
				id: data?.id,
				name: data?.name,
				icon: data?.icon,
				enabledFeatures,
			};
		}
		catch (_err) {
			throw new HttpException('Missing Cyberspace', HttpStatus.NOT_FOUND);
		}
	}

  @Get('/features/antiphishing')
  async getAPFeature(@Param('guild') guild: string) {

  	const data = await GuildDB.findOne({
  		id: guild,
  	});

  	if (data === null) return null;

  	return {
  		enabled: data?.antiphishing?.enabled,
  	};
  }

  @Post('/features/antiphishing')
  async enableAPFeature(@Req() req: AuthRequest, @Param('guild') guild: string) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{ $setOnInsert: { 'antiphishing.enabled': true },
  		});

  	return 'Success';
  }

  @Delete('/features/antiphishing')
  async disableAPFeature(@Param('guild') guild: string, @Req() req: AuthRequest) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.findOneAndUpdate(
  		{ id: guild },
  		{ antiphishing: { enabled: false },
  		});

  	return 'Success';
  }

  @Get('/features/confessions')
  async getCFFeature(@Param('guild') guild: string) {
  	const data = await GuildDB.findOne({
  		id: guild,
  	});

  	if (data === null) return null;

  	return {
  		enabled: data?.confessions?.enabled,
  		channel: data?.confessions?.channel,
  	};
  }

  @Post('/features/confessions')
  async enableCFFeature(@Req() req: AuthRequest, @Param('guild') guild: string) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{ $setOnInsert: { 'confessions.enabled': true },
  		});

  	return 'Success';
  }

  @Patch('/features/confessions')
  async updateCFFeature(
    @Req() req: AuthRequest,
    @Param('guild') guild: string,
    @Body() body: ConfessionsResponse,
  ) {
  	const secureStorage = new SecureStorage();
  	const data = await GuildDB.findOne({ id: guild });
  	await this.bot.checkPermissions(req.session, guild);

  	if (data?.confessions.channel !== body.channel && data?.confessions.webhook.id)
  		await this.bot.api.webhooks.delete(data?.confessions.webhook.id);

  	const self = await this.getBotInfo();

  	const webhook = await this.bot.api.channels.createWebhook(
  		body.channel,
  		{ name: 'Evelyn · Confessions', avatar: self.avatar },
  	);

  	const encryptedToken = secureStorage.encrypt(
      webhook.token as string,
  	);

  	const updated = await GuildDB.updateMany(
  		{ id: guild },
  		{
  			$set: {
  				'confessions.channel': body.channel,
  				'confessions.webhook.id': webhook.id,
  				'confessions.webhook.token': encryptedToken,
  			},
  		},
  	);

  	return updated;
  }

  @Delete('/features/confessions')
  async disableCFFeature(@Param('guild') guild: string, @Req() req: AuthRequest) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{ confessions: { enabled: false },
  		});

  	return 'Success';
  }

  @Get('/features/levelling')
  async getLVLFeature(@Param('guild') guild: string) {
  	const data = await GuildDB.findOne({
  		id: guild,
  	});

  	if (data == null) return null;

  	return {
  		enabled: data?.levels?.enabled,
  		channel: data?.levels?.channel,
  		message: data?.levels?.message,
  	};
  }

  @Post('/features/levelling')
  async enableLVLFeature(@Req() req: AuthRequest, @Param('guild') guild: string) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{ $setOnInsert: { 'levels.enabled': true },
  		});

  	return 'Success';
  }

  @Patch('/features/levelling')
  async updateLVLFeature(
    @Req() req: AuthRequest,
    @Param('guild') guild: string,
    @Body() body: LevelsResponse,
  ) {
  	await this.bot.checkPermissions(req.session, guild);

  	const updated = await GuildDB.updateMany(
  		{ id: guild },
  		{
  			$set: {
  				'levels.channel': body.channel,
  				'levels.message': body.message,
  			},
  		},
  	);

  	return updated;
  }

  @Delete('/features/levelling')
  async disableLVLFeature(@Param('guild') guild: string, @Req() req: AuthRequest) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.findOneAndUpdate(
  		{ id: guild },
  		{ levels: { enabled: false },
  		});

  	return 'Success';
  }

  @Get('/features/logs')
  async getLogsFeature(@Param('guild') guild: string) {
  	const data = await GuildDB.findOne({
  		id: guild,
  	});

  	if (data === null) return null;

  	return {
  		enabled: data?.logs?.enabled,
  		channel: data?.logs?.channel,
  	};
  }

  @Post('/features/logs')
  async enableLogsFeature(@Req() req: AuthRequest, @Param('guild') guild: string) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{
  			$setOnInsert: {
  				'logs.enabled': true,
  			},
  		},
  	);

  	return 'Success';
  }

  @Patch('/features/logs')
  async updateLogsFeature(
    @Req() req: AuthRequest,
    @Param('guild') guild: string,
    @Body() body: LogsResponse,
  ) {
  	await this.bot.checkPermissions(req.session, guild);

  	const secureStorage = new SecureStorage();
  	const data = await GuildDB.findOne({ id: guild });
  	await this.bot.checkPermissions(req.session, guild);

  	if (data?.confessions.channel !== body.channel && data?.logs.webhook.id)
  		await this.bot.api.webhooks.delete(data?.logs.webhook.id);

  	const self = await this.getBotInfo();

  	const webhook = await this.bot.api.channels.createWebhook(
  		body.channel,
  		{ name: 'Evelyn · Logs', avatar: self.avatar },
  	);

  	const encryptedToken = secureStorage.encrypt(
      webhook.token as string,
  	);

  	const updated = await GuildDB.updateMany(
  		{ id: guild },
  		{
  			$set: {
  				'logs.channel': body.channel,
  				'logs.webhook.id': webhook.id,
  				'logs.webhook.token': encryptedToken,
  			},
  		},
  	);

  	return updated;
  }

  @Delete('/features/logs')
  async disableLogsFeature(@Param('guild') guild: string, @Req() req: AuthRequest) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{ logs: { enabled: false },
  		});

  	return 'Success';
  }

  @Get('/features/goodbye')
  async getGBFeature(@Param('guild') guild: string) {
  	const data = await GuildDB.findOne({
  		id: guild,
  	});

  	if (data === null) return null;

  	return {
  		enabled: data?.goodbye?.enabled,
  		channel: data?.goodbye?.channel,
  		embed: data?.goodbye?.embed,
  	};
  }

  @Post('/features/goodbye')
  async enableGBFeature(@Req() req: AuthRequest, @Param('guild') guild: string) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{
  			$setOnInsert: {
  				'goodbye.enabled': true,
  			},
  		});

  	return 'Success';
  }

  @Patch('/features/goodbye')
  async updateGDFeature(
    @Req() req: AuthRequest,
    @Param('guild') guild: string,
    @Body() body: GoodbyeResponse,
  ) {
  	await this.bot.checkPermissions(req.session, guild);

  	const updated = await GuildDB.updateOne(
  		{
  			id: guild,
  		},
  		{
  			$set: {
  				'goodbye.channel': body.channel,
  				'goodbye.embed': body.embed,
  			},
  		},
  	);

  	return updated;
  }

  @Delete('/features/goodbye')
  async disableGBFeature(@Param('guild') guild: string, @Req() req: AuthRequest) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{ goodbye: { enabled: false },
  		});

  	return 'Success';
  }

  @Get('/features/tickets')
  async getTicketsFeature(@Param('guild') guild: string) {
  	const data = await GuildDB.findOne({
  		id: guild,
  	});

  	if (data === null) return null;

  	return {
  		enabled: data?.tickets?.enabled,
  		embed: data?.tickets?.embed,
  		transcriptChannel: data?.tickets?.transcriptChannel,
  		assistantRole: data?.tickets?.assistantRole,
  	};
  }

  @Post('/features/tickets')
  async enableTicketsFeature(@Req() req: AuthRequest, @Param('guild') guild: string) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{
  			id: guild,
  		},
  		{
  			$setOnInsert: {
  				'tickets.enabled': true,
  			},
  		},
  	);

  	return 'Success';
  }

  @Patch('/features/tickets')
  async updateTicketsFeature(
    @Req() req: AuthRequest,
    @Param('guild') guild: string,
    @Body() body: TicketsResponse,
  ) {
  	await this.bot.checkPermissions(req.session, guild);

  	const updated = await GuildDB.updateOne(
  		{
  			id: guild,
  		},
  		{
  			$set: {
  				'tickets.transcriptChannel': body.transcriptChannel,
  				'tickets.assistantRole': body.assistantRole,
  				'tickets.embed': body.embed,
  			},
  		},
  	);

  	return updated;
  }

  @Delete('/features/tickets')
  async disableTicketsFeature(@Param('guild') guild: string, @Req() req: AuthRequest) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{ tickets: { enabled: false },
  		});

  	return 'Success';
  }

  @Get('/features/verification')
  async getVFFeature(@Param('guild') guild: string) {
  	const data = await GuildDB.findOne({
  		id: guild,
  	});

  	if (data === null) return null;

  	return {
  		enabled: data?.verification?.enabled,
  		role: data?.verification?.role,
  	};
  }

  @Post('/features/verification')
  async enableVFFeature(@Req() req: AuthRequest, @Param('guild') guild: string) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{
  			id: guild,
  		},
  		{
  			$setOnInsert: {
  				'verification.enabled': true,
  			},
  		},
  	);

  	return 'Success';
  }

  @Patch('/features/verification')
  async updateVFFeature(
    @Req() req: AuthRequest,
    @Param('guild') guild: string,
    @Body() body: VerifyResponse,
  ) {
  	await this.bot.checkPermissions(req.session, guild);

  	const updated = await GuildDB.updateOne(
  		{ id: guild },
  		{
  			$set: {
  				'verification.role': body.role,
  			},
  		},
  	);

  	return updated;
  }

  @Delete('/features/verification')
  async disableVFFeature(@Param('guild') guild: string, @Req() req: AuthRequest) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{ verification: { enabled: false },
  		});

  	return 'Success';
  }

  @Get('/features/welcome')
  async getWLFeature(@Param('guild') guild: string) {
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
  async enableWLFeature(@Req() req: AuthRequest, @Param('guild') guild: string) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{
  			id: guild,
  		},
  		{
  			$setOnInsert: {
  				'welcome.enabled': true,
  			},
  		},
  	);

  	return 'Success';
  }

  @Patch('/features/welcome')
  async updateWLFeature(
    @Req() req: AuthRequest,
    @Param('guild') guild: string,
    @Body() body: WelcomeResponse,
  ) {
  	await this.bot.checkPermissions(req.session, guild);

  	const updated = await GuildDB.updateOne(
  		{
  			id: guild,
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
  async disableWLFeature(@Param('guild') guild: string, @Req() req: AuthRequest) {
  	await this.bot.checkPermissions(req.session, guild);

  	await GuildDB.updateOne(
  		{ id: guild },
  		{ welcome: { enabled: false },
  		});

  	return 'Success';
  }

  @Get('/channels')
  async getChannels(@Param('guild') guild: string) {
  	const channels = await this.bot.api.guilds.getChannels(guild);
  	if (channels === null) return null;

  	return [...channels.values()];
  }

  @Get('/roles')
  async getRoles(@Param('guild') guild: string) {
  	const roles = await this.bot.api.guilds.getRoles(guild);
  	if (roles === null) return null;

  	return [...roles.values()];
  }

  async getBotInfo() {
  	return await this.bot.api.users.get(process.env.CLIENT_ID);
  }
}

interface WelcomeResponse {
  channel: string;
  embed: EmbedInterface;
}

interface VerifyResponse {
  role: string;
}

interface GoodbyeResponse {
  channel: string;
  embed: EmbedInterface;
}

interface LogsResponse {
  channel: string;
}

interface ConfessionsResponse {
  channel: string;
}

interface TicketsResponse {
  transcriptChannel: string;
  assistantRole: string;
  embed: EmbedInterface;
}

interface LevelsResponse {
  channel: string;
  message: string;
}