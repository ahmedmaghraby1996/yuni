import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateContactDto {
  @ApiProperty({
    type: String,
    required: false,
    description: 'This is a Optional property',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @IsOptional()
  title_en: string;

  @ApiProperty({
    type: String,
    required: false,

    description: 'This is a Optional property',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  title_ar: string;

  @ApiProperty({
    type: String,
    required: false,

    description: 'This is a Optional property',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  logo: string;

  @ApiProperty({
    type: String,
    required: false,

    description: 'This is a Optional property',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  url: string;
}
