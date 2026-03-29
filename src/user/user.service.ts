import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from 'src/database/generated/prisma/client';
import { BcryptService } from 'src/shared/security/services/bcrypt.service';
import { PrismaService } from 'src/database/prisma.service';
import { PrismaClientKnownRequestError } from 'src/database/generated/prisma/internal/prismaNamespace';
import { UserWithoutPassword } from './types/user.type';
import { AddressDto } from './dtos/address.dto';

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
}
