import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tx } from '@/domain/entities';
import type { TransactionStatusEnum } from '@/domain/enums';

@Injectable()
export class TxRepository {
  constructor(
    @InjectRepository(Tx)
    private readonly repository: Repository<Tx>
  ) {}

  public async create(tx: Tx): Promise<Tx> {
    return this.repository.save(tx);
  }

  public async createMany(txs: Tx[]): Promise<Tx[]> {
    return this.repository.save(txs);
  }

  public async findByTxHash(txHash: string): Promise<Tx | null> {
    return this.repository.findOneBy({ txHash });
  }

  public async updateTxStatus(
    id: string,
    status: TransactionStatusEnum
  ): Promise<void> {
    await this.repository.update(id, { status });
  }
}
