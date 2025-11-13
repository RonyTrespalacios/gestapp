import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService, Transaction } from '../../services/transaction.service';
import { LiquidityService } from '../../services/liquidity.service';
import { AiChatWidgetComponent } from '../ai-chat-widget/ai-chat-widget.component';
import { ModalComponent } from '../modal/modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AiChatWidgetComponent, ModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChild('chatWidget') chatWidget?: AiChatWidgetComponent;

  transactions: Transaction[] = [];
  totalLiquidity = 0;
  isLoading = false;
  
  // Modales
  showInfoModal = false;
  showReconcileModal = false;

  private readonly numberFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  constructor(
    private transactionService: TransactionService,
    private liquidityService: LiquidityService,
    private router: Router
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
   * Abre el modal de información sobre la discrepancia
   */
  openInfoModal() {
    this.showInfoModal = true;
  }

  /**
   * Cierra el modal de información
   */
  closeInfoModal() {
    this.showInfoModal = false;
  }

  /**
   * Abre el modal de conciliación
   */
  openReconcileModal() {
    this.showReconcileModal = true;
  }

  /**
   * Cierra el modal de conciliación
   */
  closeReconcileModal() {
    this.showReconcileModal = false;
  }

  /**
   * Obtiene el mensaje explicativo de la discrepancia según su signo
   */
  getDiscrepancyExplanation(): string {
    if (this.discrepancy > 0) {
      return 'Tu liquidez es mayor que tu flujo de caja. Esto puede deberse a:\n\n' +
             '1. Se registró un egreso en el flujo de caja pero no se actualizó el saldo en liquidez.\n' +
             '2. Falta registrar un ingreso en el flujo de caja.';
    } else if (this.discrepancy < 0) {
      return 'Tu flujo de caja es mayor que tu liquidez. Esto puede deberse a:\n\n' +
             '1. Falta registrar un egreso en el flujo de caja.\n' +
             '2. Se registró un ingreso en el flujo de caja pero no se actualizó el saldo en liquidez.';
    }
    return 'Tu liquidez y flujo de caja están balanceados. ¡Todo en orden!';
  }

  /**
   * Maneja la opción de registrar ingreso/egreso desde el modal de conciliación
   * 
   * Lógica:
   * - Discrepancia NEGATIVA: Flujo de caja > Liquidez → Falta registrar EGRESO
   * - Discrepancia POSITIVA: Liquidez > Flujo de caja → Falta registrar INGRESO
   */
  reconcileByRegisterTransaction() {
    this.closeReconcileModal();
    
    // Determinar tipo de transacción según la discrepancia
    // Si es negativa, falta registrar un egreso; si es positiva, falta registrar un ingreso
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

  /**
   * Maneja la opción de actualizar saldos desde el modal de conciliación
   */
  reconcileByUpdateBalances() {
    this.closeReconcileModal();
    // Navegar a la página de liquidez
    this.router.navigate(['/liquidez']);
  }
}

