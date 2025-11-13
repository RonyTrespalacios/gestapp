import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transaction } from '../../services/transaction.service';

interface MonthlyData {
  month: string;
  year: number;
  monthIndex: number;
  accumulated: number;
  displayIndex: number; // Índice para distribución uniforme
}

@Component({
  selector: 'app-cash-flow-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cash-flow-chart.component.html',
  styleUrls: ['./cash-flow-chart.component.scss']
})
export class CashFlowChartComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() transactions: Transaction[] = [];
  @ViewChild('chartContainer', { static: false }) chartContainer?: ElementRef<HTMLDivElement>;

  monthlyData: MonthlyData[] = [];
  chartWidth = 900;
  chartHeight = 450;
  padding = { top: 50, right: 50, bottom: 80, left: 120 };
  maxValue = 0;
  minValue = 0;
  plotWidth = 0;
  plotHeight = 0;

  private readonly numberFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  private readonly monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['transactions'] && this.transactions) {
      // Asegurar que el tamaño esté actualizado antes de procesar
      if (this.chartContainer?.nativeElement) {
        this.updateChartSize();
      }
      this.processData();
    }
  }

  private resizeHandler = () => {
    this.updateChartSize();
    this.processData(); // Reprocesar para recalcular posiciones
  };

  ngOnInit() {
    window.addEventListener('resize', this.resizeHandler);
  }

  ngAfterViewInit() {
    // Esperar a que el DOM esté listo
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
      // Restar el padding del contenedor (30px a cada lado = 60px total)
      const availableWidth = containerWidth - 60;
      // Usar el ancho disponible, con un mínimo de 800px
      // Si el contenedor es más pequeño, el SVG tendrá scroll horizontal
      this.chartWidth = Math.max(800, availableWidth);
    } else {
      // Fallback: usar el ancho de la ventana menos márgenes
      const windowWidth = window.innerWidth || 1200;
      this.chartWidth = Math.max(800, windowWidth - 100);
    }
    
    this.plotWidth = this.chartWidth - this.padding.left - this.padding.right;
    this.plotHeight = this.chartHeight - this.padding.top - this.padding.bottom;
    
    // Asegurar que plotWidth no sea negativo
    if (this.plotWidth < 0) {
      this.plotWidth = 0;
    }
  }

  processData() {
    if (!this.transactions || this.transactions.length === 0) {
      this.monthlyData = [];
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

    // Agrupar por mes y calcular acumulado
    const monthlyMap = new Map<string, {
      year: number;
      month: number;
      accumulated: number;
      sortKey: number;
    }>();

    let accumulated = 0;

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

      accumulated += valor;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          year,
          month,
          accumulated: 0,
          sortKey: year * 12 + month
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.accumulated = accumulated;
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
        accumulated: item.accumulated,
        displayIndex: index // Para distribución uniforme
      };
    });

    // Auto-escalado del eje Y
    if (this.monthlyData.length > 0) {
      const values = this.monthlyData.map(d => d.accumulated);
      const actualMax = Math.max(...values);
      const actualMin = Math.min(...values);
      const range = actualMax - actualMin;

      if (range === 0) {
        const center = actualMax;
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
  }

  /**
   * Calcula posición X uniformemente distribuida
   */
  getXPosition(displayIndex: number): number {
    if (this.monthlyData.length <= 1) {
      return this.padding.left + this.plotWidth / 2;
    }
    return this.padding.left + (displayIndex / (this.monthlyData.length - 1)) * this.plotWidth;
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
   * Genera path para la línea del gráfico
   */
  getChartPath(): string {
    if (this.monthlyData.length === 0) return '';

    const points = this.monthlyData.map(data => {
      const x = this.getXPosition(data.displayIndex);
      const y = this.getYPosition(data.accumulated);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }

  /**
   * Genera path para el área bajo la curva
   */
  getAreaPath(): string {
    if (this.monthlyData.length === 0) return '';

    const linePath = this.getChartPath();
    const firstX = this.getXPosition(0);
    const lastX = this.getXPosition(this.monthlyData.length - 1);
    const bottomY = this.padding.top + this.plotHeight;

    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }

  /**
   * Obtiene todos los puntos del gráfico con sus posiciones
   */
  getChartPoints(): Array<{ x: number, y: number, value: number, month: string, isLast: boolean }> {
    if (this.monthlyData.length === 0) return [];

    return this.monthlyData.map((data, index) => ({
      x: this.getXPosition(data.displayIndex),
      y: this.getYPosition(data.accumulated),
      value: data.accumulated,
      month: data.month,
      isLast: index === this.monthlyData.length - 1
    }));
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
