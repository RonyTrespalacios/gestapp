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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva transacción' })
  @ApiResponse({ status: 201, description: 'Transacción creada exitosamente' })
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las transacciones' })
  @ApiResponse({ status: 200, description: 'Lista de transacciones' })
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get('export/sql')
  @ApiOperation({ summary: 'Exportar backup en formato SQL' })
  @ApiResponse({ status: 200, description: 'Archivo SQL generado' })
  async exportSql(@Res() res: Response) {
    const sql = await this.transactionsService.exportToSql();
    const filename = `gestapp_backup_${new Date().toISOString().split('T')[0]}.sql`;
    
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send(sql);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener transacción por ID' })
  @ApiResponse({ status: 200, description: 'Transacción encontrada' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar transacción' })
  @ApiResponse({ status: 200, description: 'Transacción actualizada' })
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar transacción' })
  @ApiResponse({ status: 200, description: 'Transacción eliminada' })
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}
