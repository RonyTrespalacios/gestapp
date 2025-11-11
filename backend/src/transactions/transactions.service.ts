import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async create(createTransactionDto: CreateTransactionDto, userId: number): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      userId,
    });
    
    // Calcular el valor basado en el tipo
    transaction.valor = 
      createTransactionDto.tipo === 'Egreso' 
        ? -Math.abs(createTransactionDto.monto)
        : Math.abs(createTransactionDto.monto);

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
    
    Object.assign(transaction, updateTransactionDto);
    
    // Recalcular el valor si se actualiza el tipo o monto
    if (updateTransactionDto.tipo || updateTransactionDto.monto) {
      const tipo = updateTransactionDto.tipo || transaction.tipo;
      const monto = updateTransactionDto.monto || transaction.monto;
      transaction.valor = tipo === 'Egreso' ? -Math.abs(monto) : Math.abs(monto);
    }

    return await this.transactionRepository.save(transaction);
  }

  async remove(id: number, userId: number): Promise<void> {
    const transaction = await this.findOne(id, userId);
    await this.transactionRepository.remove(transaction);

    // Si el usuario ya no tiene transacciones, reiniciar su secuencia
    const total = await this.transactionRepository.count({ where: { userId } });
    if (total === 0) {
      await this.transactionRepository.query('ALTER SEQUENCE "transactions_id_seq" RESTART WITH 1');
    }
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
    let imported = 0;

    for (const line of dataLines) {
      try {
        const values = this.parseCSVLine(line);
        
        if (values.length < 8) continue;

        const [idStr, categoria, descripcion, tipo, monto, medio, fecha, observaciones] = values;

        // Crear objeto base de transacción (sin ID, siempre asignar al usuario actual)
        const transactionData: any = {
          userId,
          categoria,
          descripcion: descripcion.replace(/""/g, '"'),
          tipo,
          monto: parseFloat(monto),
          medio,
          fecha: new Date(fecha),
          observaciones: observaciones ? observaciones.replace(/""/g, '"') : null,
        };

        const transaction = this.transactionRepository.create(transactionData) as unknown as Transaction;
        transaction.valor = tipo === 'Egreso' 
          ? -Math.abs(parseFloat(monto))
          : Math.abs(parseFloat(monto));

        await this.transactionRepository.save(transaction);
        imported++;
      } catch (error) {
        console.error('Error processing line:', line, error);
      }
    }

    return { imported };
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
}
