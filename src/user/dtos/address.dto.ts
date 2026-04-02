import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddressDto {
  @IsOptional()
  @IsString({ message: 'ชื่อเรียกที่อยู่ต้องเป็นตัวอักษร' })
  title?: string;

  @IsOptional()
  @IsBoolean({
    message: 'การตั้งเป็นค่าเริ่มต้นต้องเป็น true หรือ false เท่านั้น',
  })
  isDefault?: boolean;
  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกชื่อผู้รับ' })
  receiverName: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกเบอร์โทรศัพท์' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกที่อยู่' })
  addressLine1: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกตำบล/แขวง' })
  subDistrict: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกอำเภอ/เขต' })
  district: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกจังหวัด' })
  province: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกรหัสไปรษณีย์' })
  postalCode: string;
}
