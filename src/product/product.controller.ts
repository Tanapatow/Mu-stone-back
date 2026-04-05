import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ResponseMessage } from 'src/common/decorators/message-response.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductDto } from './dtos/create-product.dto';
import { GetAllProductsDto } from './dtos/get-all-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly produceService: ProductService) {}

  @ResponseMessage('Product Created')
  @Post()
  @UseInterceptors(FilesInterceptor('images', 5))
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.produceService.create(createProductDto, files);
  }

  @Public()
  @Get()
  async getAllProduct(@Query() filter: GetAllProductsDto) {
    return await this.produceService.findAll(filter);
  }

  @Public()
  @Get('stone-types')
  async getStoneTypes() {
    return await this.produceService.getStoneTypes();
  }
  @Public()
  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return await this.produceService.findById(id);
  }

  @ResponseMessage('อัปเดตข้อมูลสินค้าสำเร็จ')
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 5))
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[], // อาจจะมีหรือไม่มีไฟล์ส่งมาก็ได้
  ) {
    return await this.produceService.update(id, updateProductDto, files);
  }

  @ResponseMessage('ลบข้อมูลสินค้าเรียบร้อยแล้ว')
  @Delete(':id')
  async removeProduct(@Param('id') id: string) {
    return await this.produceService.remove(id);
  }
}
