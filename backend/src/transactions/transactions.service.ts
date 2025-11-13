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

    // Crear transacción sin ID (la base de datos lo asignará automáticamente)
    const transaction = this.transactionRepository.create({
      categoria: createTransactionDto.categoria,
      descripcion: createTransactionDto.descripcion,
      tipo: createTransactionDto.tipo,
      monto,
      medio: createTransactionDto.medio,
      fecha: new Date(createTransactionDto.fecha),
      observaciones: createTransactionDto.observaciones,
      userId,
    });
    
    // Calcular el valor basado en el tipo
    transaction.valor = this.calculateValor(createTransactionDto.tipo, monto);

    try {
      return await this.transactionRepository.save(transaction);
    } catch (error: any) {
      // Si hay un error de duplicate key, la secuencia está desincronizada
      // Sincronizamos automáticamente y reintentamos UNA VEZ
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        this.logger.warn('Secuencia de IDs desincronizada detectada. Sincronizando automáticamente...');
        await this.syncSequence();
        // Reintentar después de sincronizar (solo una vez)
        return await this.transactionRepository.save(transaction);
      }
      // Si es otro tipo de error, lo lanzamos normalmente
      throw error;
    }
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
  }

  async removeAllForUser(userId: number): Promise<{ deleted: number }> {
    const result = await this.transactionRepository.delete({ userId });
    const deleted = result.affected ?? 0;

    return { deleted };
  }

  async exportToCsv(userId: number): Promise<string> {
    const transactions = await this.findAll(userId);
    
    // CSV Header (sin ID)
    let csv = 'categoria,descripcion,tipo,monto,medio,fecha,observaciones,valor\n';
    
    // CSV Rows (sin ID)
    transactions.forEach(t => {
      const row = [
        t.categoria,
        `"${t.descripcion.replace(/"/g, '""')}"`,
        t.tipo,
        t.monto,
        t.medio,
        t.fecha,
        t.observaciones ? `"${t.observaciones.replace(/""/g, '"')}"` : '',
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

    // Parse header to detect column positions
    const headerColumns = this.parseCSVLine(lines[0]).map(col => col.toLowerCase().trim());
    
    // Find column indices (ignore ID if present)
    const idIndex = headerColumns.indexOf('id');
    const categoriaIndex = headerColumns.indexOf('categoria');
    const descripcionIndex = headerColumns.indexOf('descripcion');
    const tipoIndex = headerColumns.indexOf('tipo');
    const montoIndex = headerColumns.indexOf('monto');
    const medioIndex = headerColumns.indexOf('medio');
    const fechaIndex = headerColumns.indexOf('fecha');
    const observacionesIndex = headerColumns.indexOf('observaciones');
    const valorIndex = headerColumns.indexOf('valor');

    // Validate required columns
    if (categoriaIndex === -1 || descripcionIndex === -1 || tipoIndex === -1 || 
        montoIndex === -1 || medioIndex === -1 || fechaIndex === -1) {
      throw new BadRequestException('El archivo CSV debe contener las columnas: categoria, descripcion, tipo, monto, medio, fecha');
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

      // Get values by column index (skip ID if present)
      const categoria = values[categoriaIndex]?.trim();
      const descripcion = values[descripcionIndex]?.trim();
      const tipo = values[tipoIndex]?.trim();
      const montoStr = values[montoIndex]?.trim();
      const medio = values[medioIndex]?.trim();
      const fechaStr = values[fechaIndex]?.trim();
      const observaciones = observacionesIndex !== -1 ? values[observacionesIndex]?.trim() : '';

      // Validate required fields
      if (!categoria || !descripcion || !tipo || !montoStr || !medio || !fechaStr) {
        errors.push(`Fila ${rowNumber}: Faltan campos requeridos.`);
        return;
      }

      try {
        this.ensureValidCategoria(categoria);
        this.ensureValidTipo(tipo);
        this.ensureValidMedio(medio);

        const monto = this.ensureValidMonto(montoStr);
        
        // Try to parse date in different formats
        let fecha: Date;
        if (fechaStr.includes('/')) {
          // Format: DD/MM/YYYY or MM/DD/YYYY
          const parts = fechaStr.split('/');
          if (parts.length === 3) {
            // Assume DD/MM/YYYY format
            fecha = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            fecha = new Date(fechaStr);
          }
        } else {
          fecha = new Date(fechaStr);
        }

        if (Number.isNaN(fecha.getTime())) {
          throw new BadRequestException('La fecha no tiene un formato válido. Use YYYY-MM-DD o DD/MM/YYYY.');
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

    try {
      await this.transactionRepository.save(transactionsToSave);
      return { imported: transactionsToSave.length };
    } catch (error: any) {
      // Si hay un error de duplicate key durante la importación masiva,
      // sincronizamos la secuencia y reintentamos
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        this.logger.warn('Secuencia desincronizada durante importación. Sincronizando...');
        await this.syncSequence();
        // Reintentar después de sincronizar
        await this.transactionRepository.save(transactionsToSave);
        return { imported: transactionsToSave.length };
      }
      // Si es otro tipo de error, lo lanzamos normalmente
      throw error;
    }
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


  /**
   * Sincroniza la secuencia de IDs de PostgreSQL con el valor máximo actual en la tabla.
   * Esto corrige problemas de secuencia desincronizada sin perder datos.
   * 
   * La secuencia se puede desincronizar por:
   * - Inserciones directas en la base de datos con IDs explícitos
   * - Importaciones masivas que no respetaron la secuencia
   * - Operaciones manuales en la base de datos
   * 
   * Esta función es segura porque:
   * - Solo actualiza la secuencia al siguiente valor disponible
   * - No modifica datos existentes
   * - Funciona correctamente con múltiples usuarios
   */
  private async syncSequence(): Promise<void> {
    try {
      // Sincronizar la secuencia al siguiente valor disponible después del máximo ID actual
      // Esto corrige la desincronización sin afectar datos existentes
      // GREATEST asegura que si la secuencia ya es mayor, se mantenga; si es menor, se actualiza
      const result = await this.transactionRepository.query(
        `SELECT setval('transactions_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM transactions) + 1, (SELECT last_value FROM transactions_id_seq)), false) as next_val`
      );
      
      const nextVal = result[0]?.next_val || 'N/A';
      this.logger.log(`Secuencia sincronizada. Próximo ID será: ${nextVal}`);
    } catch (error) {
      this.logger.error(`Error al sincronizar la secuencia: ${this.extractErrorMessage(error)}`);
      // No lanzamos el error para no interrumpir el flujo, pero lo registramos
      // Si la sincronización falla, el siguiente intento detectará el error nuevamente
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
