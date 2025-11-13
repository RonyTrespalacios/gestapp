import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LiquidityService } from './liquidity.service';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('liquidity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('liquidity')
export class LiquidityController {
  constructor(private readonly liquidityService: LiquidityService) {}

  @Get('balances')
  @ApiOperation({ summary: 'Obtener todos los balances de liquidez' })
  @ApiResponse({ status: 200, description: 'Lista de balances' })
  getBalances(@CurrentUser() user: any) {
    return this.liquidityService.getBalances(user.userId);
  }

  @Get('total')
  @ApiOperation({ summary: 'Obtener la liquidez total (suma de todos los balances)' })
  @ApiResponse({ status: 200, description: 'Liquidez total' })
  async getTotalLiquidity(@CurrentUser() user: any) {
    const total = await this.liquidityService.getTotalLiquidity(user.userId);
    return { total };
  }

  @Post('update')
  @ApiOperation({ summary: 'Actualizar balance de un medio de pago' })
  @ApiResponse({ status: 200, description: 'Balance actualizado' })
  updateBalance(@Body() updateBalanceDto: UpdateBalanceDto, @CurrentUser() user: any) {
    return this.liquidityService.updateBalance(user.userId, updateBalanceDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Obtener historial de cambios de liquidez' })
  @ApiResponse({ status: 200, description: 'Historial de cambios' })
  getHistory(
    @CurrentUser() user: any,
    @Query('date') date?: string,
  ) {
    if (date) {
      const dateObj = new Date(date);
      return this.liquidityService.getHistoryByDate(user.userId, dateObj);
    }
    return this.liquidityService.getHistory(user.userId);
  }
}

