import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TransactionOwnerEnum, TransactionStatusEnum } from '../enums';
import { UserBot } from './user-bot.entity';

@Entity('txs')
export class Tx {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserBot, (userBot) => userBot.txs)
  @JoinColumn()
  userBot: UserBot;

  @Column({ type: 'text' })
  txHash: string;

  @Column({ type: 'text' })
  batchId: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text' })
  from: TransactionOwnerEnum;

  @Column({ type: 'text' })
  to: TransactionOwnerEnum;

  @Column({ type: 'text' })
  fromAddress: string;

  @Column({ type: 'text' })
  toAddress: string;

  @Column({ type: 'text', default: TransactionStatusEnum.QUEUED })
  status: TransactionStatusEnum;

  @Column({ type: 'numeric', default: 0 })
  amount: number;

  @Column({ type: 'text', nullable: true, default: null })
  currency: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  network: string | null;

  @Column({ type: 'numeric', default: 0 })
  gas: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
