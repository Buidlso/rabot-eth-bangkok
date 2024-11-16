import type { Type } from '@nestjs/common/interfaces';

import { BotController } from '@/controllers/bot.controller';
import { UserController } from '@/controllers/user.controller';
import { UserBotController } from '@/controllers/user-bot.controller';
import { WebHookController } from '@/controllers/webhook.controller';

export const Controllers: Type<any>[] = [
  UserController,
  BotController,
  UserBotController,
  WebHookController,
];
