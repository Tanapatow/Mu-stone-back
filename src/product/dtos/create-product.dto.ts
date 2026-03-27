import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

export class CreateProductDto {
  @Trim() // 👈 ทำงานก่อน เพื่อตัด Space หน้า-หลังทิ้ง
  @IsString({ message: 'ชื่อสินค้าต้องเป็นข้อความ (String) เท่านั้น' })
  @IsNotEmpty({ message: 'กรุณากรอกชื่อสินค้า' })
  name: string;

  @Trim()
  @IsString({ message: 'รายละเอียดสินค้าต้องเป็นข้อความ (String) เท่านั้น' })
  @IsNotEmpty({ message: 'กรุณากรอกรายละเอียดสินค้า' })
  description: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'ราคาต้องเป็นตัวเลขเท่านั้น' })
  @Min(0, { message: 'ราคาต้องไม่ติดลบ (เริ่มต้นที่ 0)' })
  price: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'สต็อกสินค้าต้องเป็นตัวเลขเท่านั้น' })
  @Min(0, { message: 'สต็อกสินค้าต้องไม่ติดลบ (เริ่มต้นที่ 0)' })
  stock: number;

  @Trim()
  @IsString({ message: 'ชนิดของหินต้องเป็นข้อความ (String) เท่านั้น' })
  @IsNotEmpty({ message: 'กรุณากรอกชนิดของหิน' })
  stoneType: string;

  @Trim()
  @IsString({ message: 'สรรพคุณต้องเป็นข้อความ (String) เท่านั้น' })
  @IsNotEmpty({ message: 'กรุณากรอกสรรพคุณของสินค้า' })
  benefit: string;
}
