import { IsNotEmpty, IsString } from 'class-validator';

export class AddressDto {
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
