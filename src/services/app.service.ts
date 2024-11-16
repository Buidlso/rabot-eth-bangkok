import { Injectable } from '@nestjs/common';

import { TurnkeyHelper } from '@/helpers/turnkey.helper';
import { QuickswapPoolStrategy } from '@/strategies/rabot/quickswap.strategy';

@Injectable()
export class AppService {
  constructor(
    private readonly turnkeyHelper: TurnkeyHelper,
    private readonly quickswapPoolStrategy: QuickswapPoolStrategy
  ) {}

  public async deposit(
    userWalletAddress: string,
    amount: number,
    userAerodromeAddress?: string
  ): Promise<any> {
    if (!userAerodromeAddress) {
      const walletName = `${userWalletAddress}-aerodrome-wallet`;
      const turnkeyWallet = await this.turnkeyHelper.createWallet(walletName);
      const turnkeyWalletAddress = turnkeyWallet.address;
      console.log(
        `New wallet ${turnkeyWalletAddress} created with address: ${userWalletAddress}`
      );
    }

    try {
      const signer =
        await this.turnkeyHelper.getSignerByAddress(userWalletAddress);

      console.log({ signer });

      const res = await this.quickswapPoolStrategy.deposit(signer, amount);
      console.log(res);
    } catch (error) {
      console.error('Error during deposit:', error);
    }
  }
}
