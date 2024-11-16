import { Injectable, NotFoundException } from '@nestjs/common';

import { Bot } from '@/domain/entities';
import type { BotEnum } from '@/domain/enums';
import { BotRepository } from '@/repositories/bot.repository';

@Injectable()
export class BotService {
  constructor(private readonly _botRepository: BotRepository) {}

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

  public async findById(id: string): Promise<Bot> {
    const bot = await this._botRepository.findById(id);
    if (!bot) {
      this._throwBotNotFoundError();
    }
    return bot;
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
