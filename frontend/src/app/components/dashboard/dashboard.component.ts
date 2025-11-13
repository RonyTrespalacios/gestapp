import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService, Transaction } from '../../services/transaction.service';
import { LiquidityService } from '../../services/liquidity.service';
import { AiChatWidgetComponent } from '../ai-chat-widget/ai-chat-widget.component';
import { DashboardKpisComponent } from '../dashboard-kpis/dashboard-kpis.component';
import { CashFlowChartComponent } from '../cash-flow-chart/cash-flow-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AiChatWidgetComponent, DashboardKpisComponent, CashFlowChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChild('chatWidget') chatWidget?: AiChatWidgetComponent;

  transactions: Transaction[] = [];
  totalLiquidity = 0;
  isLoading = false;

  private readonly numberFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  constructor(
    private transactionService: TransactionService,
    private liquidityService: LiquidityService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    
    // Cargar transacciones
    this.transactionService.getAll().subscribe({
      next: (transactions: Transaction[]) => {
        this.transactions = transactions;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });

    // Cargar liquidez total
    this.liquidityService.getTotalLiquidity().subscribe({
      next: (response) => {
        this.totalLiquidity = response.total;
      },
      error: (error) => {
        console.error('Error loading total liquidity:', error);
      }
    });
  }

  /**
   * Calcula el flujo de caja sumando todos los valores de las transacciones
   * Los valores ya tienen en cuenta si es ingreso (positivo) o egreso (negativo)
   */
  get cashFlow(): number {
    if (!this.transactions || this.transactions.length === 0) {
      return 0;
    }
    
    return this.transactions.reduce((sum, transaction) => {
      const valor = typeof transaction.valor === 'string' 
        ? Number(transaction.valor) 
        : transaction.valor ?? 0;
      
      if (Number.isFinite(valor) && valor !== undefined && valor !== null) {
        return sum + valor;
      }
      return sum;
    }, 0);
  }

  /**
   * Calcula la discrepancia: Liquidez - Flujo de Caja
   * Trunca los decimales (convierte a entero)
   */
  get discrepancy(): number {
    const diff = this.totalLiquidity - this.cashFlow;
    // Truncar: cortar los decimales y convertir a entero
    return Math.trunc(diff);
  }

  /**
   * Formatea el flujo de caja con el signo apropiado
   */
  get formattedCashFlow(): string {
    const flow = this.cashFlow;
    const formatted = this.formatAmount(Math.abs(flow));
    return flow >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  /**
   * Formatea la liquidez total
   */
  get formattedLiquidity(): string {
    return this.formatAmount(this.totalLiquidity);
  }

  /**
   * Formatea la discrepancia con el signo apropiado
   */
  get formattedDiscrepancy(): string {
    const disc = this.discrepancy;
    // Si es cero, mostrar como cero positivo
    if (disc === 0) {
      return '+$ 0';
    }
    const formatted = this.formatAmount(Math.abs(disc));
    return disc > 0 ? `+${formatted}` : `-${formatted}`;
  }

  /**
   * Formatea un monto como moneda
   * Trunca decimales para evitar problemas de precisión
   */
  formatAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || !Number.isFinite(amount)) {
      return '$ 0';
    }
    // Redondear a 2 decimales antes de formatear
    const rounded = Math.round(amount * 100) / 100;
    return `$ ${this.numberFormatter.format(rounded)}`;
  }

  /**
   * Determina si la discrepancia es aceptable (exactamente cero)
   */
  get isDiscrepancyAcceptable(): boolean {
    return this.discrepancy === 0;
  }


  /**
   * Maneja el evento de conciliación desde el componente de KPIs
   */
  onReconcileClick() {
    // Determinar tipo de transacción según la discrepancia
    const tipo = this.discrepancy < 0 ? 'Egreso' : 'Ingreso';
    const valorAbsoluto = Math.abs(this.discrepancy);
    const tipoAjuste = this.discrepancy < 0 ? 'ajuste de gasto' : 'ajuste de ingreso';
    const valorFormateado = this.numberFormatter.format(valorAbsoluto);
    
    // Crear mensaje para el widget de chat
    const mensaje = `${tipo} de $${valorFormateado} por ${tipoAjuste} para conciliar discrepancia`;
    
    // Abrir el widget de chat con el mensaje predefinido
    setTimeout(() => {
      if (this.chatWidget) {
        this.chatWidget.openWithMessage(mensaje);
      }
    }, 300);
  }
}

