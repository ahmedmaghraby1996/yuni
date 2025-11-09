import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiTags, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ActionResponse } from 'src/core/base/responses/action.response';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard';
import { RolesGuard } from '../authentication/guards/roles.guard';
import { plainToInstance } from 'class-transformer';
import { ChatResponse } from './dto/chat.response';
import { MessageRespone } from './dto/message.response';
import { ChatGateway } from 'src/integration/gateways/chat.gateway';

@ApiTags('Chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService,) {}

  @Post('start')
 @ApiBody({
  schema: {
    type: 'object',
    properties: {
      store_id: { type: 'string', example: 'store-uuid-456' },
    },
    required: ['store_id'],
  },
})
  async startChat(@Body() body: {  store_id: string }) {
    return new ActionResponse(
      await this.chatService.startChat( body.store_id),
    );
  }

  @Post(':chat_id/send')
  @ApiParam({
    name: 'chat_id',
    required: true,
    type: String,
    description: 'ID of the chat',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'Hello, how can I help you?' },
      },
      required: ['sender_id', 'content'],
    },
  })
  async sendMessage(
    @Param('chat_id') chat_id: string,
    @Body() body: { sender_id: string; content: string },
  ) {
    return new ActionResponse(
      await this.chatService.sendMessage(chat_id, body.content),
    );
  }

  @Get(':chat_id/messages')
  @ApiParam({
    name: 'chat_id',
    required: true,
    type: String,
    description: 'ID of the chat',
  })
  async getMessages(@Param('chat_id') chat_id: string) {
    return new ActionResponse(
      plainToInstance(
        MessageRespone,
        await this.chatService.getMessages(chat_id),{
          excludeExtraneousValues: true,}
      ),
      
    );
  }

  @Get('all')
  async getChats() {
    return new ActionResponse(
      plainToInstance(ChatResponse, await this.chatService.getUserChats(),{
        excludeExtraneousValues: true,
      }),
    );
  }
}
