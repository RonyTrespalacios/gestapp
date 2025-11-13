import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Transaction } from '../../services/transaction.service';
import { MonthFilterService } from '../../services/month-filter.service';

interface CategoryData {
  categoria: string;
  total: number; // Valor absoluto
  percentage: number;
  color: string;
}

interface MonthOption {
  year: number;
  month: number;
  monthKey: string;
  label: string;
}

@Component({
  selector: 'app-category-bars',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-bars.component.html',
  styleUrls: ['./category-bars.component.scss']
})
export class CategoryBarsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() transactions: Transaction[] = [];

  selectedMonth: string = 'all'; // Inicialmente mostrar todos los registros
  availableMonths: MonthOption[] = [];
  categoryData: CategoryData[] = [];
  private monthFilterSubscription?: Subscription;
  
  chartHeight = 200;
  barHeight = 40;
  barSpacing = 20;
  maxBarWidth = 600;

  private readonly numberFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  private readonly monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  private readonly monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                                      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  private readonly categoryColors: { [key: string]: string } = {
    'Necesidad': '#000',
    'Lujo': '#666',
    'Ahorro': '#999'
  };

  constructor(private monthFilterService: MonthFilterService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['transactions'] && this.transactions) {
      this.updateAvailableMonths();
      // Sincronizar con el servicio
      this.selectedMonth = this.monthFilterService.getSelectedMonth();
      if (!this.selectedMonth) {
        this.selectedMonth = 'all';
        this.monthFilterService.setSelectedMonth('all');
      }
      this.processData();
    }
  }

  ngOnInit() {
    this.updateAvailableMonths();
    
    // Sincronizar con el servicio compartido
    this.selectedMonth = this.monthFilterService.getSelectedMonth() || 'all';
    this.monthFilterService.setSelectedMonth(this.selectedMonth);
    
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
      this.categoryData = [];
      return;
    }

    // Filtrar transacciones: si selectedMonth es 'all', usar todas, sino filtrar por mes
    let filteredTransactions: Transaction[];

    if (this.selectedMonth === 'all' || !this.selectedMonth) {
      // Mostrar todos los registros globales
      filteredTransactions = this.transactions;
    } else {
      // Filtrar por mes seleccionado
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

    // Calcular totales absolutos por categoría
    const categoryTotals: { [key: string]: number } = {
      'Necesidad': 0,
      'Lujo': 0,
      'Ahorro': 0
    };

    // Variables para calcular Ahorro
    let totalEntradas = 0;
    let totalEgresos = 0;

    filteredTransactions.forEach(transaction => {
      // Obtener valor de la transacción
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

      // Calcular Necesidad y Lujo (egresos por categoría)
      if (transaction.categoria === 'Necesidad' || transaction.categoria === 'Lujo') {
        categoryTotals[transaction.categoria] += valorAbsoluto;
      }

      // Acumular Entradas (categoría Entrada) para calcular Ahorro
      if (transaction.categoria === 'Entrada') {
        totalEntradas += valorAbsoluto;
      }

      // Acumular Egresos (todos los tipos Egreso) para calcular Ahorro
      if (transaction.tipo === 'Egreso') {
        totalEgresos += valorAbsoluto;
      }
    });

    // Calcular Ahorro: Suma de Entradas - Suma de Egresos
    categoryTotals['Ahorro'] = Math.max(0, totalEntradas - totalEgresos);

    // Calcular total general (suma de todas las categorías)
    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    // Calcular porcentajes y crear datos de categorías
    this.categoryData = ['Necesidad', 'Lujo', 'Ahorro'].map(categoria => {
      const totalValue = categoryTotals[categoria] || 0;
      const percentage = total > 0 ? (totalValue / total) * 100 : 0;

      return {
        categoria,
        total: totalValue,
        percentage,
        color: this.categoryColors[categoria]
      };
    }).filter(item => item.total > 0); // Solo mostrar categorías con datos
  }

  getBarWidth(percentage: number): number {
    return (percentage / 100) * this.maxBarWidth;
  }

  formatValue(value: number): string {
    return this.numberFormatter.format(value);
  }

  formatPercentage(percentage: number): string {
    return percentage.toFixed(1);
  }

  get totalAmount(): number {
    return this.categoryData.reduce((sum, cat) => sum + cat.total, 0);
  }
}

