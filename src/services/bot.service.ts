import { Injectable, NotFoundException } from '@nestjs/common';

import { Bot } from '@/domain/entities';
import type { BotEnum } from '@/domain/enums';
import { BotRepository } from '@/repositories/bot.repository';
import { UserBotRepository } from '@/repositories/user-bot.repository';

@Injectable()
export class BotService {
  constructor(
    private readonly _botRepository: BotRepository,
    private readonly _userBotRepository: UserBotRepository
  ) {}

  public async create(
    name: string,
    type: BotEnum,
    description?: string,
    logo?: string,
    network?: string
  ): Promise<Bot> {
    const bot = this._createBotEntity(name, type, description, logo, network);
    return await this._botRepository.create(bot);
  }

  public async list(): Promise<Bot[]> {
    return await this._botRepository.list();
  }

  public async findById(id: string, userId: string): Promise<any> {
    const bot = await this._botRepository.findById(id);
    const userBot = await this._userBotRepository.findByUserIdAndBotId(
      id,
      userId
    );
    if (!bot) {
      this._throwBotNotFoundError();
    }
    return {
      ...bot,
      userBotSmartWalletAddress:
        userBot?.smartWalletAddress ?? 'userbotsartwalletaddress',
    };
  }

  private _createBotEntity(
    name: string,
    type: BotEnum,
    description?: string,
    logo?: string,
    network?: string
  ): Bot {
    const bot = new Bot();
    bot.name = name;
    bot.type = type;
    bot.description = description ?? null;
    bot.logo = logo ?? null;
    bot.network = network ?? null;
    return bot;
  }

  private _throwBotNotFoundError(): never {
    throw new NotFoundException('Bot not found');
  }
}
