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

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
    }
    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
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

  async remove(id: string): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionRepository.remove(transaction);
  }

  async exportToSql(): Promise<string> {
    const transactions = await this.findAll();
    
    let sql = '-- Backup de GestApp\n';
    sql += `-- Fecha: ${new Date().toISOString()}\n\n`;
    sql += 'CREATE TABLE IF NOT EXISTS transactions (\n';
    sql += '  id UUID PRIMARY KEY,\n';
    sql += '  categoria VARCHAR(50) NOT NULL,\n';
    sql += '  descripcion VARCHAR(255) NOT NULL,\n';
    sql += '  tipo VARCHAR(20) NOT NULL,\n';
    sql += '  monto DECIMAL(15,2) NOT NULL,\n';
    sql += '  medio VARCHAR(50) NOT NULL,\n';
    sql += '  fecha DATE NOT NULL,\n';
    sql += '  observaciones TEXT,\n';
    sql += '  valor DECIMAL(15,2) NOT NULL,\n';
    sql += '  "createdAt" TIMESTAMP NOT NULL,\n';
    sql += '  "updatedAt" TIMESTAMP NOT NULL\n';
    sql += ');\n\n';

    transactions.forEach(t => {
      const values = [
        `'${t.id}'`,
        `'${t.categoria}'`,
        `'${t.descripcion.replace(/'/g, "''")}'`,
        `'${t.tipo}'`,
        t.monto,
        `'${t.medio}'`,
        `'${t.fecha}'`,
        t.observaciones ? `'${t.observaciones.replace(/'/g, "''")}'` : 'NULL',
        t.valor,
        `'${t.createdAt.toISOString()}'`,
        `'${t.updatedAt.toISOString()}'`,
      ];
      sql += `INSERT INTO transactions VALUES (${values.join(', ')});\n`;
    });

    return sql;
  }
}
