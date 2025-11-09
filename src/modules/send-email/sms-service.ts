// src/sms/sms.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey = process.env.FOURJAWALY_API_KEY;
  private readonly apiSecret = process.env.FOURJAWALY_API_SECRET;
  private readonly baseUrl = 'https://api-sms.4jawaly.com/api/v1';

  constructor(private readonly httpService: HttpService) {}

  private getAuthHeader() {
    const token = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString(
      'base64',
    );
    return { Authorization: `Basic ${token}` };
  }

  async sendSms(phone: string, message: string, sender?: string) {
    try {
      const payload = {
        messages: [
          {
            text: message,
            numbers: [phone],
            sender: sender || 'MNTAHSCI',
          },
        ],
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/account/area/sms/v2/send`,
          payload,
          { headers: this.getAuthHeader() },
        ),
      );

      this.logger.log(`SMS sent to ${phone}: ${response.data.message}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to send SMS: ${error.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }

  async sendBulkSms(phones: string[], message: string, sender?: string) {
    try {
      const payload = {
        messages: [
          {
            text: message,
            numbers: phones,
            sender: sender || 'MNTAHSCI',
          },
        ],
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/account/area/sms/v2/send`,
          payload,
          { headers: this.getAuthHeader() },
        ),
      );

      this.logger.log(`Bulk SMS sent to ${phones.length} recipients`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to send bulk SMS: ${error.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }
}
