import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AnotaAiService } from './anota-ai.service';

@Controller('anota-ai')
export class AnotaAiController {
  constructor(private readonly anotaAiService: AnotaAiService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      integration: 'anota-ai',
    };
  }

  @Post('webhook')
  @HttpCode(200)
  async receiveWebhook(@Body() payload: any) {
    return this.anotaAiService.processWebhook(payload);
  }
}
