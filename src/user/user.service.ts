import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { Prisma, User } from 'src/database/generated/prisma/client';
import { BcryptService } from 'src/shared/security/services/bcrypt.service';
import { PrismaService } from 'src/database/prisma.service';
import { PrismaClientKnownRequestError } from 'src/database/generated/prisma/internal/prismaNamespace';
import { UserWithoutPassword } from './types/user.type';
import { AddressDto } from './dtos/address.dto';
import { UpdateUserDto } from './dtos/update-user-dto';
import { GetAllUserDto } from './dtos/get-all-user.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcryptService: BcryptService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await this.bcryptService.hash(
      createUserDto.password,
    );

    try {
      const user = await this.prisma.user.create({
        data: { ...createUserDto, password: hashedPassword },
      });
      return user;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          message: `Email: ${createUserDto.email} is already in use`,
          code: 'EMAIL_ALREADY_EXISTS',
        });
      }

      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
    if (!user)
      throw new NotFoundException({
        message: 'User with provided id not found',
        code: 'USER_NOT_FOUND',
      });

    return user;
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...updateUserDto,
          dob: updateUserDto.dob ? new Date(updateUserDto.dob) : undefined,
        },
        // ✨ กฎเหล็ก Frontend-First: เลือกส่งกลับไปเฉพาะฟิลด์ที่ปลอดภัยและจำเป็น
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          dob: true,
          gender: true,
          isActive: true,
          role: true,
        },
      });

      // คืนค่ากลับไปแบบแบนๆ คลีนๆ ให้ Frontend เอาไปใช้ต่อได้ทันที
      return updatedUser;
    } catch {
      throw new InternalServerErrorException({
        message: 'ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้ โปรดลองใหม่อีกครั้ง',
        code: 'UPDATE_PROFILE_FAILED',
      });
    }
  }

  async toggleUserStatus(targetUserId: string, isActive: boolean) {
    // 1. เช็คก่อนว่ามี User นี้ในระบบไหม
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException({
        message: 'ไม่พบข้อมูลผู้ใช้งานที่ต้องการดำเนินการ',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException({
        message:
          'ไม่อนุญาตให้ระงับการใช้งานบัญชีผู้ดูแลระบบ (ADMIN) ด้วยกันเอง',
        code: 'CANNOT_BAN_ADMIN',
      });
    }

    try {
      // 3. ทำการอัปเดตสถานะ
      const updatedStatusUser = await this.prisma.user.update({
        where: { id: targetUserId },
        data: { isActive: isActive }, // true = ใช้งานได้ปกติ, false = โดนแบน
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true, // ส่งกลับไปเพื่อให้หน้าบ้านอัปเดต UI ว่าแบนสำเร็จแล้ว
        },
      });

      return updatedStatusUser;
    } catch (error) {
      console.error('[UserService.toggleUserStatus] Error:', error);
      throw new InternalServerErrorException({
        message: 'เปลี่ยนสถานะผู้ใช้งานไม่สำเร็จ โปรดลองใหม่อีกครั้ง',
        code: 'TOGGLE_STATUS_FAILED',
      });
    }
  }

  async getAllUsers(getAllUserDto: GetAllUserDto) {
    try {
      const { search, page = 1, limit = 10 } = getAllUserDto;
      // 1. สร้างเงื่อนไขการค้นหา (ถ้ามี search ส่งมา)
      // ค้นหาจากชื่อ, นามสกุล หรือ อีเมล แบบไม่สนตัวพิมพ์เล็ก-ใหญ่ (insensitive)
      const where: Prisma.UserWhereInput = search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      // 2. รันคำสั่งหาจำนวนทั้งหมด และดึงข้อมูลจริงไปพร้อมกัน (ใช้ Promise.all เพื่อความเร็ว)
      const [totalItems, users] = await Promise.all([
        this.prisma.user.count({ where }),
        this.prisma.user.findMany({
          where,
          skip: (page - 1) * limit, // คำนวณจุดเริ่มต้น
          take: limit, // จำนวนที่ต้องการดึง
          orderBy: { createdAt: 'desc' },
          omit: { password: true }, // ไม่เอา password (Prisma v5.x)
        }),
      ]);

      // 3. คำนวณข้อมูลสำหรับการทำ Pagination ให้หน้าบ้าน
      const lastPage = Math.ceil(totalItems / limit);

      return {
        users,
        meta: {
          totalItems,
          itemCount: users.length,
          itemsPerPage: limit,
          totalPages: lastPage,
          currentPage: page,
          hasNextPage: page < lastPage,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('[UserService.getAllUsers] Error:', error);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้ในขณะนี้',
        code: 'FETCH_USERS_FAILED',
      });
    }
  }

  async getAddresses(userId: string) {
    try {
      const addresses = await this.prisma.address.findMany({
        where: { userId },
        orderBy: [
          { isDefault: 'desc' }, // ให้ที่อยู่หลัก (true) ขึ้นมาเป็นอันดับ 1
          { createdAt: 'desc' }, // เรียงตามเวลาที่สร้าง
        ],
      });
      return addresses; // คืนค่าเป็น Array []
    } catch (error) {
      console.log('error from get addresses', error);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถดึงข้อมูลที่อยู่ได้',
        code: 'GET_ADDRESSES_FAILED',
      });
    }
  }

  async createAddress(userId: string, addressDto: AddressDto) {
    try {
      await this.findById(userId); // เช็คว่ามี User ไหม

      const addressCount = await this.prisma.address.count({
        where: { userId },
      });

      // 🌟 2. ถ้ามีครบ 4 แล้ว ให้หยุดและแจ้งเตือนทันที
      if (addressCount >= 4) {
        throw new ForbiddenException({
          message: 'คุณสามารถเพิ่มที่อยู่ได้สูงสุด 4 ที่อยู่เท่านั้น',
          code: 'ADDRESS_LIMIT_REACHED',
        });
      }

      addressDto.isDefault = true;

      return await this.prisma.$transaction(async (prisma) => {
        // ถ้าผู้ใช้เลือกให้เป็น "ที่อยู่เริ่มต้น" ต้องไปปลดที่อยู่อื่นๆ ให้เป็น false ก่อน
        if (addressDto.isDefault) {
          await prisma.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
          });
        }

        // สร้างที่อยู่ใหม่
        const newAddress = await prisma.address.create({
          data: {
            ...addressDto,
            userId,
          },
        });

        return newAddress;
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(`[createAddress] Error for user ${userId}:`, error);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถเพิ่มที่อยู่ใหม่ได้ โปรดลองใหม่อีกครั้ง',
        code: 'CREATE_ADDRESS_FAILED',
      });
    }
  }

  // 🌟 2.2 ฟังก์ชันแก้ไขที่อยู่เดิม (ต้องรับ addressId มาด้วย)
  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    try {
      // ตรวจสอบว่าที่อยู่นี้เป็นของ User คนนี้จริงๆ ป้องกันการแก้ข้ามคน
      const existingAddress = await this.prisma.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!existingAddress) {
        throw new NotFoundException({
          message: 'ไม่พบที่อยู่ที่ต้องการแก้ไข',
          code: 'ADDRESS_NOT_FOUND',
        });
      }

      return await this.prisma.$transaction(async (prisma) => {
        // ถ้าผู้ใช้ตั้งค่าให้อันนี้เป็นค่าเริ่มต้นใหม่ ต้องปลดอันเก่าออก
        if (updateAddressDto.isDefault) {
          await prisma.address.updateMany({
            where: { userId, isDefault: true, id: { not: addressId } },
            data: { isDefault: false },
          });
        }

        // อัปเดตข้อมูล
        const updatedAddress = await prisma.address.update({
          where: { id: addressId },
          data: { ...updateAddressDto },
        });

        return updatedAddress;
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(`[updateAddress] Error:`, error);
      throw new InternalServerErrorException({
        message: 'ไม่สามารถอัปเดตที่อยู่ได้ โปรดลองใหม่อีกครั้ง',
        code: 'UPDATE_ADDRESS_FAILED',
      });
    }
  }

  // 🌟 3. ฟังก์ชันลบที่อยู่
  async deleteAddress(userId: string, addressId: string) {
    try {
      const existingAddress = await this.prisma.address.findFirst({
        where: { id: addressId, userId },
      });

      if (!existingAddress) {
        throw new NotFoundException({
          message: 'ไม่พบที่อยู่ที่ต้องการลบ',
          code: 'ADDRESS_NOT_FOUND',
        });
      }

      await this.prisma.$transaction(async (prisma) => {
        // 1. ลบทิ้งไปก่อน
        await prisma.address.delete({
          where: { id: addressId },
        });

        // 2. ✨ ถ้าอันที่เพิ่งลบไปเป็น "ค่าเริ่มต้น" ให้หาอันอื่นมาเป็นแทน
        if (existingAddress.isDefault) {
          const remainingAddress = await prisma.address.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }, // เอาที่อยู่ที่เพิ่มล่าสุดมาเป็นแทน
          });

          // ถ้ายังมีที่อยู่เหลืออยู่ ค่อยอัปเดตให้เป็นค่าเริ่มต้น
          if (remainingAddress) {
            await prisma.address.update({
              where: { id: remainingAddress.id },
              data: { isDefault: true },
            });
          }
        }
      });

      return;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(`[deleteAddress] Error:`, error);

      throw new InternalServerErrorException({
        message: 'ไม่สามารถลบที่อยู่ได้ โปรดลองใหม่อีกครั้ง',
        code: 'DELETE_ADDRESS_FAILED',
      });
    }
  }

  // ดำิ่ม active user couint
  async getUserStats() {
    const [totalItems, activeCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);
    return { totalItems, activeCount };
  }
}
