import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transaction } from '../../services/transaction.service';

interface RunwayData {
  months: number;
  monthlyAmount: number;
  label: string;
}

@Component({
  selector: 'app-runway-bars',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './runway-bars.component.html',
  styleUrls: ['./runway-bars.component.scss']
})
export class RunwayBarsComponent implements OnChanges {
  @Input() totalLiquidity: number = 0;

  runwayData: RunwayData[] = [];
  maxMonthlyAmount = 0;

  private readonly numberFormatter = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  private readonly periods = [3, 6, 9, 12];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['totalLiquidity']) {
      this.processData();
    }
  }

  processData() {
    if (!this.totalLiquidity || this.totalLiquidity <= 0) {
      this.runwayData = [];
      this.maxMonthlyAmount = 0;
      return;
    }

    // Calcular gasto mensual disponible para cada período
    this.runwayData = this.periods.map(months => {
      const monthlyAmount = this.totalLiquidity / months;
      return {
        months,
        monthlyAmount,
        label: `${months} meses`
      };
    });

    // El máximo es el de 3 meses (el que da más dinero mensual)
    // Usaremos ese como referencia para el 100% del ancho
    const threeMonthsData = this.runwayData.find(d => d.months === 3);
    this.maxMonthlyAmount = threeMonthsData ? threeMonthsData.monthlyAmount : 0;
  }

  getBarWidth(monthlyAmount: number): number {
    if (this.maxMonthlyAmount === 0) return 0;
    // La barra de 3 meses ocupa el 100% del ancho disponible
    // Las otras se escalan proporcionalmente
    // Retornamos porcentaje para usar en el template
    return (monthlyAmount / this.maxMonthlyAmount) * 100;
  }

  formatValue(value: number): string {
    return this.numberFormatter.format(value);
  }
}

