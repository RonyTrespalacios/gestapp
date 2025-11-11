import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class ParseTransactionDto {
  @ApiProperty({
    description: 'Texto del usuario describiendo la transacción',
    example: 'Ayer gasté 2500 pesos en un helado'
  })
  @IsString()
  @IsNotEmpty()
  userInput: string;
}

@ApiTags('gemini')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('parse')
  @ApiOperation({ summary: 'Parsear transacción con IA' })
  @ApiResponse({ status: 200, description: 'Transacción parseada exitosamente' })
  async parseTransaction(@Body() dto: ParseTransactionDto) {
    return await this.geminiService.parseTransaction(dto.userInput);
  }
}
