import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { getUserId, PermissionFlags } from '../utils/discord';
import { PrismaService } from './prisma.service';
import { REST } from '@discordjs/rest';
import { API } from '@discordjs/core';
import { config } from 'dotenv';

config();

@Injectable()
export class BotService {
	private readonly rest: REST;
	public readonly api: API;

	constructor(private prisma: PrismaService) {
		this.rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);
		this.api = new API(this.rest);
	}

	public async getEnabledFeatures(guild: string): Promise<Feature[]> {
		const features: Feature[] = [];
		const getFeatures = await this.prisma.guilds.count({
			where: {
				guildId: guild,
			},
		});

		if (getFeatures !== 0)
			features.push('confessions', 'antiphishing', 'goodbye', 'logs', 'levelling', 'tickets', 'verification', 'welcome');

		return features;
	}

	public getToken(auth: string | undefined | null): string | undefined {
		if (!auth) return undefined;
		return auth.slice(7).trim();
	}

	public async checkPermissions(token: string | undefined | null, guildID: string) {
		const guild = await this.api.guilds.get(guildID);

		if (guild === null)
			throw new HttpException('Missing Cyberspace', HttpStatus.NOT_FOUND);

		const accessToken = this.getToken(token);
		const userId = await getUserId(accessToken) as string;
		const member = await this.api.guilds.getMember(guild.id, userId);

		if (
			(Number(guild.permissions) & PermissionFlags.ADMINISTRATOR) !== 0 &&
			guild?.owner_id !== member?.user?.id
		) throw new HttpException('Missing permissions', HttpStatus.BAD_REQUEST);
	}
}

type Feature = 'confessions' | 'antiphishing' | 'goodbye' | 'logs' | 'levelling' | 'tickets' | 'verification' | 'welcome';