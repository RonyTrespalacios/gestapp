import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva transacción' })
  @ApiResponse({ status: 201, description: 'Transacción creada exitosamente' })
  create(@Body() createTransactionDto: CreateTransactionDto, @CurrentUser() user: any) {
    return this.transactionsService.create(createTransactionDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las transacciones' })
  @ApiResponse({ status: 200, description: 'Lista de transacciones' })
  findAll(@CurrentUser() user: any) {
    return this.transactionsService.findAll(user.userId);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar backup en formato CSV' })
  @ApiResponse({ status: 200, description: 'Archivo CSV generado' })
  async exportCsv(@Res() res: Response, @CurrentUser() user: any) {
    const csv = await this.transactionsService.exportToCsv(user.userId);
    const filename = `gestapp_backup_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send(csv);
  }

  @Post('import/csv')
  @ApiOperation({ summary: 'Importar transacciones desde CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'CSV importado exitosamente' })
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.transactionsService.importFromCsv(file, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener transacción por ID' })
  @ApiResponse({ status: 200, description: 'Transacción encontrada' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transactionsService.findOne(+id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar transacción' })
  @ApiResponse({ status: 200, description: 'Transacción actualizada' })
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto, @CurrentUser() user: any) {
    return this.transactionsService.update(+id, updateTransactionDto, user.userId);
  }

  @Delete('purge')
  @ApiOperation({ summary: 'Eliminar todas las transacciones del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Transacciones del usuario eliminadas' })
  removeAll(@CurrentUser() user: any) {
    return this.transactionsService.removeAllForUser(user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar transacción' })
  @ApiResponse({ status: 200, description: 'Transacción eliminada' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transactionsService.remove(+id, user.userId);
  }
}
