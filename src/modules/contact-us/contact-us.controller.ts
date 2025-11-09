import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactUsResponse } from './dtos/response/contact-us.response';
import { I18nResponse } from 'src/core/helpers/i18n.helper';
import { ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { PaginatedRequest } from 'src/core/base/requests/paginated.request';
import { ContactUsService } from './contact-us.service';
import { CreateContactDto } from './dtos/request/create-contact.dto';
import { UpdateContactDto } from './dtos/request/update-contact.dto';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from '../authentication/guards/roles.decorator';
@ApiTags('Contact-Us')
@ApiHeader({
  name: 'Accept-Language',
  required: false,
  description: 'Language header: en, ar',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()


@Controller('contact-us')
export class ContactUsController {
  constructor(
    private contactUsService: ContactUsService,
    @Inject(I18nResponse) private readonly _i18nResponse: I18nResponse,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  @Get()
  async getAll(
    @Query() query?: PaginatedRequest,
  ): Promise<ContactUsResponse[]> {
    const contactUsData = await this.contactUsService.findAll(query);
    const data: ContactUsResponse[] = this._i18nResponse.entity(contactUsData,this.request.user.roles);
    const dataRes = data.map((contact_us) => {
      return new ContactUsResponse(contact_us);
    });

    return dataRes;
  }

  @Post()
  async createContact(
    @Body() createContactDto: CreateContactDto,
  ): Promise<ContactUsResponse> {
    const contactUsData = await this.contactUsService.createContact(
      createContactDto,
    );
    const data: ContactUsResponse = this._i18nResponse.entity(contactUsData);

    const dataRes = new ContactUsResponse(data);
    return dataRes;
  }

  @Delete('/:id')
  deleteContact(@Param('id') id: string): Promise<void> {
    return this.contactUsService.deleteContact(id);
  }

  @Patch('/:id')
  async updateContact(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ): Promise<ContactUsResponse> {
    const contactUsData = await this.contactUsService.updateContact(
      id,
      updateContactDto,
    );
    const data: ContactUsResponse = this._i18nResponse.entity(contactUsData);

    const dataRes = new ContactUsResponse(data);
    return dataRes;
  }
}
