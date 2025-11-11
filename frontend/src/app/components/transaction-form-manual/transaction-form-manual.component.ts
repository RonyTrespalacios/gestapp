import { Component } from '@angular/core';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';

@Component({
  selector: 'app-transaction-form-manual',
  standalone: true,
  imports: [TransactionFormComponent],
  template: `
    <app-transaction-form [forceManualMode]="true"></app-transaction-form>
  `
})
export class TransactionFormManualComponent {}

