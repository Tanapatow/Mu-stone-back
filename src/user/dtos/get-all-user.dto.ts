import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAllUserDto {
  @IsOptional()
  @Type(() => Number) // ✨ แปลงจาก String ใน URL ให้เป็น Number อัตโนมัติ
  @IsInt({ message: 'page ต้องเป็นตัวเลขจำนวนเต็ม' })
  @Min(1, { message: 'page ต้องมีค่าอย่างน้อย 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit ต้องเป็นตัวเลขจำนวนเต็ม' })
  @Min(1, { message: 'limit ต้องมีค่าอย่างน้อย 1' })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}
