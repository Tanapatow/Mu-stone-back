import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { OrderStatus } from 'src/database/generated/prisma/enums';

export class GetAllOrderDto {
  @IsOptional()
  @Type(() => Number) // แปลง string จาก Query ให้เป็น Number อัตโนมัติ
  @IsInt({ message: 'Page ต้องเป็นตัวเลขจำนวนเต็ม' })
  @Min(1, { message: 'Page ต้องมีค่าอย่างน้อย 1' })
  page?: number = 1; // ค่า Default คือ 1

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit ต้องเป็นตัวเลขจำนวนเต็ม' })
  @Min(1, { message: 'Limit ต้องมีค่าอย่างน้อย 1' })
  limit?: number = 10; // ค่า Default คือ 10

  @IsOptional()
  @IsEnum(OrderStatus, {
    message: 'Status ไม่ถูกต้อง (ต้องเป็น PENDING, PAID,SHIPPED,CANCELLED)',
  })
  status?: OrderStatus;
}
