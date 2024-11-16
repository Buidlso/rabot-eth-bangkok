import type { Provider } from '@nestjs/common';

import { AnkrAdapter } from '@/adapters/ankr.adapter';
import { TurnKeyAdapter } from '@/adapters/turn-key.adapter';
export const Adapters: Provider[] = [TurnKeyAdapter, AnkrAdapter];
