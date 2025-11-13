import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transaction } from '../../services/transaction.service';

interface MonthlyBarData {
  month: string;
  year: number;
  monthIndex: number;
  value: number; // Flujo mensual (no acumulado)
  displayIndex: number;
}

@Component({
  selector: 'app-cash-flow-bars',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cash-flow-bars.component.html',
  styleUrls: ['./cash-flow-bars.component.scss']
})
export class CashFlowBarsComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() transactions: Transaction[] = [];
  @ViewChild('chartContainer', { static: false }) chartContainer?: ElementRef<HTMLDivElement>;

  monthlyData: MonthlyBarData[] = [];
  barsData: Array<{ x: number, y: number, width: number, height: number, isPositive: boolean, centerX: number, value: number, month: string }> = [];
  chartWidth = 900;
  chartHeight = 450;
  padding = { top: 50, right: 50, bottom: 80, left: 120 };
  maxValue = 0;
  minValue = 0;
  plotWidth = 0;
  plotHeight = 0;
  barWidth = 0;

  private readonly numberFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  private readonly monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['transactions'] && this.transactions) {
      if (this.chartContainer?.nativeElement) {
        this.updateChartSize();
      }
      this.processData();
    }
  }

  private resizeHandler = () => {
    this.updateChartSize();
    this.processData();
  };

  ngOnInit() {
    window.addEventListener('resize', this.resizeHandler);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateChartSize();
      if (this.transactions && this.transactions.length > 0) {
        this.processData();
      }
    }, 0);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
  }

  updateChartSize() {
    if (this.chartContainer?.nativeElement) {
      const containerWidth = this.chartContainer.nativeElement.offsetWidth;
      const availableWidth = containerWidth - 60;
      this.chartWidth = Math.max(800, availableWidth);
    } else {
      const windowWidth = window.innerWidth || 1200;
      this.chartWidth = Math.max(800, windowWidth - 100);
    }
    
    this.plotWidth = this.chartWidth - this.padding.left - this.padding.right;
    this.plotHeight = this.chartHeight - this.padding.top - this.padding.bottom;
    
    if (this.plotWidth < 0) {
      this.plotWidth = 0;
    }
    
    // Recalcular datos de barras después de actualizar tamaño
    if (this.monthlyData.length > 0) {
      this.updateBarsData();
    }
  }

  processData() {
    if (!this.transactions || this.transactions.length === 0) {
      this.monthlyData = [];
      this.barsData = [];
      this.maxValue = 0;
      this.minValue = 0;
      return;
    }

    // Filtrar y ordenar transacciones por fecha
    const sorted = [...this.transactions]
      .filter(t => t.fecha)
      .map(t => {
        const date = new Date(t.fecha);
        if (isNaN(date.getTime())) {
          return null;
        }
        return { ...t, parsedDate: date };
      })
      .filter((t): t is Transaction & { parsedDate: Date } => t !== null)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    // Agrupar por mes y calcular flujo mensual (no acumulado)
    const monthlyMap = new Map<string, {
      year: number;
      month: number;
      total: number; // Suma del mes (puede ser positivo o negativo)
      sortKey: number;
    }>();

    sorted.forEach(transaction => {
      const date = transaction.parsedDate;
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${month}`;

      const valor = typeof transaction.valor === 'string'
        ? Number(transaction.valor)
        : transaction.valor ?? 0;

      if (!Number.isFinite(valor)) {
        return;
      }

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          year,
          month,
          total: 0,
          sortKey: year * 12 + month
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.total += valor;
    });

    // Convertir a array y ordenar
    const allMonths = Array.from(monthlyMap.values())
      .sort((a, b) => a.sortKey - b.sortKey);

    if (allMonths.length === 0) {
      this.monthlyData = [];
      this.maxValue = 0;
      this.minValue = 0;
      return;
    }

    // Tomar últimos 12 meses
    const last12Months = allMonths.slice(-12);

    // Formatear datos
    this.monthlyData = last12Months.map((item, index) => {
      const monthName = `${this.monthNames[item.month]}${item.year}`;
      return {
        month: monthName,
        year: item.year,
        monthIndex: item.month,
        value: item.total,
        displayIndex: index
      };
    });

    // Calcular ancho de barras
    if (this.monthlyData.length > 0) {
      const spacing = this.plotWidth / this.monthlyData.length;
      this.barWidth = Math.max(20, Math.min(60, spacing * 0.6)); // 60% del espacio, mínimo 20px, máximo 60px
    }

    // Auto-escalado del eje Y
    if (this.monthlyData.length > 0) {
      const values = this.monthlyData.map(d => d.value);
      const actualMax = Math.max(...values, 0);
      const actualMin = Math.min(...values, 0);
      const range = actualMax - actualMin;

      if (range === 0) {
        const center = actualMax || actualMin || 0;
        this.maxValue = center + Math.abs(center) * 0.15 || 1000;
        this.minValue = center - Math.abs(center) * 0.15 || -1000;
      } else {
        const padding = range * 0.15;
        this.maxValue = actualMax + padding;
        this.minValue = actualMin - padding;
      }
    } else {
      this.maxValue = 0;
      this.minValue = 0;
    }

    // Pre-calcular datos de barras para el template
    this.updateBarsData();
  }

  /**
   * Pre-calcula todos los datos de las barras para optimizar el template
   */
  updateBarsData() {
    this.barsData = this.monthlyData.map(data => {
      const coords = this.getBarCoordinates(data);
      return {
        ...coords,
        centerX: this.getBarCenterX(data.displayIndex),
        value: data.value,
        month: data.month
      };
    });
  }

  /**
   * Calcula posición X del centro de la barra
   */
  getBarCenterX(displayIndex: number): number {
    if (this.monthlyData.length <= 1) {
      return this.padding.left + this.plotWidth / 2;
    }
    const spacing = this.plotWidth / this.monthlyData.length;
    return this.padding.left + (displayIndex * spacing) + (spacing / 2);
  }

  /**
   * Calcula posición Y escalada
   */
  getYPosition(value: number): number {
    const range = this.maxValue - this.minValue || 1;
    const normalized = (value - this.minValue) / range;
    return this.padding.top + this.plotHeight - (normalized * this.plotHeight);
  }

  /**
   * Obtiene las coordenadas de una barra
   */
  getBarCoordinates(data: MonthlyBarData): { x: number, y: number, width: number, height: number, isPositive: boolean } {
    const centerX = this.getBarCenterX(data.displayIndex);
    const x = centerX - (this.barWidth / 2);
    const zeroY = this.getYPosition(0);
    const valueY = this.getYPosition(data.value);
    
    const isPositive = data.value >= 0;
    const barHeight = Math.abs(zeroY - valueY);
    const y = isPositive ? valueY : zeroY;

    return {
      x,
      y,
      width: this.barWidth,
      height: barHeight,
      isPositive
    };
  }

  /**
   * Genera etiquetas para el eje Y
   */
  getYAxisLabels(): Array<{ value: number, y: number }> {
    if (this.monthlyData.length === 0) return [];

    const range = this.maxValue - this.minValue || 1;
    const steps = 6;
    const labels: Array<{ value: number, y: number }> = [];

    for (let i = 0; i <= steps; i++) {
      const value = this.minValue + (range / steps) * i;
      const y = this.getYPosition(value);
      labels.push({ value, y });
    }

    return labels;
  }

  formatValue(value: number): string {
    return this.numberFormatter.format(value);
  }
}

