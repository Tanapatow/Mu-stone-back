import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateCartDto {
  @IsNotEmpty({ message: 'กรุณาส่ง quantity มาด้วย' })
  @IsNumber({}, { message: 'quantity ต้องเป็นตัวเลขจำนวนเต็มเท่านั้น' })
  quantity: number;
}
