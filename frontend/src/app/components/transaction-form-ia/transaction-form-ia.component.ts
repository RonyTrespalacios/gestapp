import { Component } from '@angular/core';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';

@Component({
  selector: 'app-transaction-form-ia',
  standalone: true,
  imports: [TransactionFormComponent],
  template: `
    <app-transaction-form [forceManualMode]="false"></app-transaction-form>
  `
})
export class TransactionFormIAComponent {}

