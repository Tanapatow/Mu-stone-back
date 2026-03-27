import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UpdateCartDto } from './dtos/update-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Roles('USER')
  @Post('add')
  async addToCart(
    @CurrentUser('sub') userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return await this.cartService.addToCart(userId, addToCartDto);
  }

  @Roles('USER')
  @Get()
  async getMyCart(@CurrentUser('sub') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Roles('USER')
  @Patch('items/:productId')
  async updateQuantity(
    @Param('productId') productId: string,
    @Body() updateCartDto: UpdateCartDto,
    @CurrentUser('sub') userId: string,
  ) {
    return await this.cartService.updateQuantity(
      userId,
      productId,
      updateCartDto,
    );
  }

  @Roles('USER')
  @Delete('items/:productId')
  async removeItem(
    @Param('productId') productId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return await this.cartService.removeItem(userId, productId);
  }
}
