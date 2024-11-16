import type { BiconomySmartAccountV2 } from '@biconomy/account';
import { createSmartAccountClient, PaymasterMode } from '@biconomy/account';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TurnkeySigner } from '@turnkey/ethers';

import type { TSmartWalletTx } from '@/domain';
import type { TConfig } from '@/infra/config';

@Injectable()
export class SmartAccountHelper {
  private readonly bundlerUrl: string;
  private readonly biconomyPaymasterApiKey: string;

  constructor(private readonly configService: ConfigService<TConfig>) {
    this.bundlerUrl = this.configService.getOrThrow<string>(
      'BICONOMY_BUNDLER_URL'
    );
    this.biconomyPaymasterApiKey = this.configService.getOrThrow<string>(
      'BICONOMY_PAYMASTER_API_KEY'
    );
  }

  public async getSmartAccount(
    signer: TurnkeySigner
  ): Promise<BiconomySmartAccountV2> {
    return await createSmartAccountClient({
      signer,
      bundlerUrl: this.bundlerUrl,
      biconomyPaymasterApiKey: this.biconomyPaymasterApiKey,
    });
  }

  public async performSmartWalletTxs(
    smartWallet: BiconomySmartAccountV2,
    ...txs: TSmartWalletTx[]
  ): Promise<string | undefined> {
    try {
      const userOpResponse = await smartWallet.buildUserOp(txs, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
      });
      console.log(userOpResponse)
      return " ";
      const response = await smartWallet.sendUserOp(userOpResponse);
      const { receipt } = await response.wait(1);
      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Error performing smart wallet txs: ${error}`);
    }
  }
}
