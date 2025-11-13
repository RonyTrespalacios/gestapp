import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiquidityBalance } from './entities/liquidity-balance.entity';
import { LiquidityHistory } from './entities/liquidity-history.entity';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { MEDIOS_PAGO } from './entities/liquidity-balance.entity';

@Injectable()
export class LiquidityService {
  constructor(
    @InjectRepository(LiquidityBalance)
    private readonly balanceRepository: Repository<LiquidityBalance>,
    @InjectRepository(LiquidityHistory)
    private readonly historyRepository: Repository<LiquidityHistory>,
  ) {}

  async getBalances(userId: number): Promise<LiquidityBalance[]> {
    // Obtener todos los balances existentes
    const balances = await this.balanceRepository.find({
      where: { userId },
      order: { medio: 'ASC' },
    });

    // Crear balances faltantes con valor 0
    const existingMedios = balances.map(b => b.medio);
    const missingMedios = MEDIOS_PAGO.filter(medio => !existingMedios.includes(medio));

    const newBalances = missingMedios.map(medio =>
      this.balanceRepository.create({
        userId,
        medio,
        balance: 0,
      }),
    );

    if (newBalances.length > 0) {
      await this.balanceRepository.save(newBalances);
      balances.push(...newBalances);
    }

    return balances.sort((a, b) => a.medio.localeCompare(b.medio));
  }

  async updateBalance(userId: number, updateBalanceDto: UpdateBalanceDto): Promise<LiquidityBalance> {
    let balance = await this.balanceRepository.findOne({
      where: { userId, medio: updateBalanceDto.medio },
    });

    if (!balance) {
      balance = this.balanceRepository.create({
        userId,
        medio: updateBalanceDto.medio,
        balance: updateBalanceDto.balance,
      });
    } else {
      balance.balance = updateBalanceDto.balance;
    }

    const savedBalance = await this.balanceRepository.save(balance);

    // Guardar en historial
    const historyEntry = this.historyRepository.create({
      userId,
      medio: updateBalanceDto.medio,
      balance: updateBalanceDto.balance,
    });
    await this.historyRepository.save(historyEntry);

    return savedBalance;
  }

  async getTotalLiquidity(userId: number): Promise<number> {
    const balances = await this.getBalances(userId);
    return balances.reduce((total, balance) => total + Number(balance.balance), 0);
  }

  async getHistory(userId: number): Promise<LiquidityHistory[]> {
    return await this.historyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getHistoryByDate(userId: number, date: Date): Promise<LiquidityHistory[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.historyRepository
      .createQueryBuilder('history')
      .where('history.userId = :userId', { userId })
      .andWhere('history.createdAt >= :startOfDay', { startOfDay })
      .andWhere('history.createdAt <= :endOfDay', { endOfDay })
      .orderBy('history.createdAt', 'DESC')
      .getMany();
  }
}

