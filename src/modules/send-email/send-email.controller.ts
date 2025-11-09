import { Body, Controller, Delete, Get, Head, Header, Headers, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { Role } from 'src/infrastructure/data/enums/role.enum';
import { Roles } from '../authentication/guards/roles.decorator';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { Router } from 'src/core/base/router';
import { SendEmailService } from './send-email.service';
import { SendMessageRequest } from './dto/request/send-message.request';

@ApiBearerAuth()
@ApiTags("Send Messages")
@ApiHeader({ name: 'Accept-Language', required: false, description: 'Language header: en, ar' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("send-messages")
export class SendEmailController {
    constructor(
        private sendEmailService: SendEmailService,
    ) { }


    @Post()
    @Roles(Role.ADMIN)
    async sendMessage(
        @Body() request: SendMessageRequest
    ): Promise<ActionResponse<boolean>> {
        const result = await this.sendEmailService.sendCustomMessage(request)
        return new ActionResponse<boolean>(result)
    }
}
    