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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
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

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar backup en formato CSV' })
  @ApiResponse({ status: 200, description: 'Archivo CSV generado' })
  async exportCsv(@Res() res: Response) {
    const csv = await this.transactionsService.exportToCsv();
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
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    return this.transactionsService.importFromCsv(file);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener transacción por ID' })
  @ApiResponse({ status: 200, description: 'Transacción encontrada' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar transacción' })
  @ApiResponse({ status: 200, description: 'Transacción actualizada' })
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar transacción' })
  @ApiResponse({ status: 200, description: 'Transacción eliminada' })
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(+id);
  }
}
