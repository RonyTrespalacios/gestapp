import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  { 
    path: 'registrar/manual', 
    loadComponent: () => import('./components/transaction-form-manual/transaction-form-manual.component').then(m => m.TransactionFormManualComponent),
    runGuardsAndResolvers: 'always'
  },
  { 
    path: 'registrar/ia', 
    loadComponent: () => import('./components/transaction-form-ia/transaction-form-ia.component').then(m => m.TransactionFormIAComponent),
    runGuardsAndResolvers: 'always'
  },
  { 
    path: 'datos', 
    loadComponent: () => import('./components/data-table/data-table.component').then(m => m.DataTableComponent) 
  },
  { path: '**', redirectTo: '/home' }
];
