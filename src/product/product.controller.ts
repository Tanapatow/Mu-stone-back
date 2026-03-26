import {
  Body,
  Controller,
  Get,
  Param,
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

  @Get()
  async getAllProduct(@Query() filter: GetAllProductsDto) {
    return await this.produceService.findAll(filter);
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return await this.produceService.findById(id);
  }
}
