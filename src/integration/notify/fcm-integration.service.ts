import { Injectable } from '@nestjs/common';
import {
  DataMessagePayload,
  MessagingPayload,
} from 'firebase-admin/lib/messaging/messaging-api';
import { FcmService } from 'nestjs-fcm';

@Injectable()
export class FcmIntegrationService {
  constructor(private readonly fcmService: FcmService) {}

  async send(
    token: string,
    title: string,
    body: string,
    data?: DataMessagePayload,
  ): Promise<void> {
    const payload: MessagingPayload = {
      notification: {
        title,
        body,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default',
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        ...data,
      },

    };
    console.log('token', token)
    const res = await this.fcmService.sendNotification([token], payload, false);
    console.log(res)
  }
}
