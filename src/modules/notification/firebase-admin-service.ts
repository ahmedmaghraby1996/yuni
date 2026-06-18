import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private initialized = false;

  constructor(private readonly config: ConfigService) {
    const specsFile =
      this.config.get<string>('FIREBASE_SPECS_PATH') || 'firebase.spec.json';
    const serviceAccountPath = path.isAbsolute(specsFile)
      ? specsFile
      : path.resolve(process.cwd(), specsFile);

    if (!fs.existsSync(serviceAccountPath)) {
      this.logger.warn(
        `Firebase credentials not found at ${serviceAccountPath}. Push notifications are disabled.`,
      );
      return;
    }

    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, 'utf8'),
    );

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    this.initialized = true;
  }

  async sendNotification(
    deviceToken: string,
    title: string,
    body: string,
    imageUrl?: string,
  ): Promise<void> {
    if (!this.initialized) {
      this.logger.warn('Skipping notification send: Firebase is not configured.');
      return;
    }

    const message = {
      token: deviceToken,
      notification: {
        title,
        body,
        imageUrl,
      },
      android: {
        notification: {
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    try {
      const response = await admin.messaging().send(message);
      this.logger.log(`Notification sent successfully: ${response}`);
    } catch (error) {
      this.logger.error('Error sending notification:', error);
    }
  }

  async sendNotificationForAll(
    tokens: string[],
    title: string,
    body: string,
    imageUrl?: string,
  ): Promise<void> {
    if (!this.initialized) {
      this.logger.warn('Skipping notification send: Firebase is not configured.');
      return;
    }

    const messages = tokens.map((token) => ({
      token,
      notification: {
        title,
        body,
        imageUrl,
      },
      android: {
        notification: {
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    }));

    try {
      const response = await admin.messaging().sendEach(messages);
      this.logger.log(`Notification sent successfully: ${JSON.stringify(response)}`);
    } catch (error) {
      this.logger.error('Error sending notification:', error);
    }
  }
}
