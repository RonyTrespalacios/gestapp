import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GeminiService } from './gemini.service';

class ParseTransactionDto {
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
