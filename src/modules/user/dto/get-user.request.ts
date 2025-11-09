import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';


export class GetUserRequest {
  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsOptional()
 
  id: string;
}
