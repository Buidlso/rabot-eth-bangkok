import { Injectable } from '@nestjs/common';
import Web3 from 'web3';

import { TransactionOwnerEnum, TransactionStatusEnum } from '@/domain/enums';
import { CryptoHelper } from '@/helpers/crypto.helper';
import { TxRepository } from '@/repositories/tx.repository';
import { UserBotRepository } from '@/repositories/user-bot.repository';

import { TxService } from './tx.service';
import { UserBotService } from './user-bot.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly _userBotRepository: UserBotRepository,
    private readonly _txRepository: TxRepository,
    private readonly _cryptpHelper: CryptoHelper,
    private readonly _txService: TxService,
    private readonly _userBotService: UserBotService
  ) {}

  public async listenWebhook(
    fromAddress: string,
    toAddress: string,
    transactionHash: string,
    amount: number,
    asset: string
  ): Promise<void> {
    const checksumFrom = Web3.utils.toChecksumAddress(fromAddress);
    const checksumTo = Web3.utils.toChecksumAddress(toAddress);
    const isValidTransaction = await this._isValidTransaction(
      checksumFrom,
      checksumTo
    );
    if (!isValidTransaction) {
      return;
    }
    await this._processTransaction(
      checksumFrom,
      checksumTo,
      transactionHash,
      amount,
      asset
    );
  }

  private async _isValidTransaction(
    fromAddress: string,
    toAddress: string
  ): Promise<boolean> {
    const [isUserWalletAddress, isSmartWalletAddress] = await Promise.all([
      this._userBotRepository.isUserWalletAddress(fromAddress),
      this._userBotRepository.isSmartWalletAddress(toAddress),
    ]);
    return isUserWalletAddress && isSmartWalletAddress;
  }

  private async _processTransaction(
    fromAddress: string,
    toAddress: string,
    transactionHash: string,
    amount: number,
    asset: string
  ): Promise<void> {
    const userBot =
      await this._userBotRepository.findByWalletAddressAnsSmartWalletAddress(
        fromAddress,
        toAddress
      );
    if (!userBot) return;
    const tx = await this._txRepository.findByTxHash(transactionHash);
    if (tx?.status === TransactionStatusEnum.COMPLETED) return;
    const batchId = tx?.batchId ?? this._cryptpHelper.genUUID();
    if (tx?.status === TransactionStatusEnum.QUEUED) {
      await this._txRepository.updateTxStatus(
        tx.id,
        TransactionStatusEnum.COMPLETED
      );
    } else {
      await this._createTransaction(
        userBot.id,
        batchId,
        fromAddress,
        toAddress,
        transactionHash,
        amount,
        asset
      );
    }
    await this._userBotService.deposit(
      userBot.id,
      batchId,
      userBot.botType,
      amount
    );
  }

  private async _createTransaction(
    userBotId: string,
    batchId: string,
    fromAddress: string,
    toAddress: string,
    transactionHash: string,
    amount: number,
    asset: string
  ): Promise<void> {
    await this._txService.create(
      userBotId,
      batchId,
      transactionHash,
      amount,
      'TRANSFER',
      TransactionOwnerEnum.USER,
      TransactionOwnerEnum.BOT,
      fromAddress,
      toAddress,
      0,
      asset
    );
  }
}
