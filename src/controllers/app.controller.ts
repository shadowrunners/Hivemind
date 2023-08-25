import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
	getHello(): string {
		return 'Why are you here? Shouldn\'t you be somewhere else?';
	}
}
