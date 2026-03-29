import { Body, Controller, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AddressDto } from './dtos/address.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('address')
  async updateAddress(
    @CurrentUser('sub') userId: string,
    @Body() addressDto: AddressDto,
  ) {
    return this.userService.upsertAddress(userId, addressDto);
  }
}
