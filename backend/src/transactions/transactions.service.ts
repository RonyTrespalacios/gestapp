import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepository.create(createTransactionDto);
    
    // Calcular el valor basado en el tipo
    transaction.valor = 
      createTransactionDto.tipo === 'Egreso' 
        ? -Math.abs(createTransactionDto.monto)
        : Math.abs(createTransactionDto.monto);

    return await this.transactionRepository.save(transaction);
  }

  async findAll(): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      order: { fecha: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
    }
    return transaction;
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id);
    
    Object.assign(transaction, updateTransactionDto);
    
    // Recalcular el valor si se actualiza el tipo o monto
    if (updateTransactionDto.tipo || updateTransactionDto.monto) {
      const tipo = updateTransactionDto.tipo || transaction.tipo;
      const monto = updateTransactionDto.monto || transaction.monto;
      transaction.valor = tipo === 'Egreso' ? -Math.abs(monto) : Math.abs(monto);
    }

    return await this.transactionRepository.save(transaction);
  }

  async remove(id: number): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionRepository.remove(transaction);
  }

  async exportToCsv(): Promise<string> {
    const transactions = await this.findAll();
    
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

  async importFromCsv(file: Express.Multer.File): Promise<{ imported: number }> {
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
        const id = parseInt(idStr, 10);

        // Crear objeto base de transacción
        const transactionData: any = {
          categoria,
          descripcion: descripcion.replace(/""/g, '"'),
          tipo,
          monto: parseFloat(monto),
          medio,
          fecha: new Date(fecha),
          observaciones: observaciones ? observaciones.replace(/""/g, '"') : null,
        };

        // Si el ID es válido y no existe, intentar usar ese ID
        if (id && !isNaN(id)) {
          const exists = await this.transactionRepository.findOne({ where: { id } });
          if (!exists) {
            transactionData.id = id;
          }
          // Si existe, no usar el ID (se generará automáticamente)
        }

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
