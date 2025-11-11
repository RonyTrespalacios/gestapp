import { Routes } from '@angular/router';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/registrar', pathMatch: 'full' },
  { path: 'registrar', component: TransactionFormComponent },
  { 
    path: 'datos', 
    loadComponent: () => import('./components/data-table/data-table.component').then(m => m.DataTableComponent) 
  }
];
