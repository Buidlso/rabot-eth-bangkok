import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserBot } from '@/domain/entities';

@Injectable()
export class UserBotRepository {
  constructor(
    @InjectRepository(UserBot)
    private readonly repository: Repository<UserBot>
  ) {}

  public async create(userBot: UserBot): Promise<UserBot> {
    return this.repository.save(userBot);
  }

  public async findById(id: string): Promise<UserBot | null> {
    return this.repository.findOneBy({ id });
  }

  public async findByWalletAddressAnsSmartWalletAddress(
    userWalletAddress: string,
    smartWalletAddress: string
  ): Promise<UserBot | null> {
    return this.repository.findOneBy({
      userWalletAddress,
      smartWalletAddress,
    });
  }

  public async isUserWalletAddress(walletAddress: string): Promise<boolean> {
    return await this.repository.existsBy({ userWalletAddress: walletAddress });
  }

  public async isSmartWalletAddress(walletAddress: string): Promise<boolean> {
    return await this.repository.existsBy({
      smartWalletAddress: walletAddress,
    });
  }

  public async updateAmountDeposited(
    id: string,
    balance: number
  ): Promise<void> {
    await this.repository.update(id, { balance });
  }
}
