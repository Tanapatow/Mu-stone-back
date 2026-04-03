import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AddressDto } from './dtos/address.dto';
import { UpdateUserDto } from './dtos/update-user-dto';
import { ResponseMessage } from 'src/common/decorators/message-response.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';
import { GetAllUserDto } from './dtos/get-all-user.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  @Get('addresses')
  async getMyAddresses(@CurrentUser('sub') userId: string) {
    return this.userService.getAddresses(userId);
  }

  // 2. เพิ่มที่อยู่ใหม่
  @Post('address')
  async createAddress(
    @CurrentUser('sub') userId: string,
    @Body() addressDto: AddressDto,
  ) {
    return this.userService.createAddress(userId, addressDto);
  }

  @Patch('address/:addressId')
  async updateAddress(
    @CurrentUser('sub') userId: string,
    @Param('addressId') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.userService.updateAddress(userId, addressId, updateAddressDto);
  }

  @Patch('address/:addressId/default')
  async setDefaultAddress(
    @CurrentUser('sub') userId: string,
    @Param('addressId') addressId: string,
  ) {
    // โยน { isDefault: true } เข้าไปใน Service เดิมได้เลย
    return this.userService.updateAddress(userId, addressId, {
      isDefault: true,
    });
  }

  @ResponseMessage('ลบที่อยู่สำเร็จ')
  @Delete('address/:addressId')
  async deleteAddress(
    @CurrentUser('sub') userId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.userService.deleteAddress(userId, addressId);
  }
}
