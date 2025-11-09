import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseAdminService {
  constructor() {
    // Path to the Firebase service account JSON file
    const serviceAccountPath = path.resolve(__dirname, '../../../firebase.spec.json');
    
    // Read the service account file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    // Initialize Firebase Admin SDK
  admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
      });
  }

  async sendNotification(deviceToken: string, title: string, body: string,imageUrl?: string): Promise<void> {
    const message = {
      token: deviceToken,
      notification: {
        title,
        body,
        imageUrl
      }, 
       android: {
        notification: {
          sound: 'default', // Allow sound on Android
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default', // Allow sound on iOS
          },
        },
      },
     

     
    };

    try {
      const response = await admin.messaging().send(message);  // Use the FCM v1 API
      console.log('Notification sent successfully:', response);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendNotificationForAll(tokens: string[], title: string, body: string, imageUrl?: string): Promise<void> {
    const messages = tokens.map((token) => ({
      token,
      notification: {
        title,
        body,
        imageUrl
      },
      android: {
        notification: {
          sound: 'default', // Allow sound on Android
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default', // Allow sound on iOS
          },
        },
      },
    }))

    try {
      const response = await admin.messaging().sendEach(messages);
      console.log('Notification sent successfully:', response);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

