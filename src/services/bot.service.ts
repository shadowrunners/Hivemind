import {
	Injectable,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { getUserID, PermissionFlags, UserSession } from '@/utils/discord';
import { GuildDB } from '@/schemas/guild';
import { API, GatewayIntentBits } from '@discordjs/core';
import { REST } from '@discordjs/rest';

type Feature = 'confessions' | 'antiphishing' | 'goodbye' | 'logs' | 'levelling' | 'tickets' | 'verification' | 'welcome';


@Injectable()
export class BotService {
	private readonly rest: REST;
	public readonly api: API;

	constructor() {
		this.rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
		this.api = new API(this.rest);
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
		const guild = await this.api.guilds.get(guildID) ;

		if (guild === null)
			throw new HttpException('Missing Cyberspace', HttpStatus.NOT_FOUND);

		const userID = await getUserID(user.access_token);
		const member = await this.api.guilds.getMember(guild.id, userID);

		if (
			(Number(guild.permissions) & PermissionFlags.ADMINISTRATOR) !== 0 &&
			guild?.owner_id !== member?.user?.id
		) throw new HttpException('Missing permissions', HttpStatus.BAD_REQUEST);
	}
}
