import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import {
  IsUnique,
  Unique,
} from 'src/core/validators/unique-constraints.validator';

export class CreateContactDto {
  @ApiProperty({
    type: String,
    description: 'This is a required property',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @Unique('contact_us')
  title_en: string;

  @ApiProperty({
    type: String,
    description: 'This is a required property',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @Unique('contact_us')
  title_ar: string;

  @ApiProperty({
    type: String,
    description: 'This is a required property',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  logo: string;

  @ApiProperty({
    type: String,
    description: 'This is a required property',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  url: string;
}
