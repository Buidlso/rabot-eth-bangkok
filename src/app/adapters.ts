import type { Provider } from '@nestjs/common';

import { TurnKeyAdapter } from '@/adapters/turn-key.adapter';

export const Adapters: Provider[] = [TurnKeyAdapter];
