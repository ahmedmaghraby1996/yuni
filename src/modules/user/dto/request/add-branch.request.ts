import { ApiProperty } from "@nestjs/swagger";
import { IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AddBranchRequest {
  @ApiProperty({ required: true, description: 'Store name', example: 'My Store', default: 'My Store' })
  @IsNotEmpty() @IsString()
  name: string;

  @ApiProperty({ required: true, description: 'Store address', example: 'My Address', default: 'My Address' })
  @IsNotEmpty() @IsString()
  address: string;
  // LATITUDE AND LONGITUDE
    @ApiProperty({ required: true, description: 'Store latitude', example: '24.7136', default: '24.7136' })
    @IsNotEmpty() @IsLatitude()
    latitude: number;

    @ApiProperty({ required: true, description: 'Store longitude', example: '46.6758', default: '46.6758' })
    @IsNotEmpty() @IsLongitude()
    longitude: number;

     @ApiProperty({ required: true, description: 'Store city_id', example: '1', default: '1' })
    @IsNotEmpty() @IsString()
    city_id: string;




 
}