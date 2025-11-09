import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  AgentRegisterRequest,
  RegisterRequest,
} from '../dto/requests/register.dto';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { randStr } from 'src/core/helpers/cast.helper';
import { BaseTransaction } from 'src/core/base/database/base.transaction';
import { ImageManager } from 'src/integration/sharp/image.manager';
import * as sharp from 'sharp';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { Role } from 'src/infrastructure/data/enums/role.enum';

import { plainToInstance } from 'class-transformer';

import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';

import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { where } from 'sequelize';
import { City } from 'src/infrastructure/entities/city/city.entity';
import { Store } from 'src/infrastructure/entities/store/store.entity';
import { StoreStatus } from 'src/infrastructure/data/enums/store-status.enum';
@Injectable()
export class RegisterUserTransaction extends BaseTransaction<
  RegisterRequest,
  User
> {
  constructor(
    dataSource: DataSource,
    @Inject(ConfigService) private readonly _config: ConfigService,
    @Inject(StorageManager) private readonly storageManager: StorageManager,
    @Inject(ImageManager) private readonly imageManager: ImageManager,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    super(dataSource);
  }

  // the important thing here is to use the manager that we've created in the base class
  protected async execute(
    req: Partial<RegisterRequest>,

    context: EntityManager,
  ): Promise<User> {
    try {
      // upload avatar
      const admin_id = this.request?.user?.id;
      const user = new User(req);
      // upload avatar
      if (req.avatarFile) {
        // resize image to 300x300
        const resizedImage = await this.imageManager.resize(req.avatarFile, {
          size: { width: 300, height: 300 },
          options: {
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy,
          },
        });

        // save image
        const path = await this.storageManager.store(
          { buffer: resizedImage, originalname: req.avatarFile.originalname },
          { path: 'avatars' },
        );

        // set avatar path
        user.avatar = path;
      }
      // encrypt password
      const randomPassword = req.password || randStr(8);
      user.password = await bcrypt.hash(
        randomPassword + this._config.get('app.key'),
        10,
      );

      user.username = user?.phone ?? user?.email;

      // set user role
      user.roles = [req.role];
      // save user
      const savedUser = await context.save(User, user);

      if (req.role == Role.STORE) {
        const store = new Store({
          status: StoreStatus.APPROVED,
          is_active: true,
        });
        store.user_id = savedUser.id;
        store.is_main_branch = true;
        savedUser.agent_id = req.agent_id;
        await context.save(store);
      }

      // if (req.role == Role.AGENT) {
      //   savedUser.resume = req.resume;
      //   savedUser.resume = req.cv;
      //   savedUser.certificate = req.certificate;
      //   savedUser.bank_account_number = req.bank_account_number;
      //   savedUser.bank_name = req.bank_name;
      //   savedUser.bank_branch = req.bank_branch;
      //   savedUser.id_number = req.id_number;
      //   savedUser.city_id = req.city_id;
      //   savedUser.is_active = false;
      // }

      await context.save(savedUser);

      // return user
      return savedUser;
    } catch (error) {
      throw new BadRequestException(
        this._config.get('app.env') !== 'prod'
          ? error
          : 'message.register_failed',
      );
    }
  }
}

function generateFormattedNumber(prefix, number, numDigits) {
  const formattedValue = `${prefix}${number
    .toString()
    .padStart(numDigits, '0')}`;
  return formattedValue;
}
