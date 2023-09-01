require('dotenv').config();
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { connect } from 'mongoose';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

	app.setGlobalPrefix('/api');

	app.enableCors({
		credentials: true,
		maxAge: 40,
		origin: process.env.WEB_URL,
		allowedHeaders: ['Content-Type', 'Authorization'],
		methods: ['GET', 'HEAD', 'POST', 'DELETE', 'PATCH'],
	});

	connect(process.env.DATABASE_URL).then(() => console.log('Archie has connected to the database.')).catch((err) => console.log(err));

	await app.listen(process.env.PORT ?? 8080, '0.0.0.0');
}
bootstrap();
