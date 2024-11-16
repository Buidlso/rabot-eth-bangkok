import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { BotService } from '@/services/bot.service';

import type { TCreateBotResDto } from './dtos/bot.dto';
import { TCreateBotReqDto } from './dtos/bot.dto';
import {
  CreateBotReqTransformer,
  CreateBotResTransformer,
} from './transformers/bot.transformer';

@Controller('bots')
export class BotController {
  constructor(private readonly _botService: BotService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createBot(
    @Body() dto: TCreateBotReqDto
  ): Promise<TCreateBotResDto> {
    const { name, type, description, logo, network } =
      await CreateBotReqTransformer.parseAsync(dto);
    const bot = await this._botService.create(
      name,
      type,
      description,
      logo,
      network
    );
    return await CreateBotResTransformer.parseAsync(bot);
  }
}
