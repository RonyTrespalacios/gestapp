import { Injectable, signal } from '@angular/core';
import { Transaction } from './transaction.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionStateService {
  // Usando Angular Signal para mejor reactividad
  private transactionToEditSignal = signal<Transaction | null>(null);

  setTransactionToEdit(transaction: Transaction): void {
    console.log('🔵 Guardando transacción para editar:', transaction);
    this.transactionToEditSignal.set({ ...transaction });
  }

  getTransactionToEdit(): Transaction | null {
    const transaction = this.transactionToEditSignal();
    console.log('🟢 Obteniendo transacción para editar:', transaction);
    return transaction;
  }

  clearTransactionToEdit(): void {
    console.log('🔴 Limpiando transacción para editar');
    this.transactionToEditSignal.set(null);
  }
}
