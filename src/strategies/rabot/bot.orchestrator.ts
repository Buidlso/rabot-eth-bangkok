import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { TurnkeySigner } from '@turnkey/ethers';

import type { BotEnum } from '@/domain/enums';

import { AerodromeRabotStrategy } from './aerodrome.strategy';
import type { IBotStrategy } from './bot.strategy.interface';

@Injectable()
export class BotOrchestrator {
  private _botMap: Map<BotEnum, IBotStrategy>;
  private _bots: IBotStrategy[];
  constructor(private readonly aerodromeRabotStrategy: AerodromeRabotStrategy) {
    this._botMap = new Map<BotEnum, IBotStrategy>();
    this._bots = [this.aerodromeRabotStrategy];
    this.registerRabots();
  }

  public async deposit(
    bot: BotEnum,
    signer: TurnkeySigner,
    amount: number
  ): Promise<string | undefined> {
    const rabotStrategy = this.getRabotStrategy(bot);
    return await rabotStrategy.deposit(signer, amount);
  }

  public getContractAddress(rabot: BotEnum): string {
    const rabotStrategy = this.getRabotStrategy(rabot);
    return rabotStrategy.getContractAddress();
  }

  public getDepositTxOrder(rabot: BotEnum): string[] {
    const rabotStrategy = this.getRabotStrategy(rabot);
    return rabotStrategy.getDepositTxOrder();
  }

  public getWithdrawTxOrder(rabot: BotEnum): string[] {
    const rabotStrategy = this.getRabotStrategy(rabot);
    return rabotStrategy.getWithdrawTxOrder();
  }

  public async withdraw(
    rabot: BotEnum,
    rabbleWalletAddress: string,
    signer: TurnkeySigner,
    amount: string
  ): Promise<string | undefined> {
    const rabotStrategy = this.getRabotStrategy(rabot);
    return await rabotStrategy.withdraw(signer, rabbleWalletAddress, amount);
  }

  public async getStakedBalance(rabot: BotEnum, signer: TurnkeySigner) {
    const rabotStrategy = this.getRabotStrategy(rabot);
    return rabotStrategy.getStakedBalance(signer);
  }

  private getRabotStrategy(rabot: BotEnum): IBotStrategy {
    const rabotStrategy = this._botMap.get(rabot);
    if (!rabotStrategy) {
      throw new InternalServerErrorException(`Rabot ${rabot} not found`);
    }
    return rabotStrategy;
  }

  private registerRabots(): void {
    this._bots.forEach((rabot) => {
      this._botMap.set(rabot.getRabot(), rabot);
    });
  }
}
