import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { BaseService } from 'src/core/base/service/service.base';
import { CreateContactDto } from './dtos/request/create-contact.dto';
import { UpdateContactDto } from './dtos/request/update-contact.dto';
import { ContactUs } from 'src/infrastructure/entities/contact-us/contact-us.entity';

@Injectable()
export class ContactUsService extends BaseService<ContactUs> {
  constructor(
    @InjectRepository(ContactUs)
    private contactUsRepository: Repository<ContactUs>,
  ) {
    super(contactUsRepository);
  }

  async createContact(createContactDto: CreateContactDto): Promise<ContactUs> {
    console.log(createContactDto);
    const contact = this.contactUsRepository.create(createContactDto);
    try {
      return await this.contactUsRepository.save(contact);
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteContact(id: string): Promise<void> {
    try {
      const contact = await this.contactUsRepository.findOneBy({ id });
      if (!contact) {
        throw new NotFoundException();
      }
      await this.contactUsRepository.delete(contact.id);
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }

  async updateContact(
    id: string,
    updateContactDto: UpdateContactDto,
  ): Promise<ContactUs> {
    try {
      const contact = await this.contactUsRepository.findOneBy({ id });
      if (!contact) {
        throw new NotFoundException();
      }
      await this.contactUsRepository.update(contact.id, {
        ...updateContactDto,
      });
      return await this.contactUsRepository.findOneBy({ id });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
