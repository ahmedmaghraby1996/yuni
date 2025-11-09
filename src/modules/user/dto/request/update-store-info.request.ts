import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateStoreInfoRequest {
  @ApiProperty({
    required: false,
    description: 'Store name',
    example: 'My Store',
    default: 'My Store',
  })
   @IsOptional()
  @IsString()
  name: string;

  id:string
  @ApiProperty({
    required: false,
    description: 'Store address',
    example: 'My Address',
    default: 'My Address',
  })
 @IsOptional()
  @IsString()
  address: string;
  // LATITUDE AND LONGITUDE
  @ApiProperty({
    required: false ,
    description: 'Store latitude',
    example: '24.7136',
    default: '24.7136',
  })
 @IsOptional()
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    required: false,
    description: 'Store longitude',
    example: '46.6758',
    default: '46.6758',
  })
  @IsOptional()
  @IsLongitude()
  longitude: number;

  // logo
  @ApiProperty({ required: false, description: 'Store logo', type: 'file' })
  @IsOptional()
  logo: Express.Multer.File;

  @ApiProperty({
    required: false,
    description: 'Store catalogue',
    type: 'file',
  })
  @IsOptional()
  catalogue: Express.Multer.File;

  // first_phone
  @ApiProperty({
    required: false,
    description: 'Store first phone',
    example: '0101234567',
    default: '0101234567',
  })
  @IsOptional()
  @IsString()
  first_phone: string;
  // second_phone
  @ApiProperty({
    required: false,
    description: 'Store second phone',
    example: '0101234567',
    default: '0101234567',
  })
  @IsOptional()
  @IsString()
  second_phone: string;
  // facebook_link
  @ApiProperty({
    required: false,
    description: 'Store facebook link',
    example: 'https://www.facebook.com',
    default: 'https://www.facebook.com',
  })
  @IsOptional()
  @IsString()
  facebook_link: string;
  // instagram_link
  @ApiProperty({
    required: false,
    description: 'Store instagram link',
    example: 'https://www.instagram.com',
    default: 'https://www.instagram.com',
  })
  @IsOptional()
  @IsString()
  instagram_link: string;

  // x_link
  @ApiProperty({
    required: false,
    description: 'Store x link',
    example: 'https://www.x.com',
    default: 'https://www.x.com',
  })
  @IsOptional()
  @IsString()
  x_link: string;
  // whatsapp_link
  @ApiProperty({
    required: false,
    description: 'Store whatsapp link',
    example: 'https://www.whatsapp.com',
    default: 'https://www.whatsapp.com',
  })
  @IsOptional()
  @IsString()
  whatsapp_link: string;
  // snapchat_link
  @ApiProperty({
    required: false,
    description: 'Store snapchat link',
    example: 'https://www.snapchat.com',
    default: 'https://www.snapchat.com',
  })
  @IsOptional()
  @IsString()
  snapchat_link: string;
  // youtube_link
  @ApiProperty({
    required: false,
    description: 'Store youtube link',
    example: 'https://www.youtube.com',
    default: 'https://www.youtube.com',
  })
  @IsOptional()
  @IsString()
  youtube_link: string;
  // tiktok_link
  @ApiProperty({
    required: false,
    description: 'Store tiktok link',
    example: 'https://www.tiktok.com',
    default: 'https://www.tiktok.com',
  })
  @IsOptional()
  @IsString()
  tiktok_link: string;
  // twitter_link
  // city_id
  @ApiProperty({
    required: false,
    description: 'Store city_id',
    example: '1',
    default: '1',
  })
  @IsOptional()
  @IsString()
  city_id: string;

  // city_id
  @ApiProperty({
    required: false,
    description: 'Store category_id',
    example: '1',
    default: '1',
  })
  @IsOptional()
  @IsString()
  category_id: string;
    @ApiProperty({ required: false, type: Boolean })
    @IsOptional()
    @Transform(({ value }) => {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
    })
    @IsBoolean()
    is_active?: boolean;
}

export class UpdateBranchInfoRequest {
  @ApiProperty({
    required: false,
    description: 'Branch ID',
    example: '1',
    default: '1',
  })
  @IsOptional()
  @IsString()
  branch_id: string;
  @ApiProperty({
    required: false,
    description: 'Store name',
    example: 'My Store',
    default: 'My Store',
  })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    required: false,
    description: 'Store address',
    example: 'My Address',
    default: 'My Address',
  })
  @IsOptional()
  @IsString()
  address: string;
  // LATITUDE AND LONGITUDE
  @ApiProperty({
    required: false,
    description: 'Store latitude',
    example: '24.7136',
    default: '24.7136',
  })
  @IsOptional()
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    required: false,
    description: 'Store longitude',
    example: '46.6758',
    default: '46.6758',
  })
  @IsOptional()
  @IsLongitude()
  longitude: number;

  // city_id
  @ApiProperty({
    required: false,
    description: 'Store city_id',
    example: '1',
    default: '1',
  })
  @IsOptional()
  @IsString()
  city_id: string;

  // is_active
  @ApiProperty({
    required: false,
    description: 'Store is_active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active: boolean;
}
