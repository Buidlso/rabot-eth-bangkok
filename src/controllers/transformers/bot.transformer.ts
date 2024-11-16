import { z } from 'zod';

import { BotEnum } from '@/domain/enums';

export const CreateBotReqTransformer = z.object({
  name: z.string(),
  type: z.nativeEnum(BotEnum),
  description: z.string().optional(),
  logo: z.string().optional(),
  network: z.string().optional(),
});
export const CreateBotResTransformer = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(BotEnum),
  description: z.string().nullable(),
  logo: z.string().nullable(),
  network: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ListBotsTransformer = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.nativeEnum(BotEnum),
    description: z.string().nullable(),
    logo: z.string().nullable(),
    network: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);
export const GetBotResTransformer = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(BotEnum),
  description: z.string().nullable(),
  logo: z.string().nullable(),
  network: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
