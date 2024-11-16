import type { Provider } from '@nestjs/common';

import { AlchemyWebhookAdapter } from '@/adapters/alchemy-webhook.adapter';
import { AnkrAdapter } from '@/adapters/ankr.adapter';
import { TurnKeyAdapter } from '@/adapters/turn-key.adapter';
export const Adapters: Provider[] = [
  TurnKeyAdapter,
  AlchemyWebhookAdapter,
  AnkrAdapter,
];
