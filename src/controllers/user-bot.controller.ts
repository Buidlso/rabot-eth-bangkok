import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { UserBotService } from '@/services/user-bot.service';

import type { TCreateUserBotResDto } from './dtos/user-bot.dto';
import { TCreateUserBotReqDto } from './dtos/user-bot.dto';
import {
  CreateUserBotReqTransformer,
  CreateUserBotResTransformer,
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
}
