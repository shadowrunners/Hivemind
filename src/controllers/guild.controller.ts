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
import { PrismaService } from '@/services/prisma.service';
import { SecureStorage } from '../utils/secureStorage';
import { BotService } from '../services/bot.service';
import { sanitize } from 'isomorphic-dompurify';
import { FastifyRequest } from 'fastify';

@Controller('/guilds/:guild')
export class GuildController {
	private guild: string;
	private secureStorage: SecureStorage;

	constructor(
		private readonly bot: BotService,
		private readonly prisma: PrismaService,
	) {
		this.secureStorage = new SecureStorage();
	}

	@Get()
	async getGuild(@Req() req: FastifyRequest['raw'], @Param('guild') guild: string): Promise<unknown> {
		this.guild = sanitize(guild);
		await this.bot.checkPermissions(req.headers.authorization, guild);

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
			console.log(_err);
			throw new HttpException('Missing Cyberspace', HttpStatus.NOT_FOUND);
		}
	}

	@Get('/features/antiphishing')
	async getAPFeature(@Param('guild') guild: string) {
		const data = await this.prisma.guilds.findFirst({
			where: {
				guildId: guild,
				antiphishing: {
					enabled: true,
				},
			},
		});

		if (!data) return null;

		return {
			enabled: data?.antiphishing?.enabled,
		};
	}

	@Post('/features/antiphishing')
	async enableAPFeature(@Req() req: FastifyRequest['raw'], @Param('guild') guild: string) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
			},
			data: {
				antiphishing: {
					enabled: true,
				},
			},
		});

		return 'Success';
	}

	@Delete('/features/antiphishing')
	async disableAPFeature(@Param('guild') guild: string, @Req() req: FastifyRequest['raw']) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				antiphishing: {
					enabled: true,
				},
			},
			data: {
				antiphishing: {
					enabled: false,
				},
			},
		});

		return 'Success';
	}

	@Get('/features/confessions')
	async getCFFeature(@Param('guild') guild: string) {
		const data = await this.prisma.guilds.findFirst({
			where: {
				guildId: guild,
				confessions: {
					enabled: true,
				},
			},
		});

		if (!data) return null;

		return {
			enabled: data?.confessions?.enabled,
			channel: data?.confessions?.channel,
		};
	}

	@Post('/features/confessions')
	async enableCFFeature(@Req() req: FastifyRequest['raw'], @Param('guild') guild: string) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				confessions: {
					enabled: false,
				},
			},
			data: {
				confessions: {
					enabled: true,
				},
			},
		});

		return 'Success';
	}

	@Patch('/features/confessions')
	async updateCFFeature(
		@Req() req: FastifyRequest['raw'],
		@Param('guild') guild: string,
		@Body() body: ConfessionsResponse,
	) {
		const data = await this.prisma.guilds.findFirst({
			where: {
				guildId: guild,
				confessions: {
					enabled: true,
				},
			},
		});

		await this.bot.checkPermissions(req.headers.authorization, guild);

		if (data?.confessions?.channel !== body.channel && data?.confessions?.webhook?.id)
			await this.bot.api.webhooks.delete(data?.confessions.webhook.id);

		const self = await this.getBotInfo();

		const webhook = await this.bot.api.channels.createWebhook(
			body.channel,
			{ name: 'Evelyn · Confessions', avatar: self.avatar },
		);

		const encryptedToken = this.secureStorage.encrypt(
			webhook.token as string,
		);

		return await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				confessions: {
					enabled: true,
				},
			},
			data: {
				confessions: {
					enabled: true,
					channel: body.channel,
					webhook: {
						id: webhook.id,
						token: encryptedToken,
					},
				},
			},
		});
	}

	@Delete('/features/confessions')
	async disableCFFeature(@Param('guild') guild: string, @Req() req: FastifyRequest['raw']) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				confessions: {
					enabled: true,
				},
			},
			data: {
				confessions: {
					enabled: false,
				},
			},
		});

		return 'Success';
	}

	@Get('/features/levelling')
	async getLVLFeature(@Param('guild') guild: string) {
		const data = await this.prisma.guilds.findFirst({
			where: {
				guildId: guild,
				levels: {
					enabled: true,
				},
			},
		});

		if (!data) return null;

		return {
			enabled: data?.levels?.enabled,
			channel: data?.levels?.channel,
			message: data?.levels?.message,
		};
	}

	@Post('/features/levelling')
	async enableLVLFeature(@Req() req: FastifyRequest['raw'], @Param('guild') guild: string) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				levels: {
					enabled: true,
				},
			},
			data: {
				levels: {
					enabled: true,
				},
			},
		});

		return 'Success';
	}

	@Patch('/features/levelling')
	async updateLVLFeature(
		@Req() req: FastifyRequest['raw'],
		@Param('guild') guild: string,
		@Body() body: LevelsResponse,
	) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		return await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				levels: {
					enabled: true,
				},
			},
			data: {
				levels: {
					enabled: true,
					channel: body.channel,
					message: body.message,
				},
			},
		});
	}

	@Delete('/features/levelling')
	async disableLVLFeature(@Param('guild') guild: string, @Req() req: FastifyRequest['raw']) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				levels: {
					enabled: true,
				},
			},
			data: {
				levels: {
					enabled: false,
				},
			},
		});

		return 'Success';
	}

	@Get('/features/logs')
	async getLogsFeature(@Param('guild') guild: string) {
		const data = await this.prisma.guilds.findFirst({
			where: {
				guildId: guild,
				logs: {
					enabled: true,
				},
			},
		});

		if (!data) return null;

		return {
			enabled: data?.logs?.enabled,
			channel: data?.logs?.channel,
		};
	}

	@Post('/features/logs')
	async enableLogsFeature(@Req() req: FastifyRequest['raw'], @Param('guild') guild: string) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				logs: {
					enabled: false,
				},
			},
			data: {
				logs: {
					enabled: true,
				},
			},
		});

		return 'Success';
	}

	@Patch('/features/logs')
	async updateLogsFeature(
		@Req() req: FastifyRequest['raw'],
		@Param('guild') guild: string,
		@Body() body: LogsResponse,
	) {
		const data = await this.prisma.guilds.findFirst({
			where: {
				guildId: guild,
				logs: {
					enabled: true,
				},
			},
		});

		await this.bot.checkPermissions(req.headers.authorization, guild);

		if (data?.confessions.channel !== body.channel && data?.logs.webhook?.id)
			await this.bot.api.webhooks.delete(data?.logs.webhook.id);

		const self = await this.getBotInfo();

		const webhook = await this.bot.api.channels.createWebhook(
			body.channel,
			{ name: 'Evelyn · Logs', avatar: self.avatar },
		);

		const encryptedToken = this.secureStorage.encrypt(
			webhook.token as string,
		);

		return await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				logs: {
					enabled: true,
				},
			},
			data: {
				logs: {
					enabled: true,
					channel: body.channel,
					webhook: {
						id: webhook.id,
						token: encryptedToken,
					},
				},
			},
		});
	}

	@Delete('/features/logs')
	async disableLogsFeature(@Param('guild') guild: string, @Req() req: FastifyRequest['raw']) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				logs: {
					enabled: true,
				},
			},
			data: {
				logs: {
					enabled: false,
				},
			},
		});

		return 'Success';
	}

	@Get('/features/goodbye')
	async getGBFeature(@Param('guild') guild: string) {
		const data = await this.prisma.guilds.findFirst({
			where: {
				guildId: guild,
				goodbye: {
					enabled: true,
				},
			},
		});

		if (!data) return null;

		return {
			enabled: data?.goodbye?.enabled,
			channel: data?.goodbye?.channel,
			embed: data?.goodbye?.embed,
		};
	}

	@Post('/features/goodbye')
	async enableGBFeature(@Req() req: FastifyRequest['raw'], @Param('guild') guild: string) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				goodbye: {
					enabled: false,
				},
			},
			data: {
				goodbye: {
					enabled: true,
				},
			},
		});

		return 'Success';
	}

	@Patch('/features/goodbye')
	async updateGDFeature(
		@Req() req: FastifyRequest['raw'],
		@Param('guild') guild: string,
		@Body() body: GoodbyeResponse,
	) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		return await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				goodbye: {
					enabled: true,
				},
			},
			data: {
				goodbye: {
					enabled: true,
					channel: body.channel,
					embed: body.embed,
				},
			},
		});
	}

	@Delete('/features/goodbye')
	async disableGBFeature(@Param('guild') guild: string, @Req() req: FastifyRequest['raw']) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				goodbye: {
					enabled: true,
				},
			},
			data: {
				goodbye: {
					enabled: false,
				},
			},
		});

		return 'Success';
	}

	@Get('/features/tickets')
	async getTicketsFeature(@Param('guild') guild: string) {
		const data = await this.prisma.guilds.findFirst({
			where: {
				guildId: guild,
				tickets: {
					enabled: true,
				},
			},
		});

		if (!data) return null;

		return {
			enabled: data?.tickets?.enabled,
			embed: data?.tickets?.embed,
			transcriptChannel: data?.tickets?.transcriptChannel,
			assistantRole: data?.tickets?.assistantRole,
		};
	}

	@Post('/features/tickets')
	async enableTicketsFeature(@Req() req: FastifyRequest['raw'], @Param('guild') guild: string) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				tickets: {
					enabled: false,
				},
			},
			data: {
				tickets: {
					enabled: true,
				},
			},
		});

		return 'Success';
	}

	@Patch('/features/tickets')
	async updateTicketsFeature(
		@Req() req: FastifyRequest['raw'],
		@Param('guild') guild: string,
		@Body() body: TicketsResponse,
	) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		return await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				tickets: {
					enabled: true,
				},
			},
			data: {
				tickets: {
					enabled: true,
					embed: body.embed,
					transcriptChannel: body.transcriptChannel,
					assistantRole: body.assistantRole,
				},
			},
		});
	}

	@Delete('/features/tickets')
	async disableTicketsFeature(@Param('guild') guild: string, @Req() req: FastifyRequest['raw']) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				tickets: {
					enabled: true,
				},
			},
			data: {
				tickets: {
					enabled: false,
				},
			},
		});

		return 'Success';
	}

	@Get('/features/verification')
	async getVFFeature(@Param('guild') guild: string) {
		const data = await this.prisma.guilds.findFirst({
			where: {
				guildId: guild,
				verification: {
					enabled: true,
				},
			},
		});

		if (!data) return null;

		return {
			enabled: data?.verification?.enabled,
			role: data?.verification?.role,
		};
	}

	@Post('/features/verification')
	async enableVFFeature(@Req() req: FastifyRequest['raw'], @Param('guild') guild: string) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				verification: {
					enabled: false,
				},
			},
			data: {
				verification: {
					enabled: true,
				},
			},
		});

		return 'Success';
	}

	@Patch('/features/verification')
	async updateVFFeature(
		@Req() req: FastifyRequest['raw'],
		@Param('guild') guild: string,
		@Body() body: VerifyResponse,
	) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		return await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				verification: {
					enabled: true,
				},
			},
			data: {
				verification: {
					enabled: true,
					role: body.role,
				},
			},
		});
	}

	@Delete('/features/verification')
	async disableVFFeature(@Param('guild') guild: string, @Req() req: FastifyRequest['raw']) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				verification: {
					enabled: true,
				},
			},
			data: {
				verification: {
					enabled: false,
				},
			},
		});

		return 'Success';
	}

	@Get('/features/welcome')
	async getWLFeature(@Param('guild') guild: string) {
		const data = await this.prisma.guilds.findFirst({
			where: {
				guildId: guild,
				welcome: {
					enabled: true,
				},
			},
		});

		if (!data) return null;

		return {
			enabled: data?.welcome?.enabled,
			channel: data?.welcome?.channel,
			embed: data?.welcome?.embed,
		};
	}

	@Post('/features/welcome')
	async enableWLFeature(@Req() req: FastifyRequest['raw'], @Param('guild') guild: string) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				welcome: {
					enabled: false,
				},
			},
			data: {
				welcome: {
					enabled: true,
				},
			},
		});

		return 'Success';
	}

	@Patch('/features/welcome')
	async updateWLFeature(
		@Req() req: FastifyRequest['raw'],
		@Param('guild') guild: string,
		@Body() body: WelcomeResponse,
	) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		return await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				welcome: {
					enabled: true,
				},
			},
			data: {
				welcome: {
					enabled: true,
					channel: body.channel,
					embed: body.embed,
				},
			},
		});
	}

	@Delete('/features/welcome')
	async disableWLFeature(@Param('guild') guild: string, @Req() req: FastifyRequest['raw']) {
		await this.bot.checkPermissions(req.headers.authorization, guild);

		await this.prisma.guilds.updateMany({
			where: {
				guildId: guild,
				welcome: {
					enabled: true,
				},
			},
			data: {
				welcome: {
					enabled: false,
				},
			},
		});

		return 'Success';
	}

	@Get('/channels')
	async getChannels(@Param('guild') guild: string) {
		const channels = await this.bot.api.guilds.getChannels(guild);
		if (!channels) return null;

		return [...channels.values()];
	}

	@Get('/roles')
	async getRoles(@Param('guild') guild: string) {
		const roles = await this.bot.api.guilds.getRoles(guild);
		if (!roles) return null;

		return [...roles.values()];
	}

	async getBotInfo() {
		return await this.bot.api.users.get(process.env.CLIENT_ID);
	}
}

