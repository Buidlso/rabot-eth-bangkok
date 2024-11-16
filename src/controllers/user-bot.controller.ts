import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import { UserBotService } from '@/services/user-bot.service';

import type {
  TCreateUserBotResDto,
  TGetUserBotResDto,
  TListUserBotsResDto,
} from './dtos/user-bot.dto';
import { TCreateUserBotReqDto } from './dtos/user-bot.dto';
import {
  CreateUserBotReqTransformer,
  CreateUserBotResTransformer,
  GetUserBotResTransformer,
  ListUserBotsResTransformer,
} from './transformers/user-bot.transformer';

@Controller('user-bots')
export class UserBotController {
  constructor(private readonly _userBotService: UserBotService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createBot(
    @Body() dto: TCreateUserBotReqDto
  ): Promise<TCreateUserBotResDto> {
    const { botId, userId } = await CreateUserBotReqTransformer.parseAsync(dto);
    const userBot = await this._userBotService.create(userId, botId);
    return await CreateUserBotResTransformer.parseAsync(userBot);
  }

  @HttpCode(HttpStatus.OK)
  @Get('users/:userId')
  public async listUserBots(
    @Param('userId') userId: string
  ): Promise<TListUserBotsResDto> {
    const userBots = await this._userBotService.listByUserId(userId);
    return await ListUserBotsResTransformer.parseAsync(userBots);
  }
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  public async getUserBot(@Param('id') id: string): Promise<TGetUserBotResDto> {
    const userBot = await this._userBotService.findById(id);
    return await GetUserBotResTransformer.parseAsync(userBot);
  }
}
