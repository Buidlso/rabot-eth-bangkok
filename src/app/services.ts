import type { Provider } from '@nestjs/common';

import { BotService } from '@/services/bot.service';
import { TxService } from '@/services/tx.service';
import { UserService } from '@/services/user.service';
import { UserBotService } from '@/services/user-bot.service';
import { WebhookService } from '@/services/webhook.service';

export const Services: Provider[] = [
  UserService,
  BotService,
  UserBotService,
  WebhookService,
  TxService,
];
