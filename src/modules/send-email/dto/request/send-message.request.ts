import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendMessageRequest {
    @ApiProperty({ example: 'Test Message', description: 'The message header' })
    @IsNotEmpty()
    @IsString()
    message_header: string;

    @ApiProperty({ example: 'Hello, this is a test message', description: 'The message body to be sent' })
    @IsNotEmpty()
    @IsString()
    message_body: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    send_to: string;

    @ApiProperty({ required: false , example: ['email'], description: 'The type of message to be sent (email or portal)'})
    @IsOptional()
    type: string[] = ['email']; // email or portal
}