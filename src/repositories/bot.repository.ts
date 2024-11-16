import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Bot } from '@/domain/entities';

@Injectable()
export class BotRepository {
  constructor(
    @InjectRepository(Bot)
    private readonly repository: Repository<Bot>
  ) {}

  public async create(bot: Bot): Promise<Bot> {
    return this.repository.save(bot);
  }

  public async findById(id: string): Promise<Bot | null> {
    return this.repository.findOneBy({ id });
  }

  public async listByUserId(userId: string): Promise<Bot[]> {
    return this.repository.findBy({ userBots: { id: userId } });
  }
}
