import { z } from 'zod';

// export const ListenWebhookReqTransformer = z
//   .object({
//     id: z.string(),
//     createdAt: z.coerce.date(),
//     type: z.string(),
//     event: z.object({
//       network: z.string(),
//       activity: z.array(
//         z.object({
//           fromAddress: z.string(),
//           toAddress: z.string(),
//           blockNum: z.string(),
//           hash: z.string(),
//           value: z.number(),
//           asset: z.string(),
//           category: z.string(),
//           rawContract: z.object({
//             rawValue: z.string(),
//             address: z.string().optional(),
//             decimals: z.number(),
//           }),
//           log: z
//             .object({
//               address: z.string().optional(),
//               topics: z.array(z.string()).optional(),
//               data: z.string().optional(),
//               blockNumber: z.string().optional(),
//               transactionHash: z.string().optional(),
//               transactionIndex: z.string().optional(),
//               blockHash: z.string().optional(),
//               logIndex: z.string().optional(),
//               removed: z.boolean().optional(),
//             })
//             .optional(),
//         })
//       ),
//     }),
//   })
//   .transform((data) => {
//     const activity = data.event.activity[0];
//     return {
//       fromAddress: activity?.fromAddress,
//       toAddress: activity?.toAddress,
//       transactionHash: activity?.hash,
//       amount: activity?.value,
//       asset: activity?.asset,
//     };
//   });
export const ListenWebhookReqTransformer = z.object({
  fromAddress: z.string(),
  toAddress: z.string(),
  transactionHash: z.string(),
  value: z.number(),
  asset: z.string(),
});
