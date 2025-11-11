import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { GeminiService } from './gemini.service';

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
