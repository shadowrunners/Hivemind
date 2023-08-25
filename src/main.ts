require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WEB_URL } from '@/config';
import { connect } from 'mongoose';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.setGlobalPrefix('/api');

	app.enableCors({
		credentials: true,
		maxAge: 40,
		origin: WEB_URL,
		allowedHeaders: ['Content-Type', 'Authorization'],
		methods: ['GET', 'HEAD', 'POST', 'DELETE', 'PATCH'],
	});

	connect(process.env.DATABASE_URL)
	  .then(() => console.log('Archie has connected to the database.'))
	  .catch((err) => console.log(err));

	await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
