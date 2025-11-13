import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiquidityService } from './liquidity.service';
import { LiquidityController } from './liquidity.controller';
import { LiquidityBalance } from './entities/liquidity-balance.entity';
import { LiquidityHistory } from './entities/liquidity-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiquidityBalance, LiquidityHistory]),
  ],
  controllers: [LiquidityController],
  providers: [LiquidityService],
  exports: [LiquidityService],
})
export class LiquidityModule {}

