import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsModule } from './transactions/transactions.module';
import { GeminiModule } from './gemini/gemini.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'gestapp_user'),
        password: configService.get('DATABASE_PASSWORD', 'gestapp_password'),
        database: configService.get('DATABASE_NAME', 'gestapp'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // En producción usar migraciones
        logging: false,
      }),
    }),
    UsersModule,
    AuthModule,
    TransactionsModule,
    GeminiModule,
  ],
})
export class AppModule {}
