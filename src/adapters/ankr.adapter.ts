import type { GetAccountBalanceReply } from '@ankr.com/ankr.js';
import { AnkrProvider } from '@ankr.com/ankr.js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { TConfig } from '@/infra/config';
@Injectable()
export class AnkrAdapter {
  private readonly _ankrRpc: string;
  private readonly _ankrProvider: AnkrProvider;
  constructor(private readonly _configService: ConfigService<TConfig>) {
    this._ankrRpc = this._configService.getOrThrow<string>(
      'ANKR_RPC_PROVIDER_URL'
    );
    this._ankrProvider = new AnkrProvider(this._ankrRpc);
  }
  public async getBalances(
    walletAddress: string
  ): Promise<GetAccountBalanceReply> {
    const accountBalance = this._ankrProvider.getAccountBalance({
      walletAddress,
      blockchain: ['polygon', 'arbitrum', 'base'],
    });
    return accountBalance;
  }
}
