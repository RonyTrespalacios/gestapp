import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Transaction } from '../../services/transaction.service';
import { MonthFilterService } from '../../services/month-filter.service';

interface TopTransaction {
  transaction: Transaction;
  amount: number;
  formattedAmount: string;
}

interface TopDescription {
  descripcion: string;
  total: number;
  formattedTotal: string;
  count: number;
}

interface MonthOption {
  year: number;
  month: number;
  monthKey: string;
  label: string;
}

@Component({
  selector: 'app-top-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './top-transactions.component.html',
  styleUrls: ['./top-transactions.component.scss']
})
export class TopTransactionsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() transactions: Transaction[] = [];

  selectedMonth: string = 'all';
  availableMonths: MonthOption[] = [];
  topTransactions: TopTransaction[] = [];
  topDescriptions: TopDescription[] = [];
  
  private monthFilterSubscription?: Subscription;

  private readonly numberFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  private readonly monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                                      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  constructor(private monthFilterService: MonthFilterService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['transactions'] && this.transactions) {
      this.updateAvailableMonths();
      this.selectedMonth = this.monthFilterService.getSelectedMonth() || 'all';
      this.processData();
    }
  }

  ngOnInit() {
    this.updateAvailableMonths();
    
    // Sincronizar con el servicio compartido
    this.selectedMonth = this.monthFilterService.getSelectedMonth() || 'all';
    
    // Suscribirse a cambios del filtro
    this.monthFilterSubscription = this.monthFilterService.selectedMonth$.subscribe(month => {
      if (this.selectedMonth !== month) {
        this.selectedMonth = month;
        this.processData();
      }
    });
    
    this.processData();
  }

  ngOnDestroy() {
    if (this.monthFilterSubscription) {
      this.monthFilterSubscription.unsubscribe();
    }
  }

  onMonthChange() {
    // Actualizar el servicio compartido cuando cambia el filtro
    this.monthFilterService.setSelectedMonth(this.selectedMonth);
    this.processData();
  }

  updateAvailableMonths() {
    if (!this.transactions || this.transactions.length === 0) {
      this.availableMonths = [];
      return;
    }

    const monthMap = new Map<string, { year: number, month: number }>();

    this.transactions.forEach(transaction => {
      if (!transaction.fecha) return;
      
      const date = new Date(transaction.fecha);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${month}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { year, month });
      }
    });

    this.availableMonths = Array.from(monthMap.entries())
      .map(([monthKey, { year, month }]) => ({
        year,
        month,
        monthKey,
        label: `${this.monthNamesShort[month]} ${year}`
      }))
      .sort((a, b) => {
        // Ordenar de más reciente a más antiguo (descendente)
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }

  processData() {
    if (!this.transactions || this.transactions.length === 0) {
      this.topTransactions = [];
      this.topDescriptions = [];
      return;
    }

    // Filtrar transacciones por mes si está seleccionado
    let filteredTransactions: Transaction[];

    if (this.selectedMonth === 'all' || !this.selectedMonth) {
      filteredTransactions = this.transactions;
    } else {
      const [yearStr, monthStr] = this.selectedMonth.split('-');
      const selectedYear = parseInt(yearStr, 10);
      const selectedMonthNum = parseInt(monthStr, 10);

      filteredTransactions = this.transactions.filter(transaction => {
        if (!transaction.fecha) return false;
        
        const date = new Date(transaction.fecha);
        if (isNaN(date.getTime())) return false;

        const year = date.getFullYear();
        const month = date.getMonth();

        return year === selectedYear && month === selectedMonthNum;
      });
    }

    // Top 5 egresos más grandes (filtrar por tipo Egreso)
    const transactionsWithAmount = filteredTransactions
      .filter(transaction => transaction.tipo === 'Egreso') // Solo egresos
      .map(transaction => {
        let valor = 0;
        if (transaction.valor !== undefined && transaction.valor !== null) {
          valor = typeof transaction.valor === 'string' 
            ? Number(transaction.valor) 
            : transaction.valor ?? 0;
        } else {
          const monto = typeof transaction.monto === 'string' 
            ? Number(transaction.monto) 
            : transaction.monto ?? 0;
          valor = monto;
        }

        return {
          transaction,
          amount: Math.abs(valor)
        };
      })
      .filter(item => Number.isFinite(item.amount) && item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(item => ({
        transaction: item.transaction,
        amount: item.amount,
        formattedAmount: this.formatValue(item.amount)
      }));

    this.topTransactions = transactionsWithAmount;

    // Top 5 descripciones con más gasto neto (agrupado por descripción)
    const descriptionMap = new Map<string, { total: number, count: number }>();

    filteredTransactions.forEach(transaction => {
      // Solo considerar egresos para el gasto neto
      if (transaction.tipo !== 'Egreso') return;

      const descripcion = transaction.descripcion || 'Sin descripción';
      
      let valor = 0;
      if (transaction.valor !== undefined && transaction.valor !== null) {
        valor = typeof transaction.valor === 'string' 
          ? Number(transaction.valor) 
          : transaction.valor ?? 0;
      } else {
        const monto = typeof transaction.monto === 'string' 
          ? Number(transaction.monto) 
          : transaction.monto ?? 0;
        valor = monto;
      }

      if (!Number.isFinite(valor)) return;

      const valorAbsoluto = Math.abs(valor);
      if (valorAbsoluto <= 0) return;

      if (!descriptionMap.has(descripcion)) {
        descriptionMap.set(descripcion, { total: 0, count: 0 });
      }

      const descData = descriptionMap.get(descripcion)!;
      descData.total += valorAbsoluto;
      descData.count += 1;
    });

    // Convertir a array, ordenar y tomar top 5
    this.topDescriptions = Array.from(descriptionMap.entries())
      .map(([descripcion, { total, count }]) => ({
        descripcion,
        total,
        formattedTotal: this.formatValue(total),
        count
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  formatValue(value: number): string {
    return this.numberFormatter.format(value);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

