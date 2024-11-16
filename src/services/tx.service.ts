import { Injectable } from '@nestjs/common';

import type { UserBot } from '@/domain/entities';
import { Tx } from '@/domain/entities';
import {
  type TransactionOwnerEnum,
  TransactionStatusEnum,
} from '@/domain/enums';
import { TxRepository } from '@/repositories/tx.repository';

@Injectable()
export class TxService {
  constructor(private readonly _txRepository: TxRepository) {}

  public async create(
    userBotId: string,
    batchId: string,
    txHash: string,
    amount: number,
    type: string,
    from: TransactionOwnerEnum,
    to: TransactionOwnerEnum,
    fromAddress: string,
    toAddress: string,
    gas: number = 0,
    currency?: string,
    network?: string
  ): Promise<Tx> {
    const tx = this._createTxEntity(
      userBotId,
      batchId,
      txHash,
      amount,
      type,
      from,
      to,
      fromAddress,
      toAddress,
      gas,
      currency,
      network
    );
    return await this._txRepository.create(tx);
  }

  private _createTxEntity(
    userBotId: string,
    batchId: string,
    txHash: string,
    amount: number,
    type: string,
    from: TransactionOwnerEnum,
    to: TransactionOwnerEnum,
    fromAddress: string,
    toAddress: string,
    gas: number = 0,
    currency?: string,
    network?: string
  ): Tx {
    const tx = new Tx();
    tx.userBot = { id: userBotId } as UserBot;
    tx.batchId = batchId;
    tx.txHash = txHash;
    tx.amount = amount;
    tx.type = type;
    tx.status = TransactionStatusEnum.QUEUED;
    tx.from = from;
    tx.to = to;
    tx.fromAddress = fromAddress;
    tx.toAddress = toAddress;
    tx.currency = currency ?? null;
    tx.network = network ?? null;
    tx.gas = gas;
    return tx;
  }
}
