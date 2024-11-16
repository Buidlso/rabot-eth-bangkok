import type { Provider } from '@nestjs/common';

import { BotRepository } from '@/repositories/bot.repository';
import { TxRepository } from '@/repositories/tx.repository';
import { UserRepository } from '@/repositories/user.repository';
import { UserBotRepository } from '@/repositories/user-bot.repository';

export const Repositories: Provider[] = [
  UserRepository,
  BotRepository,
  UserBotRepository,
  TxRepository,
];
