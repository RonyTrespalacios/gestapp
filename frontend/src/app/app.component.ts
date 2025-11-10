import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TransactionFormComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>💰 GestApp</h1>
        <p>Gestión de Gastos Personales</p>
      </header>
      <main class="app-main">
        <app-transaction-form></app-transaction-form>
      </main>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'GestApp';
}
