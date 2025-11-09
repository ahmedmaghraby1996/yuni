import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsIn, IsEmail } from 'class-validator';


export class SuggestionsComplaintsRequest {

  @ApiProperty({default:'improve slider ads'})
  @IsNotEmpty()
  title: string;

  @ApiProperty({default:'put some images good'})
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;


}