interface BaseResponse {
	enabled: boolean;
}

interface WelcomeResponse extends BaseResponse {
  channel: string;
  embed: EmbedInterface;
}

interface VerifyResponse extends BaseResponse {
  role: string;
}

interface GoodbyeResponse extends BaseResponse {
  channel: string;
  embed: EmbedInterface;
}

interface LogsResponse extends BaseResponse {
  channel: string;
}

interface ConfessionsResponse extends BaseResponse {
  channel: string;
}

interface TicketsResponse extends BaseResponse {
  transcriptChannel: string;
  assistantRole: string;
  embed: EmbedInterface;
}

interface LevelsResponse extends BaseResponse {
  channel: string;
  message: string;
}

export interface EmbedInterface {
	/** The message that will be sent alongside the embed. If defined, that is otherwise it doesn't do shit. */
	content: string;
	/** The title of the embed. */
	title: string;
	/** The description of the embed. */
	description: string;
	/** The color of the embed. */
	color: `#${string}`;
	/** The author object. */
	author: {
		/** The name of the author. */
		name: string;
		/** The icon URL of the author. */
		icon_url: string;
	};
	/** The image URL. */
	image: string;
	/** The URL of the thumbnail.*/
	thumbnail: string;
	/** The footer object. */
	footer: {
		/** The text of the footer. */
		text: string;
		/** The icon URL of the footer. */
		icon_url: string;
	};
}