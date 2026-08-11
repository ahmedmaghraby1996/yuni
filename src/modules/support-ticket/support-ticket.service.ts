import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/core/base/service/service.base';
import { SupportTicket } from 'src/infrastructure/entities/support-ticket/support-ticket.entity';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { TicketStatus } from 'src/infrastructure/data/enums/ticket-status.enum';
import { CreateTicketRequest } from './dto/create-ticket.request';
import { ReplyTicketRequest } from './dto/reply-ticket.request';

@Injectable()
export class SupportTicketService extends BaseService<SupportTicket> {
  constructor(
    @InjectRepository(SupportTicket)
    private repo: Repository<SupportTicket>,
    @Inject(REQUEST) private request: Request,
  ) {
    super(repo);
  }

  async createTicket(req: CreateTicketRequest): Promise<SupportTicket> {
    const count = await this.repo.count();
    return await this.repo.save({
      title: req.title,
      description: req.description,
      status: TicketStatus.PENDING,
      user_id: this.request.user.id,
      number: count + 1,
    });
  }

  async getMyTickets(page = 1, limit = 10, status?: TicketStatus, name?: string): Promise<{ data: SupportTicket[]; total: number }> {
    const qb = this.repo.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .where('ticket.user_id = :userId', { userId: this.request.user.id })
      .orderBy('ticket.created_at', 'DESC');

    if (status) qb.andWhere('ticket.status = :status', { status });
    if (name) qb.andWhere('user.name LIKE :name', { name: `%${name}%` });

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { data, total };
  }

  async getTicketById(id: string): Promise<SupportTicket> {
    const ticket = await this.repo.findOne({
      where: { id, user_id: this.request.user.id },
      relations: { user: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async getAdminTicketById(id: string): Promise<SupportTicket> {
    const ticket = await this.repo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async getAllTickets(page = 1, limit = 10, status?: TicketStatus, name?: string): Promise<{ data: SupportTicket[]; total: number }> {
    const qb = this.repo.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .orderBy('ticket.created_at', 'DESC');

    if (status) qb.andWhere('ticket.status = :status', { status });
    if (name) qb.andWhere('user.name LIKE :name', { name: `%${name}%` });

    const total = await qb.getCount();
    const data = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { data, total };
  }

  async replyTicket(id: string, req: ReplyTicketRequest): Promise<SupportTicket> {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    ticket.reply = req.reply;
    ticket.status = TicketStatus.REPLIED;
    return await this.repo.save(ticket);
  }
}
