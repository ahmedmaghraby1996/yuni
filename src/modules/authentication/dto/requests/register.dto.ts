import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  isStrongPassword,
} from 'class-validator';
import { Unique } from 'src/core/validators/unique-constraints.validator';
import { AcademicStage } from 'src/infrastructure/data/enums/academic-stage.enum';
import { Gender } from 'src/infrastructure/data/enums/gender.enum';
import { Role } from 'src/infrastructure/data/enums/role.enum';

export class RegisterRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  // @IsStrongPassword()
  password: string;

  @ApiProperty()
  @IsOptional()
  @Unique('User')
  phone: string;

  @ApiProperty({ type: 'file', required: false })
  @IsOptional()
  avatarFile: Express.Multer.File;

  @ApiProperty({ default: Role.CLIENT, enum: [Role.CLIENT, Role.STORE] })
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;

      @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  agent_id: string;
}
export class AgentRegisterRequest  {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  resume: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city_id: string;



  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cv: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  certificate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bank_account_number: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bank_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bank_branch: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_number: string;


    @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nickname: string;


}
