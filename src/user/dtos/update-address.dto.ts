import { PartialType } from '@nestjs/swagger'; // หรือจาก '@nestjs/mapped-types'
import { AddressDto } from './address.dto';

export class UpdateAddressDto extends PartialType(AddressDto) {}
