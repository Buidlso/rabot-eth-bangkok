import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BotEnum } from '../enums';
import { UserBot } from './user-bot.entity';

@Entity('bots')
export class Bot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => UserBot, (userBot) => userBot.bot)
  userBots: UserBot[];

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  type: BotEnum;

  @Column({ type: 'text', nullable: true, default: null })
  description: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  logo: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  network: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
