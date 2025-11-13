import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiquidityService, LiquidityBalance, LiquidityHistory } from '../../services/liquidity.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-liquidity',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './liquidity.component.html',
  styleUrls: ['./liquidity.component.scss']
})
export class LiquidityComponent implements OnInit {
  balances: LiquidityBalance[] = [];
  totalLiquidity = 0;
  isLoading = false;
  isUpdating = false;
  showHistory = false;
  history: LiquidityHistory[] = [];
  historyLoading = false;
  selectedDate: string = '';
  
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'info' = 'info';

  editingBalance: { [key: string]: number } = {};

  private readonly numberFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  constructor(private liquidityService: LiquidityService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.liquidityService.getBalances().subscribe({
      next: (balances) => {
        this.balances = balances;
        this.editingBalance = {};
        balances.forEach(b => {
          this.editingBalance[b.medio] = Number(b.balance);
        });
        this.loadTotalLiquidity();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading balances:', error);
        this.showModalMessage('Error', 'Error al cargar los balances', 'error');
        this.isLoading = false;
      }
    });
  }

  loadTotalLiquidity() {
    this.liquidityService.getTotalLiquidity().subscribe({
      next: (response) => {
        this.totalLiquidity = response.total;
      },
      error: (error) => {
        console.error('Error loading total liquidity:', error);
      }
    });
  }

  updateBalance(medio: string) {
    let balance = this.editingBalance[medio];
    
    // Si el balance es null, undefined o no es un número válido, establecerlo a 0
    if (balance === null || balance === undefined || isNaN(Number(balance))) {
      balance = 0;
      this.editingBalance[medio] = 0;
    }
    
    const numericBalance = Number(balance);
    
    if (numericBalance < 0 || isNaN(numericBalance)) {
      this.showModalMessage('Error', 'El balance debe ser un número válido mayor o igual a 0', 'error');
      return;
    }

    this.isUpdating = true;
    this.liquidityService.updateBalance({ medio, balance: numericBalance }).subscribe({
      next: () => {
        this.loadData();
        // Si el historial está visible, actualizarlo también
        if (this.showHistory) {
          this.loadHistory();
        }
        this.showModalMessage('Éxito', `Balance de ${medio} actualizado correctamente`, 'success');
        this.isUpdating = false;
      },
      error: (error) => {
        console.error('Error updating balance:', error);
        this.showModalMessage('Error', 'Error al actualizar el balance', 'error');
        this.isUpdating = false;
      }
    });
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
    if (this.showHistory && this.history.length === 0) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.historyLoading = true;
    
    this.liquidityService.getHistory(this.selectedDate || undefined).subscribe({
      next: (history) => {
        this.history = history;
        this.historyLoading = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.showModalMessage('Error', 'Error al cargar el historial', 'error');
        this.historyLoading = false;
      }
    });
  }

  onDateChange() {
    if (this.showHistory) {
      this.loadHistory();
    }
  }

  formatNumber(value: number): string {
    return this.numberFormatter.format(value);
  }

  showModalMessage(title: string, message: string, type: 'success' | 'error' | 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  getMedioDisplayName(medio: string): string {
    return medio;
  }

  toNumber(value: any): number {
    return Number(value);
  }

  onBalanceFocus(medio: string, event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    if (input) {
      const currentValue = this.editingBalance[medio];
      if (currentValue === 0 || currentValue === null || currentValue === undefined) {
        setTimeout(() => {
          this.editingBalance[medio] = null as any;
          input.value = '';
          input.select();
        }, 0);
      } else {
        setTimeout(() => {
          input.select();
        }, 0);
      }
    }
  }

  onBalanceBlur(medio: string, event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    if (input) {
      const value = input.value.trim();
      if (value === '' || value === null || value === undefined) {
        this.editingBalance[medio] = 0;
        input.value = '0';
      }
    }
  }
}

