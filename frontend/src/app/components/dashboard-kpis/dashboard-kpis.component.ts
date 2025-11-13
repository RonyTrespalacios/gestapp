import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-kpis',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './dashboard-kpis.component.html',
  styleUrls: ['./dashboard-kpis.component.scss']
})
export class DashboardKpisComponent {
  @Input() totalLiquidity = 0;
  @Input() cashFlow = 0;
  @Input() discrepancy = 0;
  @Input() formattedLiquidity = '';
  @Input() formattedCashFlow = '';
  @Input() formattedDiscrepancy = '';
  @Input() isDiscrepancyAcceptable = false;

  @Output() reconcileClick = new EventEmitter<void>();

  showInfoModal = false;
  showReconcileModal = false;

  constructor(private router: Router) {}

  openInfoModal() {
    this.showInfoModal = true;
  }

  closeInfoModal() {
    this.showInfoModal = false;
  }

  openReconcileModal() {
    this.showReconcileModal = true;
  }

  closeReconcileModal() {
    this.showReconcileModal = false;
  }

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

  reconcileByRegisterTransaction() {
    this.closeReconcileModal();
    this.reconcileClick.emit();
  }

  reconcileByUpdateBalances() {
    this.closeReconcileModal();
    this.router.navigate(['/liquidez']);
  }
}

