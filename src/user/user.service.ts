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

  //  เพิ่มหรือแก้ไขที่อยู่จัดส่ง (Upsert Address)

  async upsertAddress(userId: string, addressDto: AddressDto) {
    try {
      await this.findById(userId);

      const address = await this.prisma.address.upsert({
        where: { userId: userId },
        update: { ...addressDto },
        create: {
          ...addressDto,
          userId: userId,
        },
      });

      return address;
    } catch (error) {
      console.error(
        `[UserService.upsertAddress] Error for user ${userId}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'ไม่สามารถบันทึกที่อยู่ได้ โปรดลองใหม่อีกครั้ง',
        code: 'UPSERT_ADDRESS_FAILED',
      });
    }
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
}
