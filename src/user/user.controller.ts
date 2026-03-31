import { Body, Controller, Patch, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AddressDto } from './dtos/address.dto';
import { UpdateUserDto } from './dtos/update-user-dto';
import { ResponseMessage } from 'src/common/decorators/message-response.decorator';

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

  @ResponseMessage('อัพเดตข้อมูลโปรไฟล์สำเร็จ')
  @Patch()
  async updateUser(
    @CurrentUser('sub') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateProfile(userId, updateUserDto);
  }
}
