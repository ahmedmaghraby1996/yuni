import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { UserService } from 'src/modules/user/user.service';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { BaseUserService } from 'src/core/base/service/user-service.base';
import { NotificationEntity } from 'src/infrastructure/entities/notification/notification.entity';
import { NotificationTypes } from 'src/infrastructure/data/enums/notification-types.enum';
import {
  SendToAllUsersNotificationRequest,
  SendToUsersNotificationRequest,
} from '../dto/requests/send-to-users-notification.request';
import { FirebaseAdminService } from '../firebase-admin-service';
import { OfferUsage } from 'src/infrastructure/entities/offer/offer-usage.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';

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
    @InjectRepository(OfferUsage) private readonly offerUsageRepo: Repository<OfferUsage>,
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
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

  private get storeOwnerId(): string {
    return (this.currentUser as any).owner_user_id ?? this.currentUser.id;
  }

  async sendToStoreCustomers(req: { title_ar: string; title_en: string; message_ar: string; message_en: string; user_ids?: string[] }) {
    let userIds: string[];
    const isTargeted = !!req.user_ids?.length;

    if (isTargeted) {
      userIds = req.user_ids;
    } else {
      // find all user_ids who used offers belonging to this store owner
      const stores = await this.storeRepo.find({ where: { user_id: this.storeOwnerId } });
      const storeIds = stores.map((s) => s.id);

      const usages = await this.offerUsageRepo
        .createQueryBuilder('usage')
        .innerJoin('usage.offer', 'offer')
        .innerJoin('offer.stores', 'store')
        .where('store.id IN (:...storeIds)', { storeIds })
        .andWhere('usage.deleted_at IS NULL')
        .select('DISTINCT usage.user_id', 'user_id')
        .getRawMany();

      userIds = usages.map((u) => u.user_id);
    }

    if (!userIds.length) return 'no customers found';

    const users = await this.userRepository.find({ where: { id: In(userIds) } });

    // save a summary notification for the store owner
    await this.create(new NotificationEntity({
      user_id: this.currentUser.id,
      type: NotificationTypes.ADMIN,
      title_ar: req.title_ar,
      title_en: req.title_en,
      text_ar: req.message_ar,
      text_en: req.message_en,
      user_ids: isTargeted ? userIds : null,
    }));

    for (const user of users) {
      await this.create(new NotificationEntity({
        user_id: user.id,
        type: NotificationTypes.USERS,
        title_ar: req.title_ar,
        title_en: req.title_en,
        text_ar: req.message_ar,
        text_en: req.message_en,
      }));
    }

    return 'notification sent successfully';
  }

  async getStoreNotifications(query: any) {
    const notifications = await this._repo.find({
      where: { user_id: this.currentUser.id, type: NotificationTypes.ADMIN },
      order: { created_at: 'DESC' },
      skip: query.page && query.limit ? (query.page - 1) * query.limit : 0,
      take: query.limit ?? 10,
    });

    return notifications.map((n) => ({
      ...n,
      sent_to_all: !n.user_ids?.length,
    }));
  }

  async getStoreNotificationById(id: string) {
    const n = await this._repo.findOneBy({ id, user_id: this.currentUser.id, type: NotificationTypes.ADMIN });
    if (!n) throw new BadRequestException('message.not_found');
    const users = n.user_ids?.length
      ? await this.userRepository.find({
          where: { id: In(n.user_ids) },
          select: ['id', 'name', 'email', 'phone', 'avatar'],
        })
      : [];
    return { ...n, users };
  }
}
