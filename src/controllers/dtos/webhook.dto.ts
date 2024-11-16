import type { z } from 'zod';

import type { ListenWebhookReqTransformer } from '../transformers/webhook.transformer';

export type TListenWebhookReqDto = z.infer<typeof ListenWebhookReqTransformer>;
