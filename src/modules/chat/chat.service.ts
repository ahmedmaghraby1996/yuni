// chat.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Chat } from 'src/infrastructure/entities/chat/chat.entity';
import { Message } from 'src/infrastructure/entities/chat/messages.entity';

import { User } from 'src/infrastructure/entities/user/user.entity';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { ChatGateway } from 'src/integration/gateways/chat.gateway';
import { plainToInstance } from 'class-transformer';
import { MessageRespone } from './dto/message.response';

import {  Store } from 'src/infrastructure/entities/store/store.entity';
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat) private chatRepo: Repository<Chat>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @Inject(REQUEST) private readonly request: Request,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    private readonly chatGateway: ChatGateway,
  ) {}
// 
  async startChat(storeId: string): Promise<Chat> {
    const clientId = this.request.user.id;
    const store=await this.storeRepo.findOne({ where: { id: storeId,  } });
    if (!store) {
      throw new NotFoundException('Store not found or is not a main branch');
    }
    const existing = await this.chatRepo.findOne({
      where: { client: { id: clientId }, store: { id: store.user_id } },
    });

    if (existing) return existing;

    const newChat = new Chat({
      client_id: clientId,
      store_id: store.user_id,
    });
    return await this.chatRepo.save(newChat);
  }

  async sendMessage(chatId: string, content: string): Promise<Message> {
    const senderId = this.request.user.id;
    const message = this.msgRepo.create({
      chat_id: chatId,
      sender_id: senderId,
      content,
    });

    await this.msgRepo.save(message);
    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: {},
    });
        this.chatGateway.server.emit(
      'new-message-' + chatId,
      plainToInstance(MessageRespone, {...message, sender: this.request.user}, {
        excludeExtraneousValues: true,
      }),
    );
    return message;
  }

  async getMessages(chatId: string): Promise<Message[]> {
    await this.msgRepo.update(
      { chat_id: chatId, is_seen: false },
      { is_seen: true },
    );

    return await this.msgRepo.find({
      where: { chat: { id: chatId } },
      relations: ['sender'],
      order: { created_at: 'ASC' },
    });
  }

  // chat.service.ts (continued)
async getUserChats() {
  const roles = this.request.user.roles;
  const userId = this.request.user.id;

  const roleColumn = roles.includes(Role.CLIENT)
    ? 'chat.client_id'
    : 'chat.store_id';

  // Subquery: Get latest message per chat
  const subQuery = this.chatRepo
    .createQueryBuilder('chat')
    .leftJoin('chat.messages', 'm')
    .select('m.chat_id', 'chat_id')
    .addSelect('MAX(m.created_at)', 'last_created_at')
    .groupBy('m.chat_id');

  // Main query: Join latest message per chat + store.store with is_main = true
  const chats = await this.chatRepo
    .createQueryBuilder('chat')
    .leftJoinAndSelect('chat.client', 'client')
    .leftJoinAndSelect('chat.store', 'store')
    .leftJoinAndSelect('store.stores', 'store_sub', 'store_sub.is_main_branch = true') // join sub store with is_main = true
    .leftJoinAndSelect('chat.messages', 'message')
    .leftJoin(
      `(${subQuery.getQuery()})`,
      'latest',
      'latest.chat_id = chat.id AND message.created_at = latest.last_created_at',
    )
    .where(`${roleColumn} = :userId`, { userId })
    .orderBy('latest.last_created_at', 'DESC')
    .setParameters(subQuery.getParameters())
    .getMany();

  // Simplify the last message
  return chats.map((chat) => {
    const lastMessage = chat.messages?.[0] ?? null;
    return {
      ...chat,
      last_message: lastMessage,
    };
  });
}

}
