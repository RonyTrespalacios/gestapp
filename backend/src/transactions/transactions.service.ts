import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  private static readonly CATEGORIAS_VALIDAS = ['Necesidad', 'Lujo', 'Ahorro', 'Entrada'] as const;
  private static readonly TIPOS_VALIDOS = ['Ingreso', 'Egreso', 'Ahorro'] as const;
  private static readonly MEDIOS_VALIDOS = [
    'Efectivo',
    'NU',
    'Daviplata',
    'Nequi',
    'BBVA',
    'Bancolombia',
    'Davivienda',
    'Otro',
  ] as const;

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, userId: number): Promise<Transaction> {
    const monto = this.ensureValidMonto(createTransactionDto.monto);
    this.ensureValidTipo(createTransactionDto.tipo);
    this.ensureValidCategoria(createTransactionDto.categoria);
    this.ensureValidMedio(createTransactionDto.medio);

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      monto,
      userId,
      fecha: new Date(createTransactionDto.fecha),
    });
    
    // Calcular el valor basado en el tipo
    transaction.valor = this.calculateValor(createTransactionDto.tipo, monto);

    return await this.transactionRepository.save(transaction);
  }

  async findAll(userId: number): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: { userId },
      order: { fecha: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ 
      where: { id, userId } 
    });
    if (!transaction) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
    }
    return transaction;
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto, userId: number): Promise<Transaction> {
    const transaction = await this.findOne(id, userId);
    
    if (updateTransactionDto.tipo) {
      this.ensureValidTipo(updateTransactionDto.tipo);
    }

    if (updateTransactionDto.categoria) {
      this.ensureValidCategoria(updateTransactionDto.categoria);
    }

    if (updateTransactionDto.medio) {
      this.ensureValidMedio(updateTransactionDto.medio);
    }

    if (updateTransactionDto.fecha) {
      transaction.fecha = new Date(updateTransactionDto.fecha);
      if (Number.isNaN(transaction.fecha.getTime())) {
        throw new BadRequestException('La fecha proporcionada no es válida.');
      }
    }

    Object.assign(transaction, updateTransactionDto);
    
    // Recalcular el valor si se actualiza el tipo o monto
    if (updateTransactionDto.tipo || updateTransactionDto.monto) {
      const tipo = updateTransactionDto.tipo || transaction.tipo;
      const montoBase =
        updateTransactionDto.monto !== undefined
          ? this.ensureValidMonto(updateTransactionDto.monto)
          : transaction.monto;

      transaction.monto = montoBase;
      transaction.valor = this.calculateValor(tipo, montoBase);
    }

    return await this.transactionRepository.save(transaction);
  }

  async remove(id: number, userId: number): Promise<void> {
    const transaction = await this.findOne(id, userId);
    await this.transactionRepository.remove(transaction);

    await this.resetSequenceIfNoTransactions(userId);
  }

  async removeAllForUser(userId: number): Promise<{ deleted: number }> {
    const result = await this.transactionRepository.delete({ userId });
    const deleted = result.affected ?? 0;

    if (deleted >= 0) {
      await this.resetSequenceIfNoTransactions(userId);
    }

    return { deleted };
  }

  async exportToCsv(userId: number): Promise<string> {
    const transactions = await this.findAll(userId);
    
    // CSV Header
    let csv = 'id,categoria,descripcion,tipo,monto,medio,fecha,observaciones,valor\n';
    
    // CSV Rows
    transactions.forEach(t => {
      const row = [
        t.id,
        t.categoria,
        `"${t.descripcion.replace(/"/g, '""')}"`,
        t.tipo,
        t.monto,
        t.medio,
        t.fecha,
        t.observaciones ? `"${t.observaciones.replace(/"/g, '""')}"` : '',
        t.valor,
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  async importFromCsv(file: Express.Multer.File, userId: number): Promise<{ imported: number }> {
    if (!file) {
      throw new Error('No se proporcionó archivo');
    }

    const content = file.buffer.toString('utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('El archivo CSV está vacío');
    }

    // Skip header
    const dataLines = lines.slice(1);
    const transactionsToSave: Transaction[] = [];
    const errors: string[] = [];

    dataLines.forEach((line, index) => {
      const rowNumber = index + 2; // +2 to account for header and 0-based index

      if (!line.trim()) {
        return;
      }

      const values = this.parseCSVLine(line);

      if (values.length < 8) {
        errors.push(`Fila ${rowNumber}: Formato incompleto.`);
        return;
      }

      const [, categoria, descripcion, tipo, montoStr, medio, fechaStr, observaciones] = values;

      try {
        this.ensureValidCategoria(categoria);
        this.ensureValidTipo(tipo);
        this.ensureValidMedio(medio);

        const monto = this.ensureValidMonto(montoStr);
        const fecha = new Date(fechaStr);

        if (Number.isNaN(fecha.getTime())) {
          throw new BadRequestException('La fecha no tiene un formato válido (YYYY-MM-DD).');
        }

        const transaction = this.transactionRepository.create({
          userId,
          categoria,
          descripcion: descripcion.replace(/""/g, '"'),
          tipo,
          monto,
          medio,
          fecha,
          observaciones: observaciones ? observaciones.replace(/""/g, '"') : null,
        });

        transaction.valor = this.calculateValor(tipo, monto);

        transactionsToSave.push(transaction);
      } catch (error) {
        const message = this.extractErrorMessage(error);
        errors.push(`Fila ${rowNumber}: ${message}`);
      }
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'El archivo contiene errores de formato.',
        details: errors,
      });
    }

    if (!transactionsToSave.length) {
      throw new BadRequestException('El archivo CSV no contiene transacciones válidas.');
    }

    await this.transactionRepository.save(transactionsToSave);
    return { imported: transactionsToSave.length };
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private ensureValidMonto(value: unknown): number {
    if (value === null || value === undefined) {
      throw new BadRequestException('El monto es obligatorio.');
    }

    const numericValue =
      typeof value === 'string'
        ? Number(value.replace(/,/g, '').trim())
        : Number(value);

    if (!Number.isFinite(numericValue)) {
      throw new BadRequestException('El monto debe ser un número válido.');
    }

    if (numericValue < 0) {
      throw new BadRequestException('El monto debe ser un número positivo.');
    }

    return numericValue;
  }

  private calculateValor(tipo: string, monto: number): number {
    if (tipo === 'Egreso') {
      return -Math.abs(monto);
    }

    return Math.abs(monto);
  }

  private ensureValidCategoria(value: string): void {
    if (!TransactionsService.CATEGORIAS_VALIDAS.includes(value as any)) {
      throw new BadRequestException(
        `Categoría inválida. Valores permitidos: ${TransactionsService.CATEGORIAS_VALIDAS.join(', ')}.`,
      );
    }
  }

  private ensureValidTipo(value: string): void {
    if (!TransactionsService.TIPOS_VALIDOS.includes(value as any)) {
      throw new BadRequestException(
        `Tipo inválido. Valores permitidos: ${TransactionsService.TIPOS_VALIDOS.join(', ')}.`,
      );
    }
  }

  private ensureValidMedio(value: string): void {
    if (!TransactionsService.MEDIOS_VALIDOS.includes(value as any)) {
      throw new BadRequestException(
        `Medio inválido. Valores permitidos: ${TransactionsService.MEDIOS_VALIDOS.join(', ')}.`,
      );
    }
  }

  private async resetSequenceIfNoTransactions(userId: number): Promise<void> {
    const userTotal = await this.transactionRepository.count({ where: { userId } });
    
    // Solo reiniciar la secuencia si el usuario no tiene transacciones
    // Y si la tabla está completamente vacía (sin transacciones de ningún usuario)
    if (userTotal === 0) {
      const globalTotal = await this.transactionRepository.count();
      
      // Solo reiniciar si la tabla está completamente vacía
      if (globalTotal === 0) {
        try {
          await this.transactionRepository.query('ALTER SEQUENCE IF EXISTS "transactions_id_seq" RESTART WITH 1');
        } catch (error) {
          this.logger.warn(`No se pudo reiniciar la secuencia de transacciones: ${this.extractErrorMessage(error)}`);
        }
      }
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof BadRequestException) {
      const response = error.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (response && typeof response === 'object') {
        const maybeMessage = (response as any).message;
        if (typeof maybeMessage === 'string') {
          return maybeMessage;
        }
        if (Array.isArray(maybeMessage)) {
          return maybeMessage.join(', ');
        }
      }
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Error desconocido';
  }
}
