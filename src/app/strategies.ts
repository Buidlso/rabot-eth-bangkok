import type { Provider } from '@nestjs/common';

import { AerodromeRabotStrategy, BotOrchestrator } from '@/strategies/rabot';
import { QuickswapPoolStrategy } from '@/strategies/rabot/quickswap.strategy';

export const Strategies: Provider[] = [
  QuickswapPoolStrategy,
  AerodromeRabotStrategy,
  BotOrchestrator,
];
