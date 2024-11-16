import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { WebhookService } from '@/services/webhook.service';

import { TListenWebhookReqDto } from './dtos/webhook.dto';
import { ListenWebhookReqTransformer } from './transformers/webhook.transformer';

@Controller('webhook')
export class WebHookController {
  constructor(private readonly _webhookService: WebhookService) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  public async listenWebhook(@Body() dto: TListenWebhookReqDto): Promise<void> {
    const { amount, asset, fromAddress, toAddress, transactionHash } =
      await ListenWebhookReqTransformer.parseAsync(dto);
    await this._webhookService.listenWebhook(
      fromAddress,
      toAddress,
      transactionHash,
      amount,
      asset
    );
  }
}
