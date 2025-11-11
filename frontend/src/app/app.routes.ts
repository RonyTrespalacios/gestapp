import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  { 
    path: 'registrar/manual', 
    loadComponent: () => import('./components/transaction-form-manual/transaction-form-manual.component').then(m => m.TransactionFormManualComponent),
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always'
  },
  { 
    path: 'registrar/ia', 
    loadComponent: () => import('./components/transaction-form-ia/transaction-form-ia.component').then(m => m.TransactionFormIAComponent),
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always'
  },
  { 
    path: 'datos', 
    loadComponent: () => import('./components/data-table/data-table.component').then(m => m.DataTableComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/home' }
];
