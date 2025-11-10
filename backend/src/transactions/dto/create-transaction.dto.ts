import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    enum: ['Necesidad', 'Lujo', 'Ahorro', 'Entrada'],
    description: 'Categoría de la transacción',
  })
  @IsEnum(['Necesidad', 'Lujo', 'Ahorro', 'Entrada'])
  categoria: string;

  @ApiProperty({ description: 'Descripción de la transacción' })
  @IsString()
  descripcion: string;

  @ApiProperty({
    enum: ['Ingreso', 'Egreso', 'Ahorro'],
    description: 'Tipo de transacción',
  })
  @IsEnum(['Ingreso', 'Egreso', 'Ahorro'])
  tipo: string;

  @ApiProperty({ description: 'Monto en COP', minimum: 0 })
  @IsNumber()
  @Min(0)
  monto: number;

  @ApiProperty({
    enum: ['Efectivo', 'NU', 'Daviplata', 'Nequi', 'BBVA', 'Bancolombia', 'Davivienda', 'Otro'],
    description: 'Medio de pago',
  })
  @IsEnum(['Efectivo', 'NU', 'Daviplata', 'Nequi', 'BBVA', 'Bancolombia', 'Davivienda', 'Otro'])
  medio: string;

  @ApiProperty({ description: 'Fecha de la transacción (YYYY-MM-DD)' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ description: 'Observaciones adicionales', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
