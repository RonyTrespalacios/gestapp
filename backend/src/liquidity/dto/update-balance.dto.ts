import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { MEDIOS_PAGO } from '../entities/liquidity-balance.entity';

export class UpdateBalanceDto {
  @ApiProperty({
    enum: MEDIOS_PAGO,
    description: 'Medio de pago',
  })
  @IsEnum(MEDIOS_PAGO)
  medio: string;

  @ApiProperty({ description: 'Balance en COP', minimum: 0 })
  @IsNumber()
  @Min(0)
  balance: number;
}

