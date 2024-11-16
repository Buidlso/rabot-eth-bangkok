import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserBot } from './user-bot.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => UserBot, (userBot) => userBot.user)
  userBots: UserBot[];

  @Column({ type: 'text', nullable: true, default: null })
  email: string;

  @Column({ type: 'text' })
  uid: string;

  @Column({ type: 'text' })
  walletAddress: string;

  @Column({ type: 'text', nullable: true, default: null })
  name: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
