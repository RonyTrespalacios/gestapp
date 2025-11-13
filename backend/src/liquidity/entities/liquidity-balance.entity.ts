import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export const MEDIOS_PAGO = [
  'Efectivo',
  'NU',
  'Daviplata',
  'Nequi',
  'BBVA',
  'Bancolombia',
  'Davivienda',
  'Otro',
] as const;

@Entity('liquidity_balances')
@Unique(['userId', 'medio'])
export class LiquidityBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: MEDIOS_PAGO,
  })
  medio: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

