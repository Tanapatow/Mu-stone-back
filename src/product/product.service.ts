import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CloudinaryService } from 'src/shared/upload/cloudinary.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { GetAllProductsDto } from './dtos/get-all-product.dto';
import { Prisma } from 'src/database/generated/prisma/client';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException({
        message: 'กรุณาอัปโหลดรูปภาพสินค้าอย่างน้อย 1 รูป',
        code: 'PRODUCT_IMAGE_REQUIRED',
      });
    }

    try {
      const uploadPromises = files.map((file) =>
        this.cloudinary.upload(file, 'mu_stone/products'),
      );

      // รอให้อัปโหลดเสร็จทุกรูป
      const cloudinaryResults = await Promise.all(uploadPromises);

      // ดึงเอาเฉพาะ URL ของรูป (secure_url) มาใช้งาน
      const uploadedImageUrls = cloudinaryResults.map(
        (result) => result.secure_url,
      );

      const imageRecords = uploadedImageUrls.map((url, index) => ({
        url: url,
        isMain: index === 0,
        displayOrder: index + 1,
      }));

      const newProduct = await this.prisma.product.create({
        data: {
          ...createProductDto,
          images: {
            create: imageRecords,
          },
        },
        include: {
          images: true,
        },
      });

      return {
        newProduct,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw new InternalServerErrorException({
        message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า',
        code: 'PRODUCT_CREATE_FAILED',
      });
    }
  }

  async findAll(filter: GetAllProductsDto) {
    try {
      const {
        page = 1,
        limit = 9,
        search,
        stoneType,
        sortBy = 'createdAt',
        order = 'desc',
      } = filter;

      const skip = (page - 1) * limit;
      const take = limit;

      // 🛡️ ประกาศ Type ชัดเจน (VS Code จะช่วยเช็คคำผิดให้)
      const whereCondition: Prisma.ProductWhereInput = {
        isActive: true, // ดึงเฉพาะสินค้าที่ยังเปิดขาย
      };

      // 🔍 ถ้ามีการค้นหา
      if (search) {
        whereCondition.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (stoneType) {
        whereCondition.stoneType = stoneType;
      }

      // ⚡ ยิง Database พร้อมกัน 2 คำสั่งเพื่อความรวดเร็ว
      const [products, totalCount] = await Promise.all([
        this.prisma.product.findMany({
          where: whereCondition,
          skip,
          take,
          orderBy: {
            [sortBy]: order,
          },
          include: {
            images: {
              orderBy: { displayOrder: 'asc' }, // เอารูปหน้าปกขึ้นก่อนเสมอ
            },
          },
        }),
        this.prisma.product.count({
          where: whereCondition,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      // 📦 ส่งข้อมูลกลับไปแบบมีมาตรฐาน
      return {
        data: products,
        meta: {
          totalItems: totalCount,
          itemCount: products.length,
          itemsPerPage: limit,
          totalPages: totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new InternalServerErrorException({
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า',
        code: 'PRODUCT_FETCH_FAILED',
      });
    }
  }

  async findById(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: id },
        include: {
          images: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (!product) {
        throw new NotFoundException({
          message: `ไม่พบสินค้า ID: ${id} ในระบบ`,
          code: 'PRODUCT_NOT_FOUND',
        });
      }
      return {
        data: product,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า',
        code: 'PRODUCT_FETCH_FAILED',
      });
    }
  }
}
