import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import { BotService } from '@/services/bot.service';

import type {
  TCreateBotResDto,
  TGetBotResDto,
  TListBotsResDto,
} from './dtos/bot.dto';
import { TCreateBotReqDto } from './dtos/bot.dto';
import {
  CreateBotReqTransformer,
  CreateBotResTransformer,
  GetBotResTransformer,
  ListBotsTransformer,
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

  @HttpCode(HttpStatus.OK)
  @Get()
  public async listBots(): Promise<TListBotsResDto> {
    const bots = await this._botService.list();
    return await ListBotsTransformer.parseAsync(bots);
  }
  @HttpCode(HttpStatus.OK)
  @Get(':id/user/:userId')
  public async getBot(
    @Param('id') id: string,
    @Param('userId') userId: string
  ): Promise<TGetBotResDto> {
    const bot = await this._botService.findById(id, userId);
    return await GetBotResTransformer.parseAsync(bot);
  }
}
