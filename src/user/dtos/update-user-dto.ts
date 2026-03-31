import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Gender } from 'src/database/generated/prisma/enums';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsDateString()
  dob?: string; //

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
