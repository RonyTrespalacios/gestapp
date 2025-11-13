import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MEDIOS_PAGO } from './liquidity-balance.entity';

@Entity('liquidity_history')
export class LiquidityHistory {
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

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;
}

