import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BotEnum } from '../enums';
import { Bot } from './bot.entity';
import { Tx } from './tx.entity';
import { User } from './user.entity';

@Entity('user_bots')
export class UserBot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.userBots, { onDelete: 'SET NULL' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Bot, (rabot) => rabot.userBots, { onDelete: 'SET NULL' })
  @JoinColumn()
  bot: Bot;

  @OneToMany(() => Tx, (tx) => tx.userBot)
  txs: Tx[];

  @Column({ type: 'text' })
  botType: BotEnum;

  @Column({ type: 'text' })
  botWalletId: string;

  @Column({ type: 'text' })
  botWalletAddress: string;

  @Column({ type: 'text' })
  userWalletAddress: string;

  @Column({ type: 'text' })
  smartWalletAddress: string;

  @Column({ type: 'numeric', default: 0 })
  balance: number;

  @Column({ type: 'text', default: '0' })
  amountDeposited: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
