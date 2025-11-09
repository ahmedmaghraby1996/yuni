import { ApiProperty } from '@nestjs/swagger';

export class ToggleRequest {
    @ApiProperty()
    isRead: boolean;
}
