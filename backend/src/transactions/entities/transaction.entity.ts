import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['Necesidad', 'Lujo', 'Ahorro', 'Entrada'],
  })
  categoria: string;

  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: ['Ingreso', 'Egreso', 'Ahorro'],
  })
  tipo: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  monto: number;

  @Column({
    type: 'enum',
    enum: [
      'Efectivo',
      'NU',
      'Daviplata',
      'Nequi',
      'BBVA',
      'Bancolombia',
      'Davivienda',
      'Otro',
    ],
  })
  medio: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  valor: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
