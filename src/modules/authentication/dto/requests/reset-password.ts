import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class ResetPasswordRequest {

  @ApiPropertyOptional()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&])[a-zA-Z\d!@#$%^&]{8,}$/, {
    message: 'Password too weak. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character, and be at least 8 characters long.',
  })
  newPassword?: string;

}
