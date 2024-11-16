import { TurnkeySigner } from '@turnkey/ethers';
import type { TurnkeyApiClient } from '@turnkey/sdk-server';
import { DEFAULT_ETHEREUM_ACCOUNTS, Turnkey } from '@turnkey/sdk-server';

export class TurnkeyHelper {
  private readonly turnKeyOrgId: string;
  private readonly turnKeyApiClient: TurnkeyApiClient;

  constructor(private readonly configService) {
    this.turnKeyOrgId = '';
    this.turnKeyApiClient = this.getTurnKeyApiClient();
  }

  public async createWallet(walletName: string): Promise<any> {
    const walletResponse = await this.turnKeyApiClient.createWallet({
      walletName,
      accounts: DEFAULT_ETHEREUM_ACCOUNTS,
    });
    const turnkeyWallet: any = {
      id: walletResponse.walletId,
      address: walletResponse.addresses?.[0],
    };
    return turnkeyWallet;
  }

  public async getSignerByAddress(
    walletAddress: string
  ): Promise<TurnkeySigner> {
    const turnkeySigner = new TurnkeySigner({
      client: this.turnKeyApiClient,
      signWith: walletAddress,
      organizationId: this.turnKeyOrgId,
    });
    return turnkeySigner;
  }

  // -------------------------------PRIVATE--------------------------------- //

  private getTurnKeyApiClient(): TurnkeyApiClient {
    const turnKeyApiUrl = '';
    const turnKeyApiPrivateKey = '';
    const turnKeyApiPublicKey = '';
    const turnkey = new Turnkey({
      apiBaseUrl: turnKeyApiUrl,
      apiPrivateKey: turnKeyApiPrivateKey,
      apiPublicKey: turnKeyApiPublicKey,
      defaultOrganizationId: this.turnKeyOrgId,
    });

    return turnkey.apiClient();
  }
}
