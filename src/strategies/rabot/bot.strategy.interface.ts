import type { TurnkeySigner } from '@turnkey/ethers';

import type { BotEnum } from '@/domain/enums';

export interface IBotStrategy {
  getRabot(): BotEnum;
  deposit(signer: TurnkeySigner, amount: number): Promise<string | undefined>;
  withdraw(
    signer: TurnkeySigner,
    rabbleWalletAddress: string,
    amount: string
  ): Promise<string | undefined>;
  getContractAddress(): string;
  getDepositTxOrder(): string[];
  getWithdrawTxOrder(): string[];
  getStakedBalance(signer: TurnkeySigner): Promise<bigint>;
}
