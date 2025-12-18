import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenRequest {
  @ApiProperty()
  refresh_token: string;
}



