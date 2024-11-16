import { z } from 'zod';

export const CreateUserReqTransformer = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  walletAddress: z.string(),
});
export const CreateUserResTransformer = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  walletAddress: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
