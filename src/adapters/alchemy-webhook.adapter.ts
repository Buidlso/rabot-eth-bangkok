import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alchemy, Network } from 'alchemy-sdk';

import type { TConfig } from '@/infra/config';
@Injectable()
export class AlchemyWebhookAdapter {
  private _webhookId: string;
  private _webhookAuthToken: string;
  private _alchemy: Alchemy;
  constructor(private readonly configService: ConfigService<TConfig>) {
    this.init();
    const settings = {
      authToken: this._webhookAuthToken,
      network: Network.BASE_MAINNET,
    };
    this._alchemy = new Alchemy(settings);
  }
  public async addAddressToWebhook(walletAddress: string): Promise<void> {
    await this._alchemy.notify.updateWebhook(this._webhookId, {
      addAddresses: [walletAddress],
    });
  }
  // -------------------------------PRIVATE--------------------------------- //
  private init() {
    this._webhookAuthToken = this.configService.getOrThrow<string>(
      'ALCHEMY_WEBHOOK_AUTH_TOKEN'
    );
    this._webhookId =
      this.configService.getOrThrow<string>('ALCHEMY_WEBHOOK_ID');
  }
}
