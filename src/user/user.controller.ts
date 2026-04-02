import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AddressDto } from './dtos/address.dto';
import { UpdateUserDto } from './dtos/update-user-dto';
import { ResponseMessage } from 'src/common/decorators/message-response.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';
import { GetAllUserDto } from './dtos/get-all-user.dto';

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

  @Roles('ADMIN')
  @Patch(':id/status')
  async toggleUserStatus(
    @Param('id') targetUserId: string,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.userService.toggleUserStatus(targetUserId, isActive);
  }

  @Roles('ADMIN')
  @Get()
  async getAllUser(@Query() getAllUserDto: GetAllUserDto) {
    return await this.userService.getAllUsers(getAllUserDto);
  }

  @Get('address')
  async getAddress(@CurrentUser('sub') userId: string) {
    return this.userService.getAddress(userId);
  }
}
