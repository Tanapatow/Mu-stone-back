import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CloudinaryService } from 'src/shared/upload/cloudinary.service';
import { CreateProductDto } from './dtos/create-product.dto';

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
}
