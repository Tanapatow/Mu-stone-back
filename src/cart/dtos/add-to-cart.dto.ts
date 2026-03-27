import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
