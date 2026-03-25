import {
  IsAlphanumeric,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Trim } from 'src/common/decorators/trim.decorator';
import { Gender } from 'src/database/generated/prisma/enums';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email is required' })
  @Trim()
  email: string;

  @MinLength(6, { message: 'Password must have at least 6 characters' })
  @IsAlphanumeric('en-US', {
    message: 'Password can contain only number and letter',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @Trim()
  password: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @Trim()
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Trim()
  lastName: string;

  @IsDate({ message: 'Invalid date' })
  @IsNotEmpty({ message: 'Date of birth is required' })
  @Type(() => Date)
  dob: Date;

  @IsEnum(Gender, {
    message: 'Gender must be one of the following values: MALE, FEMALE, OTHER',
  })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: Gender;
}
