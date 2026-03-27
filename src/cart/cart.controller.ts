import { Body, Controller, Get, Post } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';

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

  @Get()
  async getMyCart(@CurrentUser('sub') userId: string) {
    return this.cartService.getCart(userId);
  }
}
