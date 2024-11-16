import { z } from 'zod';

import { BotEnum } from '@/domain/enums';

export const CreateUserBotReqTransformer = z.object({
  userId: z.string(),
  botId: z.string(),
});
export const CreateUserBotResTransformer = z.object({
  id: z.string(),
  botType: z.nativeEnum(BotEnum),
  botWalletId: z.string(),
  botWalletAddress: z.string(),
  userWalletAddress: z.string(),
  smartWalletAddress: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ListUserBotsResTransformer = z.array(
  z.object({
    id: z.string(),
    botType: z.nativeEnum(BotEnum),
    botWalletId: z.string(),
    botWalletAddress: z.string(),
    userWalletAddress: z.string(),
    smartWalletAddress: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);
export const GetUserBotResTransformer = z.object({
  id: z.string(),
  botType: z.nativeEnum(BotEnum),
  botWalletId: z.string(),
  botWalletAddress: z.string(),
  userWalletAddress: z.string(),
  smartWalletAddress: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const WithdrawFromUserBotReqTransformer = z.object({
  amountInPercentage: z.number().min(1).max(100),
  currency: z.string().optional(),
  network: z.string().optional(),
});
export const WithdrawFromUserBotResTransformer = z.object({
  tx: z.string(),
});

