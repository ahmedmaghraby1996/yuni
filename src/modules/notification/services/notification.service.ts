import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { FcmIntegrationService } from '../../../integration/notify/fcm-integration.service';
import { UserService } from 'src/modules/user/user.service';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { NotificationTypes } from 'src/infrastructure/data/enums/notification-types.enum';
import {
  SendToAllUsersNotificationRequest,
  SendToUsersNotificationRequest,
} from '../dto/requests/send-to-users-notification.request';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { FirebaseAdminService } from '../firebase-admin-service';

@Injectable()
export class NotificationService extends BaseUserService<NotificationEntity> {
  constructor(
    @InjectRepository(NotificationEntity)
    public _repo: Repository<NotificationEntity>,
    @InjectRepository(User)
    public userRepo: Repository<User>,
    @Inject(REQUEST) request: Request,
    private readonly _userService: UserService,
    private readonly _fcmIntegrationService: FirebaseAdminService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    super(_repo, request);
  }
  //get id and status from argument and update is read
  async toggleRead(isRead: boolean, id: string) {
    const notification = await this._repo.findOneBy({ id: id });
    if (!notification) throw new BadRequestException('message.not_found');
    notification.is_read = isRead;
    if (isRead) notification.seen_at = new Date();
    return await this._repo.save(notification);
  }

  async getSingleNotification(id: string) {
    const notification = await this._repo.findOneBy({ id });
    const users =
      notification.user_ids == null
        ? null
        : await this.userRepo.find({
            where: { id: In(notification.user_ids) },
          });
    return { notification, users };
  }
  override async create(data: NotificationEntity) {
    data.is_read = false;
    const notification = await super.create(data);
    const recipient = await this._userService.findOne({
      id: notification.user_id,
    });
    console.log('recipient', recipient);

    if (recipient.fcm_token) {
      await this._fcmIntegrationService.sendNotification(
        recipient.fcm_token,
        notification['title_' + recipient.language],
        notification['text_' + recipient.language],
      
      );
    }
    if (!notification) throw new BadRequestException('message.not_found');
    return notification;
  }

  //create notification to group of users
  async createToGroup(notification: NotificationEntity, users: User[]) {
    console.log('group sending notification');
    const notifications = [];
    const data = notification;
    users.forEach(async (user: any) => {
      data.user_id = user.id;
      console.log(data);
      const notification = await this.create(data);
      notifications.push(notification);
    });
    return notifications;
  }

  //*This For Test
  async sendToUsers(
    sendToUsersNotificationRequest: SendToUsersNotificationRequest,
  ) {
    const { users_id, message_ar, message_en, title_ar, title_en } =
      sendToUsersNotificationRequest;
    const BATCH_SIZE = 10; // Adjust batch size based on your server's capacity

    for (let i = 0; i < users_id.length; i += BATCH_SIZE) {
      const userBatch = users_id.slice(i, i + BATCH_SIZE);

      const notificationPromises = userBatch.map(async (userId) => {
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });
        if (user) {
          return this.create(
            new NotificationEntity({
              user_id: userId,
              url: userId,
              type: NotificationTypes.USERS,
              title_ar: title_ar,
              title_en: title_en,
              text_ar: message_ar,
              text_en: message_en,
            }),
          );
        }
      });

      // Wait for all notifications in the batch to be processed
      await Promise.all(notificationPromises).catch((error) => {
        // Log the error or handle it as needed
        console.error('Error sending notifications:', error);
      });
    }
  }
  async sendToALl(
    sendToUsersNotificationRequest: SendToAllUsersNotificationRequest,
  ) {
    const { message_ar, message_en, title_ar, title_en } =
      sendToUsersNotificationRequest;

    console.log(sendToUsersNotificationRequest.users_id);
    const users = await this.userRepository.find({
      where: {
        roles: sendToUsersNotificationRequest.role,
        id:
          sendToUsersNotificationRequest?.users_id != null
            ? In(sendToUsersNotificationRequest?.users_id)
            : null,
      },
    });
    this.create(
      new NotificationEntity({
        user_id: this.currentUser.id,
        url: this.currentUser.id,
        type:
         NotificationTypes.ADMIN,
        title_ar: title_ar,
        title_en: title_en,
        text_ar: message_ar,
        user_ids: sendToUsersNotificationRequest?.users_id,
        role: sendToUsersNotificationRequest?.role,
        text_en: message_en,
      }),
    );
    users.map(async (user) => {
      return this.create(
        new NotificationEntity({
          user_id: user.id,
          url: user.id,
          type: NotificationTypes.USERS,
          title_ar: title_ar,
          title_en: title_en,
          text_ar: message_ar,
          text_en: message_en,
        }),
      );
    });
    return 'notification sent successfully';
  }
}
