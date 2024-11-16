import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TurnkeySigner } from '@turnkey/ethers';
import type { TurnkeyApiClient } from '@turnkey/sdk-server';
import { DEFAULT_ETHEREUM_ACCOUNTS, Turnkey } from '@turnkey/sdk-server';

import type { TTurnKeyWallet } from '@/domain';
import type { TConfig } from '@/infra/config';

@Injectable()
export class TurnKeyAdapter {
  private readonly logger = new Logger(TurnKeyAdapter.name);
  private readonly turnKeyOrgId: string;
  private readonly turnKeyApiClient: TurnkeyApiClient;

  constructor(private readonly configService: ConfigService<TConfig>) {
    this.turnKeyOrgId = this.configService.getOrThrow<string>(
      'TURNKEY_ORGANIZATION_ID'
    );
    this.turnKeyApiClient = this.getTurnKeyApiClient();
  }

  public async createWallet(walletName: string): Promise<TTurnKeyWallet> {
    this.logger.log(`Creating Turn Key wallet with name: ${walletName}`);
    const walletResponse = await this.turnKeyApiClient.createWallet({
      walletName,
      accounts: DEFAULT_ETHEREUM_ACCOUNTS,
    });
    this.logger.log(`Turn Key wallet created successfully`);
    const turnkeyWallet: TTurnKeyWallet = {
      id: walletResponse.walletId,
      address: walletResponse.addresses?.[0],
    };
    return turnkeyWallet;
  }

  public async getSignerByAddress(
    walletAddress: string
  ): Promise<TurnkeySigner> {
    this.logger.log(`Getting Turn Key signer for wallet: ${walletAddress}`);
    const turnkeySigner = new TurnkeySigner({
      client: this.turnKeyApiClient,
      signWith: walletAddress,
      organizationId: this.turnKeyOrgId,
    });
    return turnkeySigner;
  }

  // -------------------------------PRIVATE--------------------------------- //

  private getTurnKeyApiClient(): TurnkeyApiClient {
    const turnKeyApiUrl =
      this.configService.getOrThrow<string>('TURNKEY_API_URL');
    const turnKeyApiPrivateKey = this.configService.getOrThrow<string>(
      'TURNKEY_API_PRIVATE_KEY'
    );
    const turnKeyApiPublicKey = this.configService.getOrThrow<string>(
      'TURNKEY_API_PUBLIC_KEY'
    );

    const turnkey = new Turnkey({
      apiBaseUrl: turnKeyApiUrl,
      apiPrivateKey: turnKeyApiPrivateKey,
      apiPublicKey: turnKeyApiPublicKey,
      defaultOrganizationId: this.turnKeyOrgId,
    });

    return turnkey.apiClient();
  }
}
